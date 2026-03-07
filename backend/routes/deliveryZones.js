const express = require('express');
const router = express.Router();
const deliveryZoneController = require('../controllers/deliveryZoneController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', deliveryZoneController.getAll);
router.post('/', auth, adminAuth, deliveryZoneController.create);
router.put('/:id', auth, adminAuth, deliveryZoneController.update);
router.delete('/:id', auth, adminAuth, deliveryZoneController.delete);

module.exports = router;
