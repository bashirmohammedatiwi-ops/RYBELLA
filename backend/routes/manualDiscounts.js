const express = require('express');
const router = express.Router();
const manualDiscountController = require('../controllers/manualDiscountController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/status', auth, adminAuth, manualDiscountController.getStatus);
router.post('/apply-all', auth, adminAuth, manualDiscountController.applyAll);
router.post('/clear-all', auth, adminAuth, manualDiscountController.clearAll);
router.post('/expire-now', auth, adminAuth, manualDiscountController.expireNow);
router.put('/product/:productId', auth, adminAuth, manualDiscountController.applyProduct);
router.put('/variant/:variantId', auth, adminAuth, manualDiscountController.applyVariant);

module.exports = router;
