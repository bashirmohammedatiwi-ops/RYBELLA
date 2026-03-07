const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/stats', auth, adminAuth, dashboardController.getStats);
router.get('/low-stock', auth, adminAuth, dashboardController.getLowStock);
router.get('/top-products', auth, adminAuth, dashboardController.getTopProducts);

module.exports = router;
