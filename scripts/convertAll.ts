#!/usr/bin/env node

/**
 * Convert all .dat icon files to PNG.
 *
 * Usage: node src/convertAll.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertVSO } from "./convert.js";
import { convertToSvg } from "./convertSvg.js";

const blenderDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../blender/",
);
const inputDir = path.join(blenderDir, "release/datafiles/icons");
const outputDir = path.join(blenderDir, "icon-viewer/public/icons");

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Find all .dat files in the input directory
const datFiles = fs.readdirSync(inputDir).filter((f) => f.endsWith(".dat"));

if (datFiles.length === 0) {
  console.error(`No .dat files found in ${inputDir}`);
  process.exit(1);
}

console.error(`Found ${datFiles.length} .dat files in ${inputDir}`);

// Convert each file
let count = 0;
for (const file of datFiles) {
  await convertVSO(
    path.join(inputDir, file),
    path.join(outputDir, file.replace(".dat", ".png")),
  );
  await convertToSvg(
    path.join(inputDir, file),
    path.join(outputDir, file.replace(".dat", ".svg")),
  );
  console.info("Converted " + file);
  count++;
}

console.error(`Converted ${count} files to ${outputDir}`);
