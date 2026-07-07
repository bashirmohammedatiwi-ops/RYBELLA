#!/usr/bin/env node
/**
 * توليد نسخ WebP مصغّرة لصور uploads.
 *
 * الاستخدام (داخل الحاوية):
 *   node scripts/warm-upload-images.js              # كل الأحجام
 *   node scripts/warm-upload-images.js --cards-only # بطاقات المتجر فقط (سريع — يُشغَّل عند النشر)
 *   node scripts/warm-upload-images.js --skip-cards # باقي الأحجام (خلفية)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  getOptimizedImage,
  isSafeUploadPath,
  snapWidth,
  CARD_WIDTH,
  CARD_QUALITY,
} = require('../services/imageResizeService');

const uploadsDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
const ALL_WIDTHS = [CARD_WIDTH, 120, 240, 400];
const CARD_WIDTHS = [CARD_WIDTH];

const args = new Set(process.argv.slice(2));
const cardsOnly = args.has('--cards-only');
const skipCards = args.has('--skip-cards');

const widths = cardsOnly
  ? CARD_WIDTHS
  : skipCards
    ? ALL_WIDTHS.filter((w) => w !== CARD_WIDTH)
    : ALL_WIDTHS;

const CONCURRENCY = Math.max(
  1,
  Math.min(8, parseInt(process.env.WARM_CONCURRENCY || (cardsOnly ? '6' : '3'), 10))
);

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
  for (const width of widths) {
    const w = snapWidth(width);
    const q = w === CARD_WIDTH ? CARD_QUALITY : 76;
    await getOptimizedImage({ src, width: w, quality: q, format: 'webp' }).catch(() => {});
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

  const mode = cardsOnly ? 'cards' : skipCards ? 'other-sizes' : 'all';
  console.log(`Warming ${paths.length} images [${mode}] sizes=${widths.join(',')} concurrency=${CONCURRENCY}`);

  let done = 0;
  const started = Date.now();
  await runPool(paths, async (src) => {
    await warmOne(src);
    done += 1;
    const step = cardsOnly ? 50 : 20;
    if (done % step === 0 || done === paths.length) {
      const sec = ((Date.now() - started) / 1000).toFixed(0);
      console.log(`Progress: ${done}/${paths.length} (${sec}s)`);
    }
  });

  const totalSec = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Done. Warmed ${done} images in ${totalSec}s [${mode}].`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
