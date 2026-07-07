#!/usr/bin/env node
/**
 * توليد نسخ WebP مصغّرة لكل صور uploads (بعد النشر أو عند الحاجة).
 *   docker exec rybella-backend node scripts/warm-upload-images.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getOptimizedImage, isSafeUploadPath, snapWidth } = require('../services/imageResizeService');

const uploadsDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
const WIDTHS = [120, 240, 400];
const CONCURRENCY = 3;

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

async function warmOne(src) {
  for (const width of WIDTHS) {
    const w = snapWidth(width);
    await getOptimizedImage({ src, width: w, quality: 76, format: 'webp' }).catch(() => {});
  }
}

async function runPool(items, worker) {
  let index = 0;
  async function next() {
    while (index < items.length) {
      const i = index;
      index += 1;
      await worker(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => next());
  await Promise.all(workers);
}

async function main() {
  const files = walk(uploadsDir);
  const paths = files
    .map((file) => `/uploads/${path.relative(uploadsDir, file).replace(/\\/g, '/')}`)
    .filter(isSafeUploadPath);

  console.log(`Warming ${paths.length} images (${WIDTHS.length} sizes each)...`);
  let done = 0;
  await runPool(paths, async (src) => {
    await warmOne(src);
    done += 1;
    if (done % 20 === 0 || done === paths.length) {
      console.log(`Progress: ${done}/${paths.length}`);
    }
  });
  console.log(`Done. Warmed ${done} images.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
