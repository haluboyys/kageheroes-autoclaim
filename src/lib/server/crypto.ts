const ALGORITHM = 'AES-GCM';

function encKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', enc, { name: ALGORITHM }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(text: string, secret = 'kage-secret-key-32-chars-length'): Promise<string> {
  const key = await encKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
  
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(cipherBase64: string, secret = 'kage-secret-key-32-chars-length'): Promise<string> {
  try {
    const key = await encKey(secret);
    const binary = atob(cipherBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, cipher);
    return new TextDecoder().decode(decrypted);
  } catch {
    return cipherBase64; // Fallback in case of raw string
  }
}
