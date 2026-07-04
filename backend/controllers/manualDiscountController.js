const db = require('../config/database');
const {
  applyManualDiscountToVariants,
  expireManualDiscounts,
  getManualDiscountStatus,
} = require('../services/pricingService');

exports.getStatus = async (req, res) => {
  try {
    await expireManualDiscounts(db);
    const status = await getManualDiscountStatus(db);
    res.json(status);
  } catch (error) {
    console.error('Manual discount status error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.applyAll = async (req, res) => {
  try {
    const discountPercent = Number(req.body?.discount_percent);
    const until = req.body?.until || req.body?.manual_discount_until || null;

    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      return res.status(400).json({ message: 'نسبة الخصم يجب أن تكون بين 1 و 100' });
    }
    if (!until) {
      return res.status(400).json({ message: 'تاريخ انتهاء الخصم مطلوب' });
    }
    if (new Date(until).getTime() <= Date.now()) {
      return res.status(400).json({ message: 'تاريخ الانتهاء يجب أن يكون في المستقبل' });
    }

    const result = await db.runBulkWrite(() =>
      applyManualDiscountToVariants(db, { discountPercent, until }),
    );
    res.json({
      message: `تم تطبيق خصم ${discountPercent}% على ${result.updated} عنصر`,
      ...result,
    });
  } catch (error) {
    console.error('Apply all manual discount error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.clearAll = async (req, res) => {
  try {
    const result = await db.runBulkWrite(() =>
      applyManualDiscountToVariants(db, { discountPercent: 0 }),
    );
    res.json({
      message: `تم إلغاء الخصم اليدوي عن ${result.updated} عنصر واستعادة أسعار السيرفر`,
      ...result,
    });
  } catch (error) {
    console.error('Clear all manual discount error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.applyProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const discountPercent = Number(req.body?.discount_percent);
    const until = req.body?.until || req.body?.manual_discount_until || null;

    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({ message: 'نسبة الخصم يجب أن تكون بين 0 و 100' });
    }
    if (discountPercent > 0) {
      if (!until) {
        return res.status(400).json({ message: 'تاريخ انتهاء الخصم مطلوب' });
      }
      if (new Date(until).getTime() <= Date.now()) {
        return res.status(400).json({ message: 'تاريخ الانتهاء يجب أن يكون في المستقبل' });
      }
    }

    const result = await applyManualDiscountToVariants(db, {
      discountPercent,
      until: discountPercent > 0 ? until : null,
      productId,
    });
    if (!result.updated) {
      return res.status(404).json({ message: 'المنتج غير موجود أو بدون عناصر' });
    }
    res.json({
      message: discountPercent > 0
        ? `تم تطبيق خصم ${discountPercent}% على منتج #${productId}`
        : `تم إلغاء الخصم اليدوي للمنتج #${productId}`,
      ...result,
    });
  } catch (error) {
    console.error('Apply product manual discount error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.applyVariant = async (req, res) => {
  try {
    const variantId = req.params.variantId;
    const discountPercent = Number(req.body?.discount_percent);
    const until = req.body?.until || req.body?.manual_discount_until || null;

    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({ message: 'نسبة الخصم يجب أن تكون بين 0 و 100' });
    }
    if (discountPercent > 0) {
      if (!until) {
        return res.status(400).json({ message: 'تاريخ انتهاء الخصم مطلوب' });
      }
      if (new Date(until).getTime() <= Date.now()) {
        return res.status(400).json({ message: 'تاريخ الانتهاء يجب أن يكون في المستقبل' });
      }
    }

    const result = await applyManualDiscountToVariants(db, {
      discountPercent,
      until: discountPercent > 0 ? until : null,
      variantId,
    });
    if (!result.updated) {
      return res.status(404).json({ message: 'العنصر غير موجود' });
    }
    res.json({
      message: discountPercent > 0
        ? `تم تطبيق خصم ${discountPercent}% على العنصر #${variantId}`
        : `تم إلغاء الخصم اليدوي للعنصر #${variantId}`,
      ...result,
    });
  } catch (error) {
    console.error('Apply variant manual discount error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.expireNow = async (req, res) => {
  try {
    const expired = await expireManualDiscounts(db);
    res.json({ message: `تمت استعادة أسعار السيرفر لـ ${expired} عنصر منتهي`, expired });
  } catch (error) {
    console.error('Expire manual discounts error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
