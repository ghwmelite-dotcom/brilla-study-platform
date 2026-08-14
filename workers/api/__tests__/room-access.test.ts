import { describe, expect, it } from 'vitest';
import { hashRoomPassword, verifyRoomPassword } from '../room-access';

describe('study room password protection', () => {
  it('stores a salted one-way password representation and verifies it', async () => {
    const encoded = await hashRoomPassword('correct horse battery staple');
    expect(encoded).not.toContain('correct horse battery staple');
    await expect(verifyRoomPassword('correct horse battery staple', encoded)).resolves.toBe(true);
    await expect(verifyRoomPassword('wrong password', encoded)).resolves.toBe(false);
  });

  it('fails closed for malformed stored values', async () => {
    await expect(verifyRoomPassword('anything', 'legacy-plaintext')).resolves.toBe(false);
  });
});
