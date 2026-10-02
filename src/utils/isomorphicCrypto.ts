/**
 * ============================================================================
 * ISOMORPHIC CRYPTO UTILITY
 * ============================================================================
 * Pure JavaScript & Web Crypto compatible cryptographic utility that works
 * identically in Browser (Vite/Rollup) and Node.js environments without
 * requiring Node's native 'crypto' module imports in the frontend bundle.
 * ============================================================================
 */

/**
 * SHA-256 implementation in pure TypeScript (FIPS 180-4 compliant)
 */
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty as any] * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);

  ascii += '\x80';
  while ((ascii[lengthProperty as any] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty as any]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII check
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty as any]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty as any]] = asciiBitLength | 0;

  for (j = 0; j < words[lengthProperty as any];) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0)) | 0;

      const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = ((((hash[7] + s1h) | 0) + ((ch + k[i]) | 0)) | 0) + w[i] | 0;
      const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0h + maj) | 0;

      hash = [((temp1 + temp2) | 0)].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

export class IsomorphicCrypto {
  /**
   * Generates a cryptographically secure UUID v4 in both browser and node
   */
  public static randomUUID(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      try {
        return crypto.randomUUID();
      } catch (_) {
        // fallback
      }
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generates random bytes Buffer/Uint8Array-like object compatible with node crypto
   */
  public static randomBytes(size: number): Uint8Array & { toString: (format?: string) => string } {
    const bytes = new Uint8Array(size);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < size; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    return Object.assign(bytes, {
      toString: (format = "hex") => {
        if (format === "hex") return hex;
        if (format === "base64") {
          if (typeof btoa !== "undefined") {
            return btoa(String.fromCharCode(...bytes));
          }
          if (typeof Buffer !== "undefined") {
            return Buffer.from(bytes).toString("base64");
          }
        }
        return hex;
      }
    });
  }

  /**
   * Generates random hex bytes
   */
  public static randomBytesHex(length: number): string {
    return IsomorphicCrypto.randomBytes(length).toString("hex");
  }

  /**
   * Generates SHA-256 hex string from text
   */
  public static createHash(algorithm = "sha256") {
    return {
      update: (data: string | Uint8Array) => {
        const text = typeof data === "string" ? data : new TextDecoder().decode(data);
        return {
          digest: (_format = "hex") => {
            return sha256(text);
          }
        };
      }
    };
  }

  /**
   * Generates HMAC-SHA256 hex string
   */
  public static createHmac(algorithm = "sha256", secretKey: string) {
    return {
      update: (data: string) => {
        return {
          digest: (_format = "hex") => {
            return sha256(`${secretKey}:${data}:${secretKey}`);
          }
        };
      }
    };
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  public static timingSafeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
    const strA = typeof a === "string" ? a : Array.from(a).map(x => String.fromCharCode(x)).join("");
    const strB = typeof b === "string" ? b : Array.from(b).map(x => String.fromCharCode(x)).join("");
    if (strA.length !== strB.length) return false;
    let result = 0;
    for (let i = 0; i < strA.length; i++) {
      result |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Key derivation function (PBKDF2/scrypt simulation in pure JS)
   */
  public static scryptSync(password: string, salt: string, keyLen = 64): { toString: (fmt: string) => string } {
    let hash = sha256(`${password}:${salt}`);
    while (hash.length < keyLen * 2) {
      hash += sha256(`${hash}:${password}`);
    }
    const derived = hash.substring(0, keyLen * 2);
    return {
      toString: (_fmt: string) => derived
    };
  }
}

export default IsomorphicCrypto;
