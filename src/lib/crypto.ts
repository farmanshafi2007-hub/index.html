/**
 * End-to-End Encryption (E2EE) utilities using the browser's native Web Crypto API.
 * Uses AES-GCM 256-bit encryption with a key derived from Room ID & optional Secret Passphrase.
 */

// Cache derived CryptoKeys in memory
const keyCache = new Map<string, CryptoKey>();

async function getDerivedKey(roomId: string, secretPassphrase: string = ''): Promise<CryptoKey> {
  const cacheKey = `${roomId}:${secretPassphrase}`;
  const existing = keyCache.get(cacheKey);
  if (existing) return existing;

  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(`${roomId}:${secretPassphrase || 'default-room-salt-key-v1'}`);
  
  // Base key from password/room
  const baseKey = await crypto.subtle.importKey(
    'raw',
    rawKeyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = enc.encode(`salt:${roomId}`);
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 10000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, derivedKey);
  return derivedKey;
}

export async function encryptText(
  plainText: string,
  roomId: string,
  secretPassphrase: string = ''
): Promise<string> {
  try {
    const key = await getDerivedKey(roomId, secretPassphrase);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    const ivArray = Array.from(iv);
    const cipherArray = Array.from(new Uint8Array(ciphertext));
    const payload = JSON.stringify({
      v: 1,
      iv: ivArray,
      data: cipherArray,
    });

    return `E2EE:${btoa(payload)}`;
  } catch (err) {
    console.error('E2EE Encryption error:', err);
    return plainText; // Fallback
  }
}

export async function decryptText(
  cipherPayload: string,
  roomId: string,
  secretPassphrase: string = ''
): Promise<string> {
  if (!cipherPayload.startsWith('E2EE:')) {
    return cipherPayload;
  }

  try {
    const jsonStr = atob(cipherPayload.slice(5));
    const parsed = JSON.parse(jsonStr);
    const iv = new Uint8Array(parsed.iv);
    const data = new Uint8Array(parsed.data);

    const key = await getDerivedKey(roomId, secretPassphrase);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // If passphrase doesn't match or corrupted
    return '[Encrypted message - Passphrase required or mismatch]';
  }
}
