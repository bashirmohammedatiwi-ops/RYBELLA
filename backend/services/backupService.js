const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { flushDb, getDbPath } = require('../config/database');

const backupsDir = process.env.BACKUP_PATH || path.join(__dirname, '../backups');
const uploadsDir = path.isAbsolute(process.env.UPLOAD_PATH || '')
  ? process.env.UPLOAD_PATH
  : path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
const MAX_BACKUPS = Math.max(1, parseInt(process.env.BACKUP_MAX_COUNT || '15', 10));

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isSafeBackupFilename(name) {
  return /^rybella-backup-\d{8}-\d{6}\.zip$/.test(name);
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
  return fs.readdirSync(backupsDir)
    .filter(isSafeBackupFilename)
    .map((filename) => getBackupInfo(filename))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    archive.pipe(output);

    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'rybella.db' });
    }
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }
    archive.append(
      JSON.stringify(
        {
          created_at: new Date().toISOString(),
          app: 'rybella-iraq',
          includes: ['database', 'uploads'],
        },
        null,
        2
      ),
      { name: 'backup-meta.json' }
    );
    archive.finalize();
  });

  await pruneOldBackups();
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

module.exports = {
  createBackup,
  listBackups,
  getBackupPath,
  deleteBackup,
  formatBytes,
};
