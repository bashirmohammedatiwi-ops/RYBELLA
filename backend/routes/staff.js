const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { auth, adminAuth, staffAuth } = require('../middleware/auth');

router.get('/stats', auth, staffAuth, staffController.getStats);
router.post('/push/subscribe', auth, staffAuth, staffController.subscribePush);
router.post('/push/unsubscribe', auth, staffAuth, staffController.unsubscribePush);
router.get('/', auth, adminAuth, staffController.getAll);
router.post('/', auth, adminAuth, staffController.create);
router.delete('/:id', auth, adminAuth, staffController.delete);

module.exports = router;
