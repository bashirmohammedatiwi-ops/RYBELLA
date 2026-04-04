const express = require('express');
const router = express.Router();
const webSettingsController = require('../controllers/webSettingsController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', webSettingsController.get);
router.put('/', auth, adminAuth, webSettingsController.update);

module.exports = router;
