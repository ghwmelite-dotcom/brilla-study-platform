const ROOM_KDF_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ROOM_KDF_ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashRoomPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return `pbkdf2-sha256$${ROOM_KDF_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyRoomPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, iterations, saltValue, hashValue] = encoded.split('$');
  if (algorithm !== 'pbkdf2-sha256' || Number(iterations) !== ROOM_KDF_ITERATIONS || !saltValue || !hashValue) {
    return false;
  }
  try {
    const expected = base64ToBytes(hashValue);
    const actual = await derive(password, base64ToBytes(saltValue));
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
    return difference === 0;
  } catch {
    return false;
  }
}
