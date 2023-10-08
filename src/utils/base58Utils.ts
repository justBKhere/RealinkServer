import * as bs58 from 'bs58';

/**
 * Converts a Uint8Array to a base58 string.
 *
 * @param {Uint8Array} uint8Array - The Uint8Array to convert.
 * @return {string} - The converted base58 string.
 */
export const uint8ArrayToBase58 = (uint8Array: Uint8Array): string => {
  const buffer = Buffer.from(uint8Array);
  return bs58.encode(buffer);
};

/**
 * Converts a base58 string to a Uint8Array.
 *
 * @param {string} base58String - The base58 string to convert.
 * @return {Uint8Array} - The converted Uint8Array.
 */
export const base58ToUint8Array = (base58String: string): Uint8Array => {
  const buffer = bs58.decode(base58String);
  return new Uint8Array(buffer);
};
