const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, adminAuth, staffAuth } = require('../middleware/auth');

router.get('/', auth, orderController.getAll);
router.post('/:id/to-cart', auth, orderController.loadOrderToCart);
router.put('/:id/from-cart', auth, orderController.replaceFromCart);
router.get('/:id', auth, orderController.getById);
router.post('/', auth, orderController.create);
router.put('/:id', auth, orderController.updateByCustomer);
router.put('/:id/status', auth, staffAuth, orderController.updateStatus);
router.delete('/:id', auth, adminAuth, orderController.delete);

module.exports = router;
