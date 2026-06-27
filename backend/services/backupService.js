const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { flushDb, getDbPath } = require('../config/database');

function resolveBackupsDir() {
  const raw = process.env.BACKUP_PATH;
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  return path.resolve(__dirname, '../backups');
}

function resolveUploadsDir() {
  const raw = process.env.UPLOAD_PATH || 'uploads';
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(process.cwd(), raw);
}

const backupsDir = resolveBackupsDir();
const uploadsDir = resolveUploadsDir();
const MAX_BACKUPS = Math.max(1, parseInt(process.env.BACKUP_MAX_COUNT || '15', 10));
const TOKEN_TTL_MS = 10 * 60 * 1000;

/** @type {Map<string, { filename: string, expiresAt: number }>} */
const downloadTokens = new Map();

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isSafeBackupFilename(name) {
  return /^rybella-backup-.+\.zip$/i.test(name) && !name.includes('..') && !name.includes('/');
}

function formatBackupName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `rybella-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.zip`;
}

function getBackupInfo(filename) {
  const filepath = path.join(backupsDir, filename);
  const stat = fs.statSync(filepath);
  return {
    filename,
    size: stat.size,
    sizeLabel: formatBytes(stat.size),
    createdAt: stat.mtime.toISOString(),
  };
}

function listBackups() {
  ensureBackupsDir();
  const entries = fs.readdirSync(backupsDir, { withFileTypes: true });
  const backups = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!isSafeBackupFilename(entry.name)) continue;
    try {
      backups.push(getBackupInfo(entry.name));
    } catch (err) {
      console.warn('[backup] skip unreadable file:', entry.name, err.message);
    }
  }

  return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function pruneOldBackups() {
  const list = listBackups();
  if (list.length <= MAX_BACKUPS) return;
  for (const item of list.slice(MAX_BACKUPS)) {
    fs.unlinkSync(path.join(backupsDir, item.filename));
  }
}

async function createBackup() {
  ensureBackupsDir();
  await flushDb();

  const filename = formatBackupName();
  const filepath = path.join(backupsDir, filename);
  const dbPath = getDbPath();

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') console.warn('[backup] archive warning:', err.message);
      else reject(err);
    });
    archive.pipe(output);

    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'rybella.db' });
    } else {
      console.warn('[backup] database file missing at', dbPath);
    }
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    } else {
      console.warn('[backup] uploads dir missing at', uploadsDir);
    }
    archive.append(
      JSON.stringify(
        {
          created_at: new Date().toISOString(),
          app: 'rybella-iraq',
          includes: ['database', 'uploads'],
          backupsDir,
          dbPath,
          uploadsDir,
        },
        null,
        2
      ),
      { name: 'backup-meta.json' }
    );
    archive.finalize();
  });

  if (!fs.existsSync(filepath)) {
    throw new Error('Backup file was not created');
  }
  const stat = fs.statSync(filepath);
  if (stat.size < 100) {
    fs.unlinkSync(filepath);
    throw new Error('Backup file is empty or corrupt');
  }

  await pruneOldBackups();
  console.log('[backup] created', filename, formatBytes(stat.size), 'at', backupsDir);
  return getBackupInfo(filename);
}

function getBackupPath(filename) {
  if (!isSafeBackupFilename(filename)) {
    const err = new Error('اسم الملف غير صالح');
    err.code = 'INVALID_FILENAME';
    throw err;
  }
  const filepath = path.join(backupsDir, filename);
  if (!fs.existsSync(filepath)) {
    const err = new Error('النسخة الاحتياطية غير موجودة');
    err.code = 'NOT_FOUND';
    throw err;
  }
  return filepath;
}

function deleteBackup(filename) {
  const filepath = getBackupPath(filename);
  fs.unlinkSync(filepath);
}

function pruneExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of downloadTokens) {
    if (entry.expiresAt <= now) downloadTokens.delete(token);
  }
}

function createDownloadToken(filename) {
  getBackupPath(filename);
  pruneExpiredTokens();
  const token = crypto.randomBytes(24).toString('hex');
  downloadTokens.set(token, { filename, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

function resolveDownloadToken(token) {
  if (!token || typeof token !== 'string') return null;
  pruneExpiredTokens();
  const entry = downloadTokens.get(token);
  if (!entry || entry.expiresAt <= Date.now()) {
    downloadTokens.delete(token);
    return null;
  }
  return entry.filename;
}

function streamBackupFile(filename, res) {
  const filepath = getBackupPath(filename);
  const stat = fs.statSync(filepath);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(filepath).pipe(res);
}

function getBackupsDir() {
  return backupsDir;
}

module.exports = {
  createBackup,
  listBackups,
  getBackupPath,
  deleteBackup,
  createDownloadToken,
  resolveDownloadToken,
  streamBackupFile,
  formatBytes,
  getBackupsDir,
};
