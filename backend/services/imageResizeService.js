const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
const CACHE_DIR = path.join(UPLOADS_DIR, '.cache');

// Keep in sync with storefront-premium/src/utils/imageUrl.js IMAGE_PRESETS widths
const ALLOWED_WIDTHS = [80, 120, 200, 240, 400, 600, 800, 900, 1000, 1200];
const WARM_WIDTHS = [80, 120, 200, 240, 400, 600, 900, 1000];
const DEFAULT_QUALITY = 82;
const MAX_QUALITY = 95;
const MIN_QUALITY = 40;

let sharpModule = null;
let sharpUnavailable = false;
let sharpActive = 0;
const SHARP_MAX_CONCURRENT = Math.max(
  2,
  Math.min(8, parseInt(process.env.SHARP_MAX_CONCURRENT || '4', 10))
);
const CARD_WIDTH = 200;
const CARD_QUALITY = 72;
const sharpWaiters = [];
const inflightOptimizations = new Map();

function releaseSharpSlot() {
  sharpActive = Math.max(0, sharpActive - 1);
  const next = sharpWaiters.shift();
  if (next) next();
}

async function withSharpSlot(fn) {
  if (sharpActive >= SHARP_MAX_CONCURRENT) {
    await new Promise((resolve) => sharpWaiters.push(resolve));
  }
  sharpActive += 1;
  try {
    return await fn();
  } finally {
    releaseSharpSlot();
  }
}

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

function getCacheRelPath(src, width, quality, format) {
  const w = snapWidth(width);
  const safeName = src.replace(/^\/uploads\//, '').replace(/[/\\]/g, '__');
  const baseName = safeName.replace(/\.[^.]+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  const fileName = ext === 'webp' ? `${baseName}.webp` : `${baseName}.${ext}`;
  return `/uploads/.cache/w${w}_q${quality}_${ext}/${fileName}`;
}

function getCacheAbsPath(src, width, quality, format) {
  const rel = getCacheRelPath(src, width, quality, format);
  const sub = rel.replace(/^\/uploads\/\.cache\//, '');
  return path.join(CACHE_DIR, sub);
}

/** يُرجع رابط WebP الجاهز أو null إن لم يُولَّد بعد */
function getPublicCacheUrl(src, width = 240, quality = 76, format = 'webp') {
  if (!isSafeUploadPath(src)) return null;
  const abs = getCacheAbsPath(src, width, quality, format);
  if (!fs.existsSync(abs)) return null;
  return getCacheRelPath(src, width, quality, format);
}

/** للبطاقات: رابط WebP مصغّر إن وُجد، وإلا المسار الأصلي */
function resolveCardImageUrl(src) {
  if (!src) return null;
  if (!isSafeUploadPath(src)) return src;
  return getPublicCacheUrl(src, CARD_WIDTH, CARD_QUALITY, 'webp') || src;
}

/** استخراج المصدر الأصلي من مسار ملف الـ cache عند الطلب المباشر */
function parseCacheRequestPath(urlPath) {
  const normalized = String(urlPath || '').replace(/\\/g, '/');
  const match = normalized.match(/\/uploads\/\.cache\/w(\d+)_q(\d+)_(webp|jpg)\/([^/]+)\.(webp|jpg)$/i);
  if (!match) return null;

  const [, width, quality, format, baseName] = match;
  const relPath = baseName.replace(/__/g, '/');
  const baseAbs = path.resolve(UPLOADS_DIR, relPath);

  const candidates = [baseAbs];
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG']) {
    candidates.push(`${baseAbs}${ext}`);
  }

  for (const candidate of candidates) {
    if (!candidate.startsWith(UPLOADS_DIR + path.sep)) continue;
    if (!fs.existsSync(candidate)) continue;
    if (candidate.includes(`${path.sep}.cache${path.sep}`)) continue;
    const src = `/uploads/${path.relative(UPLOADS_DIR, candidate).replace(/\\/g, '/')}`;
    return {
      src,
      width: Number(width),
      quality: Number(quality),
      format,
    };
  }

  return null;
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

  const w = snapWidth(width);
  const q = Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, Number(quality) || DEFAULT_QUALITY));
  const fmt = format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'webp';
  const dedupeKey = `${src}|${w}|${q}|${fmt}`;

  if (inflightOptimizations.has(dedupeKey)) {
    return inflightOptimizations.get(dedupeKey);
  }

  const task = generateOptimizedImage({ src, width: w, quality: q, format: fmt });
  inflightOptimizations.set(dedupeKey, task);
  try {
    return await task;
  } finally {
    inflightOptimizations.delete(dedupeKey);
  }
}

async function generateOptimizedImage({ src, width, quality, format }) {
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

  const w = width;
  const q = quality;
  const fmt = format;
  const cachePath = getCacheAbsPath(src, w, q, fmt);

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

  const buffer = await withSharpSlot(async () => {
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
      pipeline = pipeline.webp({ quality: q, effort: 3 });
    }

    return pipeline.toBuffer();
  });
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
  WARM_WIDTHS.forEach((width) => {
    const w = snapWidth(width);
    const q = w === CARD_WIDTH ? CARD_QUALITY : (w >= 900 ? 82 : w >= 600 ? 80 : 76);
    getOptimizedImage({ src, width: w, quality: q, format: 'webp' }).catch(() => {});
  });
}

