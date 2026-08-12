import { describe, it, expect } from 'vitest';
import { sniffImageType } from '../index';

// Regression tests for task 9: avatar uploads must be validated by magic
// bytes, not by the client-supplied file.type or filename extension.
const bytes = (...vals: number[]) => new Uint8Array(vals);

describe('sniffImageType', () => {
  it('accepts a real PNG (89 50 4E 47 0D 0A 1A 0A)', () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0);
    expect(sniffImageType(png)).toBe('image/png');
  });

  it('accepts a real JPEG (FF D8 FF)', () => {
    const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1);
    expect(sniffImageType(jpeg)).toBe('image/jpeg');
  });

  it('accepts a real GIF (GIF8)', () => {
    const gif = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0, 0);
    expect(sniffImageType(gif)).toBe('image/gif');
  });

  it('accepts a real WebP (RIFF....WEBP)', () => {
    const webp = bytes(0x52, 0x49, 0x46, 0x46, 0x1a, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
    expect(sniffImageType(webp)).toBe('image/webp');
  });

  it('rejects a text file renamed to .png', () => {
    const text = new TextEncoder().encode('this is definitely not an image file');
    expect(sniffImageType(text)).toBeNull();
  });

  it('rejects RIFF files that are not WebP (e.g. WAV)', () => {
    const wav = bytes(0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x41, 0x56, 0x45);
    expect(sniffImageType(wav)).toBeNull();
  });

  it('rejects files shorter than 12 bytes', () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47))).toBeNull();
    expect(sniffImageType(bytes())).toBeNull();
  });
});
