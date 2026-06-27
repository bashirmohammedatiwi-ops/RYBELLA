const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/mine', auth, notificationController.getMine);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.patch('/read-all', auth, notificationController.markAllRead);
router.get('/', auth, adminAuth, notificationController.getAll);
router.post('/', auth, adminAuth, notificationController.create);
router.patch('/:id/read', auth, notificationController.markRead);
router.delete('/:id', auth, adminAuth, notificationController.delete);

module.exports = router;
