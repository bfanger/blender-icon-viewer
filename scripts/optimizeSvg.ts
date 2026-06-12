#!/usr/bin/env node

/**
 * Optimize all SVG icons in public/icons/ using SVGO.
 *
 * Usage: node scripts/optimizeSvg.ts
 */

import fs from "node:fs";
import path from "node:path";
import { optimize, type Config } from "svgo";

const inputDir = path.resolve("public", "icons");
const outputDir = path.resolve("public", "svgo");
const config: Config = { js2svg: { pretty: true } };
async function main() {
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".svg"));

  if (files.length === 0) {
    console.log("No SVG files found in", inputDir);
    return;
  }

  for (const file of files) {
    const original = fs.readFileSync(path.join(inputDir, file), "utf-8");
    const { data } = await optimize(original, config);
    fs.writeFileSync(path.join(outputDir, file), data, "utf-8");
  }
  console.log(`Wrote ${files.length} SVGs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
