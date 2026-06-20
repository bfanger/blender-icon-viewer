#!/usr/bin/env node
/**
 * Generates icon-manifest.json from UI_icons.hh + SVG files.
 * Run: node scripts/gen-manifest.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
);
const iconsDir = path.join(root, "release/datafiles/icons_svg");
const cursorsDir = path.join(root, "release/datafiles/cursors");
const datDir = path.join(root, "release/datafiles/icons");
const uiIconsHh = path.join(root, "source/blender/editors/include/UI_icons.hh");

// Parse UI_icons.hh to extract categories and icon names
const categories = [];
let currentCategory = "SPECIAL";
const iconNames = new Set();

const content = fs.readFileSync(uiIconsHh, "utf-8");
for (const line of content.split("\n")) {
  const catMatch = line.match(/^\s*\/\*\s*(\w+)\s*\*/);
  if (catMatch) {
    currentCategory = catMatch[1];
    continue;
  }
  const iconMatch = line.match(/DEF_ICON(?:_\w+)?\s*\(\s*(\w+)\s*\)/);
  if (iconMatch) {
    const name = iconMatch[1].toLowerCase();
    iconNames.add(name);
    if (!categories.find((c) => c.name === name)) {
      categories.push({ name, category: currentCategory });
    }
  }
}

// Collect SVG files
const svgFiles = new Set();
for (const dir of [iconsDir, cursorsDir]) {
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".svg")) {
        svgFiles.add(file.replace(".svg", ""));
      }
    }
  }
}

// Collect converted PNG files (brush icons)
const vcoIcons = [];
if (fs.existsSync(datDir)) {
  for (const file of fs.readdirSync(datDir)) {
    if (file.endsWith(".dat")) {
      const name = file.replace(".dat", "");
      const category = name.split(".")[0].toUpperCase();
      const enumName = name.replace(/\./g, "_").toUpperCase();
      vcoIcons.push({ name, category, enumName });
    }
  }
}

// Build manifest
const allCategories = new Set(categories.map((c) => c.category));
for (const icon of vcoIcons) {
  allCategories.add(icon.category);
}

const manifest = {
  icons: [],
  categories: [...allCategories],
  totalCount: svgFiles.size + vcoIcons.length,
};

for (const file of [...svgFiles].sort()) {
  const catEntry = categories.find((c) => c.name === file);
  const hasEnum = iconNames.has(file);
  manifest.icons.push({
    name: file,
    category: catEntry ? catEntry.category : "OTHER",
    enum_name: hasEnum ? `ICON_${file.toUpperCase()}` : null,
  });
}

// Add converted icons
for (const icon of vcoIcons.sort((a, b) => a.name.localeCompare(b.name))) {
  manifest.icons.push({
    name: icon.name,
    category: icon.category,
    enum_name: icon.enumName,
  });
}

fs.writeFileSync(
  path.join(root, "icon-viewer/icon-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Generated manifest with ${manifest.icons.length} icons in ${manifest.categories.length} categories`,
);
