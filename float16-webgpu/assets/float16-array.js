export class Float16Array extends Uint16Array {
    constructor(length) {
        super(length);
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // If prop is numeric (or a string representing a number)
                if (typeof prop === "number" || typeof prop === "string") {
                    let index = Number(prop);
                    if (!Number.isInteger(index)) {
                        index = Math.floor(index);
                    }
                    return Float16Array.halfToFloat(target[index]);
                }
                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value, receiver) => {
                if (typeof prop === "number" || typeof prop === "string") {
                    const index = Number(prop);
                    if (!Number.isInteger(index)) {
                        index = Math.floor(index);
                    }
                    return Reflect.set(target, index, Float16Array.floatToHalf(Number(value)));
                }
                return Reflect.set(target, prop, value, receiver);
            },
        });
    }
    // Convert a 32-bit float to a 16-bit half-precision value.
    static floatToHalf(val) {
        const floatView = new Float32Array(1);
        const int32View = new Uint32Array(floatView.buffer);
        floatView[0] = val;
        const x = int32View[0];
        const sign = (x >> 16) & 0x8000;
        let exponent = ((x >> 23) & 0xff) - 127;
        let mantissa = x & 0x7fffff;
        if (exponent > 15) {
            // Overflow: represent as infinity.
            return sign | 0x7c00;
        }
        else if (exponent < -14) {
            // Underflow: may be subnormal or zero.
            if (exponent < -24) {
                return sign; // Underflow to zero.
            }
            mantissa |= 0x800000;
            const shift = -exponent - 14;
            mantissa = mantissa >> (shift + 13);
            return sign | mantissa;
        }
        else {
            // Normalized value.
            exponent = exponent + 15;
            mantissa = mantissa >> 13;
            return sign | (exponent << 10) | mantissa;
        }
    }
    // Convert a 16-bit half-precision value back to a 32-bit float.
    static halfToFloat(val) {
        const sign = (val & 0x8000) >> 15;
        let exponent = (val & 0x7c00) >> 10;
        const mantissa = val & 0x03ff;
        let f;
        if (exponent === 0) {
            f = mantissa === 0 ? 0 : (mantissa / 1024) * Math.pow(2, -14);
        }
        else if (exponent === 0x1f) {
            f = mantissa === 0 ? Infinity : NaN;
        }
        else {
            f = (1 + mantissa / 1024) * Math.pow(2, exponent - 15);
        }
        return sign ? -f : f;
    }
}
// ----- Example usage -----
// const f16 = new Float16Array(4);
// f16[0] = 1.5;
// f16[1] = -2.5;
// f16[2] = 0.1;
// f16[3] = 1000;
// console.log(f16[0]); // 1.5
// console.log(f16[1]); // -2.5
// console.log(f16[2]); // Approximately 0.1
// console.log(f16[3]); // 1000 (or Infinity if out of half-precision range)
// Trying to access with a non-integer index will throw an error:
// f16["1.5"] = 3; // Error: Index must be an integer
