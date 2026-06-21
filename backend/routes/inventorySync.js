const express = require('express')
const router = express.Router()
const inventorySyncController = require('../controllers/inventorySyncController')
const { auth, adminAuth } = require('../middleware/auth')

router.post('/inventory/bulk', inventorySyncController.bulkSync)
router.post('/inventory', inventorySyncController.singleSync)

router.get('/inventory/by-barcode/:barcode', auth, adminAuth, inventorySyncController.getByBarcode)
router.post('/inventory/refresh-all', auth, adminAuth, inventorySyncController.refreshAll)
router.post('/inventory/refresh-product/:productId', auth, adminAuth, inventorySyncController.refreshProduct)
router.post('/inventory/refresh-barcode/:barcode', auth, adminAuth, inventorySyncController.refreshBarcode)
router.get('/inventory/status', auth, adminAuth, inventorySyncController.getStatus)

module.exports = router
