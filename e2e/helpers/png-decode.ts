/**
 * Minimal PNG decoder for the e2e suite (ODD `detail-map-render`, T3).
 *
 * The detail-map render spec asserts PAINTED PIXELS, not CSS classes: with
 * `preserveDrawingBuffer: false` a WebGL canvas cannot be read back from the
 * page, so the spec screenshots the composited frame and decodes the PNG in
 * Node. Chromium screenshots are always 8-bit, non-interlaced, truecolour
 * (color types 2 or 6) — anything else is rejected loudly instead of being
 * decoded wrong. Dependency-free by constraint: IDAT is zlib, and Node's
 * built-in `node:zlib` is all a decoder needs.
 */

import { inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface DecodedPng {
  width: number;
  height: number;
  /** Bytes per pixel in `pixels` — 3 (RGB) or 4 (RGBA). */
  channels: 3 | 4;
  /** Unfiltered interleaved RGB(A), row-major, top-to-bottom. */
  pixels: Buffer;
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function decodePng(input: Buffer): DecodedPng {
  if (input.length < 8 || !input.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('decodePng: not a PNG (bad signature)');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = 0;
  const idatParts: Buffer[] = [];

  while (offset + 8 <= input.length) {
    const length = input.readUInt32BE(offset);
    const type = input.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > input.length) {
      throw new Error(`decodePng: truncated chunk "${type}"`);
    }
    if (type === 'IHDR') {
      width = input.readUInt32BE(dataStart);
      height = input.readUInt32BE(dataStart + 4);
      bitDepth = input[dataStart + 8];
      colorType = input[dataStart + 9];
      interlace = input[dataStart + 12];
    } else if (type === 'IDAT') {
      idatParts.push(input.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4; // skip the CRC — nothing to verify against here
  }

  if (width === 0 || height === 0) throw new Error('decodePng: missing IHDR');
  if (bitDepth !== 8) throw new Error(`decodePng: unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error('decodePng: interlaced PNG not supported');
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (channels === 0) throw new Error(`decodePng: unsupported color type ${colorType}`);
  if (idatParts.length === 0) throw new Error('decodePng: no IDAT chunks');

  const raw = inflateSync(Buffer.concat(idatParts));
  const stride = width * channels;
  const expected = height * (stride + 1);
  if (raw.length < expected) {
    throw new Error(`decodePng: inflated ${raw.length} bytes, expected at least ${expected}`);
  }

  // Reverse the per-scanline adaptive filters (PNG spec §6.2, types 0-4).
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw new Error(`decodePng: unknown filter type ${filter} on row ${y}`);
    const rowInStart = y * (stride + 1) + 1;
    const rowOutStart = y * stride;
    const prevOutStart = (y - 1) * stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? pixels[rowOutStart + x - channels] : 0;
      const b = y > 0 ? pixels[prevOutStart + x] : 0;
      const c = x >= channels && y > 0 ? pixels[prevOutStart + x - channels] : 0;
      let value = raw[rowInStart + x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) value += paethPredictor(a, b, c);
      pixels[rowOutStart + x] = value & 0xff;
    }
  }

  return { width, height, channels, pixels };
}

/**
 * Mean RGB over the `size`×`size` patch whose top-left corner is (`x`, `y`),
 * clamped to the image bounds. Alpha is ignored — the probes compare colour.
 */
export function meanPatchRgb(
  png: DecodedPng,
  x: number,
  y: number,
  size: number,
): [number, number, number] {
  const startX = Math.max(0, Math.min(x, png.width - 1));
  const startY = Math.max(0, Math.min(y, png.height - 1));
  const endX = Math.min(png.width, startX + size);
  const endY = Math.min(png.height, startY + size);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let py = startY; py < endY; py += 1) {
    for (let px = startX; px < endX; px += 1) {
      const index = (py * png.width + px) * png.channels;
      r += png.pixels[index];
      g += png.pixels[index + 1];
      b += png.pixels[index + 2];
      n += 1;
    }
  }
  return [r / n, g / n, b / n];
}
