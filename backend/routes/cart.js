const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

router.get('/', auth, cartController.getCart);
router.post('/add', auth, cartController.addItem);
router.post('/add-bundle', auth, cartController.addBundle);
router.put('/bundles/:bundleId', auth, cartController.updateBundle);
router.delete('/bundles/:bundleId', auth, cartController.removeBundle);
router.put('/:itemId', auth, cartController.updateItem);
router.delete('/:itemId', auth, cartController.removeItem);
router.delete('/', auth, cartController.clearCart);

module.exports = router;
