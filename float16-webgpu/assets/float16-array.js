export class Float16Array extends Uint16Array {
    constructor(length) {
        super(length);

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // Attempt to parse 'prop' as a numeric index
                const index = Number(prop);

                // If the prop is a valid integer index, return the half->float conversion
                if (!Number.isNaN(index) && Number.isInteger(index)) {
                    return Float16Array.halfToFloat(target[index]);
                }

                if (prop == "byteLength") {
                    return target.byteLength
                }
                if (prop == "buffer") {
                    return target.buffer
                }
                if (prop == "byteOffset") {
                    return target.byteOffset
                }
                if (prop == "length") {
                    return target.length
                }
                return Reflect.get(target, prop, receiver);
            },
            set: (target, prop, value, receiver) => {
                // Attempt to parse 'prop' as a numeric index
                const index = Number(prop);

                // If the prop is a valid integer index, set via float->half conversion
                if (!Number.isNaN(index) && Number.isInteger(index)) {
                    return Reflect.set(target, index, Float16Array.floatToHalf(Number(value)), receiver);
                }

                // Otherwise, treat it as a normal property
                return Reflect.set(target, prop, value, receiver);
            }
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
        } else if (exponent < -14) {
            // Underflow: may be subnormal or zero.
            if (exponent < -24) {
                return sign; // Underflow to zero.
            }
            mantissa |= 0x800000;
            const shift = -exponent - 14;
            mantissa = mantissa >> (shift + 13);
            return sign | mantissa;
        } else {
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
        } else if (exponent === 0x1f) {
            f = mantissa === 0 ? Infinity : NaN;
        } else {
            f = (1 + mantissa / 1024) * Math.pow(2, exponent - 15);
        }

        return sign ? -f : f;
    }
}

export function float16ToFloat32(h) {
    // Extract the sign (1 bit), exponent (5 bits), and fraction (10 bits)
    const sign = (h & 0x8000) >> 15;
    const exponent = (h & 0x7C00) >> 10;
    const fraction = h & 0x03FF;

    let f32;

    if (exponent === 0) {
        // Case for subnormals (or zero)
        if (fraction === 0) {
            // Zero (with sign)
            f32 = sign ? -0 : 0;
        } else {
            // Subnormal numbers: convert to normalized format manually
            // The exponent for subnormals is effectively -14
            f32 = Math.pow(-1, sign) * Math.pow(2, -14) * (fraction / 1024);
        }
    } else if (exponent === 0x1F) {
        // Special case: Inf or NaN
        if (fraction === 0) {
            f32 = sign ? -Infinity : Infinity;
        } else {
            f32 = NaN;
        }
    } else {
        // Normalized number: adjust exponent bias (15 for half-precision, 127 for single)
        const exp32 = exponent - 15 + 127;
        // The mantissa is adjusted to include the implicit leading 1 (for normalized numbers)
        // Multiply by 2^(exp32 - 127) to account for the exponent difference in 32-bit representation
        f32 = Math.pow(-1, sign) * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
    }

    return f32;
}

// // ----- Example usage -----
// const f16 = new Float16Array(4);
// f16[0] = 1.5;
// f16[1] = -2.5;
// f16[2] = 0.1;
// f16[3] = 1000;

// console.log(f16[0]);         // 1.5
// console.log(f16[1]);         // -2.5
// console.log(f16[2]);         // ~0.1
// console.log(f16[3]);         // 1000 (or possibly Infinity if out of range)

// // Accessing non-integer properties now properly reflects to the original TypedArray:
// console.log(f16.buffer);     // ArrayBuffer { ... } - the underlying buffer
// console.log(f16.byteLength); // 8 (4 elements * 2 bytes per element)
