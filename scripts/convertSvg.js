#!/usr/bin/env node

/**
 * Convert Blender VCO geometry icon (.dat) to SVG.
 *
 * Usage: node src/convertSvg.js <input.dat> <output.svg>
 */

import fs from "node:fs";

/**
 * Reference Implementation (Blender C++ source)
 *
 * VCO file parsing:
 *   source/blender/blenkernel/intern/icons.cc — BKE_icon_geom_from_memory()
 *
 * Icon geometry data structure (Icon_Geom):
 *   source/blender/blenkernel/BKE_icons.hh — struct Icon_Geom
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

function toSvgCoord(x, y, width, height) {
  // VCO coords are 0..width-1 / 0..height-1 with origin at top-left.
  // Flip Y so the SVG matches the icon orientation.
  return [Math.round(x * 100) / 100, Math.round((height - 1 - y) * 100) / 100];
}

function hexString(r, g, b) {
  return (
    "#" +
    [Math.round(r), Math.round(g), Math.round(b)]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

function svgTriToPolygon(width, height, triangles) {
  const polygons = [];

  for (let t = 0; t < triangles.length; t++) {
    const tri = triangles[t];
    const [[x0, y0], [x1, y1], [x2, y2]] = tri.coords;
    const [[r0, g0, b0, a0], [r1, g1, b1, a1], [r2, g2, b2, a2]] = tri.colors;

    // Convert coords to SVG space, flipped Y
    const [sx0, sy0] = toSvgCoord(x0, y0, width, height);
    const [sx1, sy1] = toSvgCoord(x1, y1, width, height);
    const [sx2, sy2] = toSvgCoord(x2, y2, width, height);

    // Use average color across all three vertices
    const ar = (r0 + r1 + r2) / 3;
    const ag = (g0 + g1 + g2) / 3;
    const ab = (b0 + b1 + b2) / 3;
    const aa = (a0 + a1 + a2) / 3;
    if (aa > 10) {
      polygons.push({
        fill: hexString(ar, ag, ab),
        opacity: aa / 255,
        points: [
          { x: sx0, y: sy0 },
          { x: sx1, y: sy1 },
          { x: sx2, y: sy2 },
        ],
      });
    }
  }

  return polygons;
}

function pointsMatch(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}

function areConsecutive(points, p1, p2) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    if (
      (pointsMatch(curr, p1) && pointsMatch(next, p2)) ||
      (pointsMatch(curr, p2) && pointsMatch(next, p1))
    ) {
      return true;
    }
  }
  return false;
}

function stitchPolygons(a, b, shared) {
  const nA = a.points.length;
  const nB = b.points.length;

  const idxA_s0 = a.points.findIndex((p) => pointsMatch(p, shared[0]));
  const idxA_s1 = a.points.findIndex((p) => pointsMatch(p, shared[1]));
  const idxB_s0 = b.points.findIndex((p) => pointsMatch(p, shared[0]));
  const idxB_s1 = b.points.findIndex((p) => pointsMatch(p, shared[1]));

  // Walk through A from S0 to S1 the long way (not the shared edge)
  let dirA = (idxA_s0 + 1) % nA === idxA_s1 ? -1 : 1;
  const merged = [];
  let idx = idxA_s0;
  for (let step = 0; step < nA; step++) {
    merged.push(a.points[idx]);
    idx = (idx + dirA + nA) % nA;
  }

  // Walk through B from S1 to S0 the long way (skip S1, stop before S0)
  let dirB = (idxB_s1 + 1) % nB === idxB_s0 ? -1 : 1;
  idx = idxB_s1;
  for (let step = 0; step < nB - 2; step++) {
    idx = (idx + dirB + nB) % nB;
    merged.push(b.points[idx]);
  }

  return merged;
}

function mergePolygons(polygons) {
  const result = [...polygons];
  let changed = true;

  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];

        if (a.fill !== b.fill || a.opacity !== b.opacity) continue;

        // Find shared vertices
        const shared = [];
        for (const pa of a.points) {
          for (const pb of b.points) {
            if (
              pointsMatch(pa, pb) &&
              !shared.some((s) => pointsMatch(s, pa))
            ) {
              shared.push(pa);
            }
          }
        }

        // Must share exactly 2 vertices (an edge)
        if (shared.length !== 2) continue;

        // Shared vertices must be consecutive in both polygons
        if (
          !areConsecutive(a.points, shared[0], shared[1]) ||
          !areConsecutive(b.points, shared[0], shared[1])
        ) {
          continue;
        }

        const mergedPoints = stitchPolygons(a, b, shared);

        result[i] = {
          fill: a.fill,
          opacity: a.opacity,
          points: mergedPoints,
        };
        result.splice(j, 1);
        changed = true;
        break;
      }
      if (changed) break;
    }
  }

  return result;
}

function buildSvg(width, height, triangles) {
  const polygons = mergePolygons(svgTriToPolygon(width, height, triangles));

  const svgElements = polygons.map((poly) => {
    const pointsStr = poly.points.map((p) => `${p.x},${p.y}`).join(" ");
    const opacityAttr = poly.opacity === 1 ? "" : ` opacity="${poly.opacity}"`;
    return `<polygon points="${pointsStr}" fill="${poly.fill}"${opacityAttr}/>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${svgElements.join("\n  ")}
</svg>`;
}

export async function convertToSvg(inputFile, outputFile) {
  const data = fs.readFileSync(inputFile);
  const { width, height, triangles } = parseVCO(data);
  const svg = buildSvg(width, height, triangles);

  fs.writeFileSync(outputFile, svg, "utf-8");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: node src/convertSvg.js <input.dat> <output.svg>");
    console.error("");
    console.error("  Converts a Blender VCO geometry icon (.dat) to SVG.");
    process.exit(1);
  }

  await convertToSvg(args[0], args[1]);
}

import.meta.url === `file://${process.argv[1]}` &&
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
