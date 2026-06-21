const inventorySync = require('../services/inventorySyncService')

exports.bulkSync = async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : []
    const results = await inventorySync.syncBulk(items)
    res.json({ success: true, ...results })
  } catch (error) {
    console.error('Bulk inventory sync error:', error)
    res.status(500).json({ message: 'فشل مزامنة المخزون' })
  }
}

exports.singleSync = async (req, res) => {
  try {
    const result = await inventorySync.syncItem(req.body || {})
    if (!result.ok) return res.status(400).json({ message: 'بيانات غير صالحة' })
    res.json(result)
  } catch (error) {
    console.error('Single inventory sync error:', error)
    res.status(500).json({ message: 'فشل مزامنة المخزون' })
  }
}

exports.getByBarcode = async (req, res) => {
  try {
    const data = await inventorySync.getByBarcode(req.params.barcode)
    if (!data?.snapshot && !data?.variants?.length && !data?.products?.length) {
      const external = await inventorySync.syncBarcodeFromExternal(req.params.barcode)
      if (external.ok) {
        const refreshed = await inventorySync.getByBarcode(req.params.barcode)
        return res.json(refreshed)
      }
      return res.status(404).json({ message: 'لم يُعثر على بيانات لهذا الباركود' })
    }
    res.json(data)
  } catch (error) {
    console.error('Get by barcode error:', error)
    res.status(500).json({ message: 'حدث خطأ في الخادم' })
  }
}

exports.refreshAll = async (req, res) => {
  try {
    const stats = await inventorySync.refreshAllFromExternal()
    res.json({ success: true, ...stats })
  } catch (error) {
    console.error('Refresh all error:', error)
    res.status(500).json({ message: 'فشل تحديث المخزون' })
  }
}

exports.refreshProduct = async (req, res) => {
  try {
    const result = await inventorySync.refreshProduct(req.params.productId)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('Refresh product error:', error)
    res.status(500).json({ message: 'فشل تحديث المنتج' })
  }
}

exports.refreshBarcode = async (req, res) => {
  try {
    const result = await inventorySync.syncBarcodeFromExternal(req.params.barcode)
    if (!result.ok) return res.status(404).json({ message: 'لم تُجلب بيانات لهذا الباركود', ...result })
    res.json(result)
  } catch (error) {
    console.error('Refresh barcode error:', error)
    res.status(500).json({ message: 'فشل جلب بيانات الباركود' })
  }
}
