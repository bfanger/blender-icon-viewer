import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/**
 * Copy all icons from release/datafiles/ into icon-viewer/public/icons/
 * Mirrors the source directory logic from plugins/iconsPlugin.js
 */
const blenderDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../",
);
const baseDir = path.resolve(blenderDir, "release/datafiles");
const iconsDir = path.join(baseDir, "icons_svg");
const cursorsDir = path.join(baseDir, "cursors");
const targetDir = path.resolve("public/icons");

function copyDir(srcDir: string, destDir: string) {
  if (!fs.existsSync(srcDir)) {
    console.log(`Skipping ${srcDir} (does not exist)`);
    return 0;
  }

  const files = fs.readdirSync(srcDir);
  let count = 0;
  for (const file of files) {
    const src = path.join(srcDir, file);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(destDir, file);
    fs.copyFileSync(src, dest);
    count++;
  }
  console.log(`Copied ${count} files from ${srcDir}`);
  return count;
}

// Ensure target directory exists
fs.mkdirSync(targetDir, { recursive: true });

const sources = [iconsDir, cursorsDir];
const total = sources.reduce((sum, dir) => sum + copyDir(dir, targetDir), 0);

console.log(`\nTotal: ${total} icons copied to ${targetDir}`);
