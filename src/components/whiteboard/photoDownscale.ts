// Phase C "Photo-of-paper work" (Task 5): downscale a phone photo of
// exercise-book work before posting it to the check-work endpoint. The
// geometry is a pure function so it stays testable without real canvas
// rasterization; jsdom tests use the installed node-canvas package for the
// encode path.

export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_MAX_BYTES = 500_000;
const PHOTO_JPEG_QUALITIES = [0.8, 0.6, 0.45];

export interface DownscaledPhoto {
  // Raw base64 (no data: prefix) — the worker expects raw base64.
  base64: string;
  // data: URL for the preview <img>.
  dataUrl: string;
  width: number;
  height: number;
  // Decoded JPEG size in bytes.
  bytes: number;
}

// Longest edge capped at maxEdge, aspect preserved, never upscaled.
export function computeDownscaleDimensions(
  srcWidth: number,
  srcHeight: number,
  maxEdge: number = PHOTO_MAX_EDGE
): { width: number; height: number } {
  if (!Number.isFinite(srcWidth) || !Number.isFinite(srcHeight) || srcWidth <= 0 || srcHeight <= 0) {
    throw new Error('Invalid source image dimensions');
  }
  const scale = Math.min(1, maxEdge / Math.max(srcWidth, srcHeight));
  return {
    width: Math.max(1, Math.round(srcWidth * scale)),
    height: Math.max(1, Math.round(srcHeight * scale)),
  };
}

const base64Bytes = (b64: string) => Math.floor((b64.length * 3) / 4);
const stripDataPrefix = (dataUrl: string) => dataUrl.replace(/^data:image\/jpeg;base64,/, '');

// Draw the source into a canvas at the downscaled size and encode as JPEG
// (white-backed: transparent pixels would otherwise encode black). Quality
// steps down if a busy photo overshoots the 500KB budget.
export function downscalePhoto(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number
): DownscaledPhoto {
  const { width, height } = computeDownscaleDimensions(srcWidth, srcHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  let dataUrl = '';
  for (const quality of PHOTO_JPEG_QUALITIES) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (base64Bytes(stripDataPrefix(dataUrl)) <= PHOTO_MAX_BYTES) break;
  }
  const base64 = stripDataPrefix(dataUrl);
  return { base64, dataUrl, width, height, bytes: base64Bytes(base64) };
}
