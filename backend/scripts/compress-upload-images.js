#!/usr/bin/env node
/**
 * ضغط صور uploads الموجودة (تصغير الأبعاد + جودة) دون تغيير أسماء الملفات أو قاعدة البيانات.
 *
 *   docker exec rybella-backend node scripts/compress-upload-images.js --dry-run
 *   docker exec rybella-backend node scripts/compress-upload-images.js --backup
 *   docker exec rybella-backend node scripts/compress-upload-images.js --backup --rewarm
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  compressOriginalFile,
  getOptimizedImage,
  isSafeUploadPath,
  ORIGINAL_MAX_WIDTH,
  WARM_WIDTHS,
  CARD_WIDTH,
  CARD_QUALITY,
  snapWidth,
} = require('../services/imageResizeService');

const uploadsDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const withBackup = args.has('--backup');
const rewarm = args.has('--rewarm');
const cardsOnly = args.has('--cards-only');

const CONCURRENCY = Math.max(
  1,
  Math.min(4, parseInt(process.env.COMPRESS_CONCURRENCY || '2', 10))
);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    if (name === '.cache' || name === '.backup-compress' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(jpe?g|png|webp)$/i.test(name)) files.push(full);
  }
  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function rewarmSource(src) {
  const widths = cardsOnly ? [CARD_WIDTH] : WARM_WIDTHS;
  for (const width of widths) {
    const w = snapWidth(width);
    const q = w === CARD_WIDTH ? CARD_QUALITY : (w >= 900 ? 82 : w >= 600 ? 80 : 76);
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
  const mode = dryRun ? 'dry-run' : withBackup ? 'compress+backup' : 'compress';

  console.log(`Compress ${files.length} images [${mode}] maxWidth=${ORIGINAL_MAX_WIDTH} concurrency=${CONCURRENCY}`);

  let compressed = 0;
  let skipped = 0;
  let totalBefore = 0;
  let totalAfter = 0;
  let totalSaved = 0;
  const started = Date.now();

  await runPool(files, async (absPath) => {
    const result = await compressOriginalFile(absPath, {
      dryRun,
      backup: withBackup && !dryRun,
    });

    if (result?.compressed || result?.dryRun) {
      compressed += 1;
      totalBefore += result.before || 0;
      totalAfter += result.after || 0;
      totalSaved += result.saved || 0;

      if (!dryRun && rewarm) {
        const src = `/uploads/${path.relative(uploadsDir, absPath).replace(/\\/g, '/')}`;
        if (isSafeUploadPath(src)) {
          await rewarmSource(src);
        }
      }
    } else {
      skipped += 1;
    }
  });

  const sec = ((Date.now() - started) / 1000).toFixed(1);
  console.log('');
  console.log(`Done in ${sec}s`);
  console.log(`  compressed: ${compressed}`);
  console.log(`  skipped:    ${skipped}`);
  if (totalSaved > 0) {
    console.log(`  before:     ${formatBytes(totalBefore)}`);
    console.log(`  after:      ${formatBytes(totalAfter)}`);
    console.log(`  saved:      ${formatBytes(totalSaved)} (${((totalSaved / totalBefore) * 100).toFixed(1)}%)`);
  }
  if (dryRun) {
    console.log('');
    console.log('Dry-run only — run without --dry-run to apply. Recommended: --backup --rewarm');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
