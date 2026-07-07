#!/usr/bin/env node
/**
 * حذف ملفات cache اليتيمة (بدون أصل في uploads).
 *   docker exec rybella-backend node scripts/prune-image-cache.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parseCacheRequestPath } = require('../services/imageResizeService');

const uploadsDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
const cacheDir = path.join(uploadsDir, '.cache');

function walkCacheFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkCacheFiles(full, files);
    else files.push(full);
  }
  return files;
}

function main() {
  const files = walkCacheFiles(cacheDir);
  let removed = 0;
  let kept = 0;

  for (const file of files) {
    const rel = `/uploads/.cache/${path.relative(cacheDir, file).replace(/\\/g, '/')}`;
    const parsed = parseCacheRequestPath(rel);
    if (!parsed) {
      fs.unlinkSync(file);
      removed += 1;
      continue;
    }
    const sourceRel = parsed.src.replace(/^\/uploads\//, '');
    const sourceAbs = path.join(uploadsDir, sourceRel);
    if (!fs.existsSync(sourceAbs)) {
      fs.unlinkSync(file);
      removed += 1;
      continue;
    }
    kept += 1;
  }

  console.log(`Prune complete. kept=${kept} removed=${removed}`);
}

main();
