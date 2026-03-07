const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, notificationController.getAll);
router.post('/', auth, adminAuth, notificationController.create);

module.exports = router;
