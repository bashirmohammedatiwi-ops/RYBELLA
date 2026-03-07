const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, couponController.getAll);
router.post('/', auth, adminAuth, couponController.create);
router.post('/apply', auth, couponController.apply);

module.exports = router;
