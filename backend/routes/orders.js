const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, orderController.getAll);
router.get('/:id', auth, orderController.getById);
router.post('/', auth, orderController.create);
router.put('/:id/status', auth, adminAuth, orderController.updateStatus);

module.exports = router;
