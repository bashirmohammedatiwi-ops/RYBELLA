const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
const CACHE_DIR = path.join(UPLOADS_DIR, '.cache');

const ALLOWED_WIDTHS = [80, 120, 200, 400, 600, 800, 1000, 1200];
const DEFAULT_QUALITY = 82;
const MAX_QUALITY = 95;
const MIN_QUALITY = 40;

let sharpModule = null;
let sharpUnavailable = false;

function getSharp() {
  if (sharpUnavailable) return null;
  if (sharpModule) return sharpModule;
  try {
    sharpModule = require('sharp');
    return sharpModule;
  } catch (error) {
    sharpUnavailable = true;
    console.error('[images] sharp unavailable:', error.message);
    return null;
  }
}

function snapWidth(width) {
  const w = Math.max(40, Math.min(1600, Math.round(Number(width) || 400)));
  let best = ALLOWED_WIDTHS[0];
  for (const allowed of ALLOWED_WIDTHS) {
    if (allowed <= w) best = allowed;
    else break;
  }
  return best;
}

function isSafeUploadPath(src) {
  if (!src || typeof src !== 'string') return false;
  if (!src.startsWith('/uploads/')) return false;
  if (src.includes('..') || src.includes('\\')) return false;
  const normalized = path.normalize(src).replace(/\\/g, '/');
  if (!normalized.startsWith('/uploads/')) return false;
  return true;
}

function resolveSourceFile(src) {
  const relative = src.replace(/^\/uploads\//, '');
  const abs = path.resolve(UPLOADS_DIR, relative);
  if (!abs.startsWith(UPLOADS_DIR + path.sep) && abs !== UPLOADS_DIR) return null;
  return abs;
}

function getCachePath(width, quality, format, src) {
  const safeName = src.replace(/^\/uploads\//, '').replace(/[/\\]/g, '__');
  const baseName = safeName.replace(/\.[^.]+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  const fileName = ext === 'webp' ? `${baseName}.webp` : `${baseName}.${ext}`;
  return path.join(CACHE_DIR, `w${width}_q${quality}_${ext}`, fileName);
}

function shouldSkipOptimization(ext) {
  const lower = String(ext || '').toLowerCase();
  return lower === '.svg' || lower === '.gif';
}

async function getOptimizedImage({ src, width, quality, format }) {
  if (!isSafeUploadPath(src)) {
    const err = new Error('مسار الصورة غير صالح');
    err.status = 400;
    throw err;
  }

  const sourcePath = resolveSourceFile(src);
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    const err = new Error('الصورة غير موجودة');
    err.status = 404;
    throw err;
  }

  const ext = path.extname(sourcePath);
  if (shouldSkipOptimization(ext)) {
    const buffer = fs.readFileSync(sourcePath);
    const mime = ext.toLowerCase() === '.svg' ? 'image/svg+xml' : 'image/gif';
    return { buffer, contentType: mime, fromCache: false, passthrough: true };
  }

  const sharp = getSharp();
  if (!sharp) {
    const err = new Error('Image optimizer unavailable');
    err.status = 503;
    err.fallback = true;
    throw err;
  }

  const w = snapWidth(width);
  const q = Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, Number(quality) || DEFAULT_QUALITY));
  const fmt = format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'webp';
  const cachePath = getCachePath(w, q, fmt, src);

  if (fs.existsSync(cachePath)) {
    const stat = fs.statSync(cachePath);
    const sourceStat = fs.statSync(sourcePath);
    if (stat.mtimeMs >= sourceStat.mtimeMs) {
      return {
        buffer: fs.readFileSync(cachePath),
        contentType: fmt === 'jpeg' ? 'image/jpeg' : 'image/webp',
        fromCache: true,
      };
    }
  }

  let pipeline = sharp(sourcePath, { failOn: 'none' })
    .rotate()
    .resize({
      width: w,
      withoutEnlargement: true,
      fit: 'inside',
    });

  if (fmt === 'jpeg') {
    pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
  } else {
    pipeline = pipeline.webp({ quality: q, effort: 4 });
  }

  const buffer = await pipeline.toBuffer();
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, buffer);

  return {
    buffer,
    contentType: fmt === 'jpeg' ? 'image/jpeg' : 'image/webp',
    fromCache: false,
  };
}

function warmImageThumbnails(src) {
  if (!isSafeUploadPath(src)) return;
  const widths = [120, 240, 400];
  widths.forEach((width) => {
    getOptimizedImage({ src, width, quality: 76, format: 'webp' }).catch(() => {});
  });
}

module.exports = {
  getOptimizedImage,
  snapWidth,
  isSafeUploadPath,
  ALLOWED_WIDTHS,
  warmImageThumbnails,
};
