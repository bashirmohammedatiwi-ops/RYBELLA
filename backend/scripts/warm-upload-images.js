#!/usr/bin/env node
/**
 * توليد نسخ WebP مصغّرة لكل صور uploads الموجودة (مرة واحدة بعد النشر).
 * الاستخدام على السيرفر:
 *   docker exec rybella-backend node scripts/warm-upload-images.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { warmImageThumbnails, isSafeUploadPath } = require('../services/imageResizeService');

const uploadsDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    if (name === '.cache' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(jpe?g|png|webp)$/i.test(name)) files.push(full);
  }
  return files;
}

async function main() {
  const files = walk(uploadsDir);
  console.log(`Warming ${files.length} images...`);
  let done = 0;
  for (const file of files) {
    const rel = `/uploads/${path.relative(uploadsDir, file).replace(/\\/g, '/')}`;
    if (!isSafeUploadPath(rel)) continue;
    warmImageThumbnails(rel);
    done += 1;
    if (done % 25 === 0) {
      console.log(`Queued ${done}/${files.length}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.log(`Done. Queued warm for ${done} images.`);
  setTimeout(() => process.exit(0), 3000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
