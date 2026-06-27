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

exports.download = async (req, res) => {
  try {
    const filepath = backupService.getBackupPath(req.params.filename);
    res.download(filepath, req.params.filename);
  } catch (error) {
    if (error.code === 'INVALID_FILENAME') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Download backup error:', error);
    res.status(500).json({ message: 'تعذّر تحميل النسخة الاحتياطية' });
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
