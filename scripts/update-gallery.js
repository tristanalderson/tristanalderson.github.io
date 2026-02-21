#!/usr/bin/env node
/**
 * Scans assets/images/gallery for image files and writes manifest.json
 * so the site gallery auto-updates. Run after adding or removing images:
 *   node scripts/update-gallery.js
 */

const fs = require('fs');
const path = require('path');

const GALLERY_DIR = path.join(__dirname, '..', 'assets', 'images', 'gallery');
const MANIFEST_PATH = path.join(GALLERY_DIR, 'manifest.json');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);

if (!fs.existsSync(GALLERY_DIR)) {
  console.error('Gallery directory not found:', GALLERY_DIR);
  process.exit(1);
}

const files = fs.readdirSync(GALLERY_DIR);
const images = files
  .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
  .filter((f) => f !== 'manifest.json')
  .sort();

const manifest = images.map((file) => ({ file }));

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Gallery manifest updated:', images.length, 'images →', MANIFEST_PATH);
