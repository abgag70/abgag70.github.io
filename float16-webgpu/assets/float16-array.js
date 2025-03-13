export class Float16Array extends Uint16Array {
    constructor(length) {
        super(length);
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // Attempt to parse 'prop' as a numeric index
                const index = Number(prop);
                // If the prop is a valid integer index, return the half->float conversion
                if (!Number.isNaN(index) && Number.isInteger(index)) {
                    return halfToFloat(target[index]);
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
                    return Reflect.set(target, index, floatToHalf(Number(value)), receiver);
                }
                // Otherwise, treat it as a normal property
                return Reflect.set(target, prop, value, receiver);
            }
        });
    }
}

/**
 * Convert a 32-bit float to a 16-bit half-precision float.
 * Uses round-to-nearest (ties to even) per IEEE 754.
 */
function floatToHalf(val) {
    const f32 = new Float32Array(1);
    const u32 = new Uint32Array(f32.buffer);
    f32[0] = val;
    const f = u32[0];
  
    // Extract sign (1 bit), exponent (8 bits), and fraction (23 bits)
    const sign = (f >> 31) & 0x1;
    const exp = (f >> 23) & 0xff;
    const frac = f & 0x7fffff;
    const halfSign = sign << 15;
  
    // Handle special cases: Inf and NaN.
    if (exp === 0xff) {
      // NaN: propagate at least one nonzero bit.
      if (frac !== 0) {
        return halfSign | 0x7e00;
      }
      return halfSign | 0x7c00; // Infinity.
    }
  
    // Adjust exponent from float32 bias (127) to half bias (15).
    let newExp = exp - 127 + 15;
  
    if (newExp >= 0x1f) {
      // Overflow: represent as infinity.
      return halfSign | 0x7c00;
    } else if (newExp <= 0) {
      // Handle subnormal numbers and underflow.
      if (newExp < -10) {
        // Too small: underflow to zero.
        return halfSign;
      }
      // Add implicit leading one to mantissa.
      let mantissa = frac | 0x800000;
      // Determine the number of bits to shift to form a subnormal half.
      const shift = 14 - newExp; // newExp is <= 0.
      // Extract the bits that will be shifted out for rounding.
      const extra = mantissa & ((1 << shift) - 1);
      let halfMantissa = mantissa >> shift;
      const roundBit = 1 << (shift - 1);
      // Round to nearest even.
      if (extra > roundBit || (extra === roundBit && (halfMantissa & 1))) {
        halfMantissa++;
      }
      return halfSign | (halfMantissa & 0x3ff);
    } else {
      // Normalized number.
      let halfExp = newExp;
      // Drop lower 13 bits from fraction (23 - 10 = 13) and round.
      let halfMantissa = frac >> 13;
      const extra = frac & 0x1fff; // The lower 13 bits.
      const roundBit = 0x1000; // 1 << 12.
      if (extra > roundBit || (extra === roundBit && (halfMantissa & 1))) {
        halfMantissa++;
        if (halfMantissa === 0x400) { // Mantissa overflow (10 bits exceeded)
          halfExp++;
          halfMantissa = 0;
          if (halfExp >= 0x1f) {
            // Exponent overflow to infinity.
            return halfSign | 0x7c00;
          }
        }
      }
      return halfSign | (halfExp << 10) | (halfMantissa & 0x3ff);
    }
  }
  
  /**
   * Convert a 16-bit half-precision float back to a 32-bit float.
   */
  function halfToFloat(val) {
    const sign = (val >> 15) & 0x1;
    const exp = (val >> 10) & 0x1f;
    const frac = val & 0x3ff;
    let f;
    if (exp === 0) {
      f = frac === 0 ? 0 : (frac / 1024) * Math.pow(2, -14);
    } else if (exp === 0x1f) {
      f = frac === 0 ? Infinity : NaN;
    } else {
      f = (1 + frac / 1024) * Math.pow(2, exp - 15);
    }
    return sign ? -f : f;
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