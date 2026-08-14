// @vitest-environment jsdom
// jsdom is backed by the installed `canvas` (node-canvas) package (same setup
// as studentInkLayer.test.ts), so real canvas drawImage/toDataURL work here.
import { describe, it, expect } from 'vitest';
import {
  computeDownscaleDimensions,
  downscalePhoto,
  PHOTO_MAX_EDGE,
  PHOTO_MAX_BYTES,
} from '../photoDownscale';

function sourceCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx?.fillRect(0, 0, width, height);
  return canvas;
}

describe('computeDownscaleDimensions', () => {
  it('caps the longest edge at 1600 and preserves aspect ratio', () => {
    expect(computeDownscaleDimensions(3200, 2400)).toEqual({ width: 1600, height: 1200 });
    expect(computeDownscaleDimensions(2400, 3200)).toEqual({ width: 1200, height: 1600 });
    expect(computeDownscaleDimensions(4000, 1000)).toEqual({ width: 1600, height: 400 });
  });

  it('never upscales images already within the limit', () => {
    expect(computeDownscaleDimensions(800, 600)).toEqual({ width: 800, height: 600 });
    expect(computeDownscaleDimensions(1600, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('rejects invalid source dimensions', () => {
    expect(() => computeDownscaleDimensions(0, 600)).toThrow();
    expect(() => computeDownscaleDimensions(800, -1)).toThrow();
    expect(() => computeDownscaleDimensions(NaN, 600)).toThrow();
  });
});

describe('downscalePhoto', () => {
  it('returns a JPEG base64 within the size budget at the computed dims', () => {
    const result = downscalePhoto(sourceCanvas(3200, 2400), 3200, 2400);

    expect(result.width).toBe(PHOTO_MAX_EDGE);
    expect(result.height).toBe(1200);
    expect(result.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(result.base64.startsWith('data:')).toBe(false);
    expect(result.base64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(result.bytes).toBeLessThanOrEqual(PHOTO_MAX_BYTES);
    expect(result.bytes).toBeGreaterThan(0);
  });

  it('keeps small photos at their original size', () => {
    const result = downscalePhoto(sourceCanvas(800, 600), 800, 600);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });
});
