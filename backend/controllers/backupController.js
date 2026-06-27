const backupService = require('../services/backupService');

exports.list = async (req, res) => {
  try {
    const backups = backupService.listBackups();
    res.json({ backups });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ message: 'تعذّر جلب قائمة النسخ الاحتياطية' });
  }
};

exports.create = async (req, res) => {
  try {
    const backup = await backupService.createBackup();
    res.status(201).json({
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
      backup,
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ message: 'تعذّر إنشاء النسخة الاحتياطية' });
  }
};

/** رابط تحميل مؤقت — للمسؤول فقط */
exports.createDownloadLink = async (req, res) => {
  try {
    const token = backupService.createDownloadToken(req.params.filename);
    res.json({
      url: `/api/backups/file?token=${token}`,
      expiresInSeconds: 600,
    });
  } catch (error) {
    if (error.code === 'INVALID_FILENAME') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Create download link error:', error);
    res.status(500).json({ message: 'تعذّر إنشاء رابط التحميل' });
  }
};

/** تحميل مباشر بالمتصفح — token مؤقت */
exports.downloadFile = async (req, res) => {
  try {
    const filename = backupService.resolveDownloadToken(req.query.token);
    if (!filename) {
      return res.status(401).json({ message: 'رابط التحميل غير صالح أو منتهٍ' });
    }
    backupService.streamBackupFile(filename, res);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Download file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'تعذّر تحميل النسخة الاحتياطية' });
    }
  }
};

exports.download = async (req, res) => {
  try {
    backupService.streamBackupFile(req.params.filename, res);
  } catch (error) {
    if (error.code === 'INVALID_FILENAME') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Download backup error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'تعذّر تحميل النسخة الاحتياطية' });
    }
  }
};

exports.remove = async (req, res) => {
  try {
    backupService.deleteBackup(req.params.filename);
    res.json({ message: 'تم حذف النسخة الاحتياطية' });
  } catch (error) {
    if (error.code === 'INVALID_FILENAME') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Delete backup error:', error);
    res.status(500).json({ message: 'تعذّر حذف النسخة الاحتياطية' });
  }
};
