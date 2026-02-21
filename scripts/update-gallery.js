#!/usr/bin/env node
/**
 * Scans assets/images/gallery for image files and writes manifest.json
 * so the site gallery auto-updates. Run after adding or removing images:
 *   node scripts/update-gallery.js
 * Or from project root: node scripts/update-gallery.js
 */

const fs = require('fs');
const path = require('path');

// Resolve paths from this script's location so it works regardless of cwd
const GALLERY_DIR = path.resolve(__dirname, '..', 'assets', 'images', 'gallery');
const MANIFEST_PATH = path.join(GALLERY_DIR, 'manifest.json');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);

function main() {
  if (!fs.existsSync(GALLERY_DIR)) {
    try {
      fs.mkdirSync(GALLERY_DIR, { recursive: true });
      console.log('Created gallery directory:', GALLERY_DIR);
    } catch (err) {
      console.error('Gallery directory not found and could not be created:', GALLERY_DIR);
      console.error(err.message);
      process.exit(1);
    }
  }

  let files;
  try {
    files = fs.readdirSync(GALLERY_DIR);
  } catch (err) {
    console.error('Cannot read gallery directory:', GALLERY_DIR, err.message);
    process.exit(1);
  }

  const images = files
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      if (!IMAGE_EXT.has(ext)) return false;
      const fullPath = path.join(GALLERY_DIR, f);
      try {
        return fs.statSync(fullPath).isFile();
      } catch {
        return false;
      }
    })
    .filter((f) => f !== 'manifest.json')
    .sort();

  const manifest = images.map((file) => ({ file }));

  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.error('Cannot write manifest:', MANIFEST_PATH, err.message);
    process.exit(1);
  }

  console.log('Gallery manifest updated:', images.length, 'images →', MANIFEST_PATH);
}

main();
