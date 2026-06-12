#!/usr/bin/env node

/**
 * Convert Blender VCO geometry icon (.dat) to PNG.
 *
 * Usage: node src/convert.js <input.dat> <output.png>
 */

import fs from "node:fs";
import { Jimp } from "jimp";

/**
 * Reference Implementation (Blender C++ source)
 *
 * VCO file parsing:
 *   source/blender/blenkernel/intern/icons.cc — BKE_icon_geom_from_memory()
 *
 * Icon geometry data structure (Icon_Geom):
 *   source/blender/blenkernel/BKE_icons.hh — struct Icon_Geom
 *
 * Triangle rasterization (scanline algorithm with callback):
 *   source/blender/blenkernel/intern/icons_rasterize.cc — BKE_icon_geom_rasterize()
 *
 * Scanline fill algorithm (draws horizontal spans via callback):
 *   source/blender/blenlib/intern/bitmap_draw_2d.cc — BLI_bitmap_draw_2d_tri_v2i()
 *
 * Barycentric weight computation used by the rasterizer:
 *   source/blender/blenlib/intern/math_geom.cc — barycentric_weights_v2_clamped()
 *   source/blender/blenlib/BLI_math_geom.h       — barycentric_weights_v2_clamped() declaration
 *   source/blender/blenlib/BLI_math_geom.h       — cross_tri_v2() (inline helper)
 */

function parseVCO(buffer) {
  if (buffer.length < 8) {
    throw new Error("File too small to be a valid VCO file");
  }
  if (buffer[0] !== 0x56 || buffer[1] !== 0x43 || buffer[2] !== 0x4f) {
    throw new Error("Not a valid VCO file (expected header 'VCO')");
  }

  const version = buffer[3];
  if (version !== 0) {
    console.error(
      `Warning: VCO version ${version}, only version 0 is supported`,
    );
  }

  const width = buffer[4];
  const height = buffer[5];

  const remaining = buffer.slice(8);
  const bytesPerTriangle = 6 + 12;
  const numTriangles = remaining.length / bytesPerTriangle;

  if (numTriangles % 1 !== 0) {
    throw new Error(
      `Invalid VCO data: ${remaining.length} bytes is not a multiple of ${bytesPerTriangle}`,
    );
  }

  const triangles = [];
  for (let t = 0; t < numTriangles; t++) {
    const coordsOffset = t * 6;
    const colorsOffset = numTriangles * 6 + t * 12;

    const coords = [];
    const colors = [];

    for (let v = 0; v < 3; v++) {
      const x = remaining[coordsOffset + v * 2];
      const y = remaining[coordsOffset + v * 2 + 1];
      coords.push([x, y]);

      const cOff = colorsOffset + v * 4;
      colors.push([
        remaining[cOff], // R
        remaining[cOff + 1], // G
        remaining[cOff + 2], // B
        remaining[cOff + 3], // A
      ]);
    }

    triangles.push({ coords, colors });
  }

  return { width, height, triangles };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rasterize(width, height, triangles, scale = 1) {
  const outWidth = width * scale;
  const outHeight = height * scale;
  const pixels = new Uint8ClampedArray(outWidth * outHeight * 4);

  for (const tri of triangles) {
    const [[x0, y0], [x1, y1], [x2, y2]] = tri.coords.map(([x, y]) => [
      x * scale,
      (height - 1 - y) * scale,
    ]);
    const [[r0, g0, b0, a0], [r1, g1, b1, a1], [r2, g2, b2, a2]] = tri.colors;

    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(outWidth - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(outHeight - 1, Math.ceil(Math.max(y0, y1, y2)));

    if (minX > maxX || minY > maxY) continue;

    const area2 = Math.abs((x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0));
    if (area2 === 0) continue;

    const dx10 = x1 - x0,
      dy10 = y1 - y0;
    const dx21 = x2 - x1,
      dy21 = y2 - y1;
    const dx02 = x0 - x2,
      dy02 = y0 - y2;

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const w0 = dx21 * (py - y1) - dy21 * (px - x1);
        const w1 = dx02 * (py - y2) - dy02 * (px - x2);
        const w2 = dx10 * (py - y0) - dy10 * (px - x0);
        const wSum = w0 + w1 + w2;

        if (wSum === 0) continue;

        const n0 = w0 / wSum;
        const n1 = w1 / wSum;
        const n2 = w2 / wSum;

        if (n0 >= -1e-4 && n1 >= -1e-4 && n2 >= -1e-4) {
          const idx = (py * outWidth + px) * 4;

          const r = clamp(Math.round(n0 * r0 + n1 * r1 + n2 * r2), 0, 255);
          const g = clamp(Math.round(n0 * g0 + n1 * g1 + n2 * g2), 0, 255);
          const b = clamp(Math.round(n0 * b0 + n1 * b1 + n2 * b2), 0, 255);
          const a = clamp(Math.round(n0 * a0 + n1 * a1 + n2 * a2), 0, 255);

          const existingAlpha = pixels[idx + 3];
          if (existingAlpha > 0) {
            const fa = a / 255;
            const faExisting = existingAlpha / 255;
            const outAlpha = fa + faExisting * (1 - fa);
            pixels[idx] = Math.round(
              (r * fa + pixels[idx] * faExisting * (1 - fa)) / outAlpha,
            );
            pixels[idx + 1] = Math.round(
              (g * fa + pixels[idx + 1] * faExisting * (1 - fa)) / outAlpha,
            );
            pixels[idx + 2] = Math.round(
              (b * fa + pixels[idx + 2] * faExisting * (1 - fa)) / outAlpha,
            );
            pixels[idx + 3] = Math.round(outAlpha * 255);
          } else {
            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = a;
          }
        }
      }
    }
  }

  return pixels;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
export async function convertVSO(inputFile, outputFile) {
  const data = fs.readFileSync(inputFile);

  const { width, height, triangles } = parseVCO(data);

  const antialias = 4;

  const pixels = rasterize(width, height, triangles, antialias);

  const img = new Jimp({
    width: width * antialias,
    height: height * antialias,
  });
  img.bitmap.data.set(pixels);

  img.resize({ w: width, h: height });

  await img.write(outputFile);
}
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: node src/convert.js <input.dat> <output.png>");
    console.error("");
    console.error("  Converts a Blender VCO geometry icon (.dat) to PNG.");
    process.exit(1);
  }

  await convertVSO(args[0], args[1]);
}

import.meta.url === `file://${process.argv[1]}` &&
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
