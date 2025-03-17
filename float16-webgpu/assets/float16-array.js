export class Float16Array extends Uint16Array {
  constructor(length) {
    super(length);
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // Attempt to parse 'prop' as a numeric index
        const index = Number(prop);
        // If the prop is a valid integer index, return the half->float conversion
        if (!Number.isNaN(index) && Number.isInteger(index)) {
          return castFloat16ToFloat32(target[index]);
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
      },
      set: (target, prop, value, receiver) => {
        const index = Number(prop);
        if (!Number.isNaN(index) && Number.isInteger(index)) {
          return Reflect.set(target, index, castFloat32ToFloat16(Number(value)), receiver);
        }
      }
    });
  }
}

/**
 * Convert a 32-bit float to a 16-bit half-precision float.
 * Uses round-to-nearest (ties to even) per IEEE 754.
 */
export function castFloat32ToFloat16(val) {
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
export function castFloat16ToFloat32(val) {
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
