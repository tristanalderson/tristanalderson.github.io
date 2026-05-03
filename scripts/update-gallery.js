#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const galleryDir = path.join(root, "assets", "gallery");
const manifestPath = path.join(galleryDir, "manifest.json");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

function isImage(file) {
  return IMAGE_EXTS.has(path.extname(file).toLowerCase());
}

function main() {
  if (!fs.existsSync(galleryDir)) {
    console.error("Gallery folder not found:", galleryDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(galleryDir)
    .filter((file) => isImage(file))
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  const manifest = files.map((file) => ({ file }));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Wrote ${manifest.length} images to ${path.relative(root, manifestPath)}`);
}

main();