const ORIGINAL_MAX_WIDTH = Math.max(
  800,
  Math.min(2400, parseInt(process.env.IMAGE_MAX_ORIGINAL_WIDTH || '1400', 10))
);
const ORIGINAL_JPEG_QUALITY = Math.max(
  60,
  Math.min(95, parseInt(process.env.IMAGE_ORIGINAL_JPEG_QUALITY || '82', 10))
);
const ORIGINAL_WEBP_QUALITY = Math.max(
  60,
  Math.min(95, parseInt(process.env.IMAGE_ORIGINAL_WEBP_QUALITY || '82', 10))
);
const COMPRESS_MIN_BYTES = Math.max(
  0,
  parseInt(process.env.IMAGE_COMPRESS_MIN_BYTES || '100000', 10)
);

function clearCacheForSource(src) {
  if (!isSafeUploadPath(src) || !fs.existsSync(CACHE_DIR)) return 0;
  const safeName = src.replace(/^\/uploads\//, '').replace(/[/\\]/g, '__');
  const baseName = safeName.replace(/\.[^.]+$/, '');
  let removed = 0;

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (name === `${baseName}.webp` || name === `${baseName}.jpg`) {
        fs.unlinkSync(full);
        removed += 1;
      }
    }
  }

  walk(CACHE_DIR);
  return removed;
}

function toUploadRelPath(absPath) {
  const rel = path.relative(UPLOADS_DIR, absPath).replace(/\\/g, '/');
  if (!rel || rel.startsWith('..') || rel.includes('.cache/')) return null;
  return `/uploads/${rel}`;
}

/**
 * ضغط الصورة الأصلية في مكانها (نفس الاسم — لا حاجة لتحديث قاعدة البيانات).
 */
async function compressOriginalFile(absPath, options = {}) {
  const minBytes = options.minBytes ?? COMPRESS_MIN_BYTES;
  const maxWidth = options.maxWidth ?? ORIGINAL_MAX_WIDTH;
  const dryRun = Boolean(options.dryRun);

  if (!absPath || !fs.existsSync(absPath)) {
    return { skipped: true, reason: 'missing' };
  }

  const ext = path.extname(absPath).toLowerCase();
  if (['.svg', '.gif', '.mp4', '.webm', '.mov'].includes(ext)) {
    return { skipped: true, reason: 'format' };
  }
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return { skipped: true, reason: 'format' };
  }

  const stat = fs.statSync(absPath);
  if (stat.size < minBytes) {
    return { skipped: true, reason: 'small', before: stat.size };
  }

  const sharp = getSharp();
  if (!sharp) {
    return { skipped: true, reason: 'sharp_unavailable' };
  }

  const meta = await sharp(absPath, { failOn: 'none' }).metadata();
  const needsResize = (meta.width || 0) > maxWidth || (meta.height || 0) > maxWidth;

  const buffer = await withSharpSlot(async () => {
    let pipeline = sharp(absPath, { failOn: 'none' }).rotate();
    if (needsResize) {
      pipeline = pipeline.resize({
        width: maxWidth,
        height: maxWidth,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (ext === '.jpg' || ext === '.jpeg') {
      return pipeline.jpeg({ quality: ORIGINAL_JPEG_QUALITY, mozjpeg: true }).toBuffer();
    }
    if (ext === '.webp') {
      return pipeline.webp({ quality: ORIGINAL_WEBP_QUALITY, effort: 4 }).toBuffer();
    }
    if (ext === '.png') {
      const hasAlpha = meta.hasAlpha;
      return pipeline.png({
        compressionLevel: 9,
        palette: !hasAlpha,
        quality: 80,
        effort: 10,
      }).toBuffer();
    }
    return null;
  });

  if (!buffer) {
    return { skipped: true, reason: 'format' };
  }

  const minGain = options.minGain ?? 0.03;
  if (buffer.length >= stat.size * (1 - minGain) && !needsResize) {
    return {
      skipped: true,
      reason: 'no_gain',
      before: stat.size,
      after: buffer.length,
    };
  }

  if (dryRun) {
    return {
      dryRun: true,
      before: stat.size,
      after: buffer.length,
      saved: stat.size - buffer.length,
      resized: needsResize,
    };
  }

  if (options.backup) {
    const backupRoot = path.join(UPLOADS_DIR, '.backup-compress');
    const rel = path.relative(UPLOADS_DIR, absPath);
    const backupPath = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(absPath, backupPath);
    }
  }

  fs.writeFileSync(absPath, buffer);
  const src = toUploadRelPath(absPath);
  const cacheCleared = src ? clearCacheForSource(src) : 0;

  return {
    compressed: true,
    before: stat.size,
    after: buffer.length,
    saved: stat.size - buffer.length,
    resized: needsResize,
    cacheCleared,
  };
}

module.exports = {
  getOptimizedImage,
  snapWidth,
  isSafeUploadPath,
  ALLOWED_WIDTHS,
  WARM_WIDTHS,
  warmImageThumbnails,
  getPublicCacheUrl,
  getCacheRelPath,
  parseCacheRequestPath,
  resolveCardImageUrl,
  compressOriginalFile,
  clearCacheForSource,
  toUploadRelPath,
  CARD_WIDTH,
  CARD_QUALITY,
  ORIGINAL_MAX_WIDTH,
};
