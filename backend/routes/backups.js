const express = require('express');
const backupController = require('../controllers/backupController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminAuth, backupController.list);
router.post('/', auth, adminAuth, backupController.create);
router.get('/:filename', auth, adminAuth, backupController.download);
router.delete('/:filename', auth, adminAuth, backupController.remove);

module.exports = router;
