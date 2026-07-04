const DISPLAY_PRICE_ROUND_STEP = 250;

function clampPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function roundDisplayPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const rounded = Math.round(n / DISPLAY_PRICE_ROUND_STEP) * DISPLAY_PRICE_ROUND_STEP;
  return rounded > 0 ? rounded : DISPLAY_PRICE_ROUND_STEP;
}

function isManualDiscountActive(variant, now = new Date()) {
  const pct = Number(variant?.manual_discount_percent);
  if (!Number.isFinite(pct) || pct <= 0) return false;
  const until = variant?.manual_discount_until;
  if (!until) return true;
  const end = new Date(until);
  if (Number.isNaN(end.getTime())) return false;
  return end > now;
}

function getSyncBaseline(variant) {
  const syncPrice = variant?.sync_price != null
    ? clampPrice(variant.sync_price)
    : clampPrice(variant?.price);
  const syncOriginal = variant?.sync_original_price != null
    ? clampPrice(variant.sync_original_price)
    : clampPrice(variant?.original_price) || syncPrice;
  const syncDiscount = variant?.sync_discount_percent != null
    ? Number(variant.sync_discount_percent) || 0
    : Number(variant?.discount_percent) || 0;

  return {
    syncPrice: syncPrice || syncOriginal,
    syncOriginal: syncOriginal || syncPrice,
    syncDiscount: Math.max(0, Math.min(100, syncDiscount)),
  };
}

function computeManualPrice(originalPrice, discountPercent) {
  const original = clampPrice(originalPrice);
  const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  if (original <= 0 || pct <= 0) {
    return { price: original, original_price: original, discount_percent: 0 };
  }
  const price = roundDisplayPrice(original * (1 - pct / 100)) || original;
  return {
    price,
    original_price: original,
    discount_percent: pct,
  };
}

function normalizeSyncPricing(price, originalPrice, discountPercent) {
  const fin = clampPrice(price);
  const orig = clampPrice(originalPrice) || fin;
  const discount = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const hasDiscount = discount > 0 && orig > fin && fin > 0;
  return {
    price: fin,
    original_price: hasDiscount ? orig : fin,
    discount_percent: hasDiscount ? discount : 0,
  };
}

function resolveEffectivePricing(variant, now = new Date()) {
  const baseline = getSyncBaseline(variant);
  const manualActive = isManualDiscountActive(variant, now);

  if (manualActive) {
    const effective = computeManualPrice(baseline.syncOriginal, variant.manual_discount_percent);
    variant.price = effective.price;
    variant.original_price = effective.original_price;
    variant.discount_percent = effective.discount_percent;
    variant.pricing_source = 'manual';
    variant.manual_discount_active = 1;
  } else {
    const effective = normalizeSyncPricing(
      baseline.syncPrice,
      baseline.syncOriginal,
      baseline.syncDiscount,
    );
    variant.price = effective.price;
    variant.original_price = effective.original_price;
    variant.discount_percent = effective.discount_percent;
    variant.pricing_source = 'sync';
    variant.manual_discount_active = 0;
  }

  variant.auto_discount_percent = baseline.syncDiscount;
  variant.sync_original_price = baseline.syncOriginal;
  variant.sync_discount_percent = baseline.syncDiscount;
  return variant;
}

function resolveVariantsPricing(variants, now = new Date()) {
  return (variants || []).map((variant) => resolveEffectivePricing({ ...variant }, now));
}

function buildEffectiveFromSyncRow(row, syncItem) {
  const syncPrice = clampPrice(syncItem.price);
  const syncOriginal = clampPrice(syncItem.originalPrice) || syncPrice;
  const syncDiscount = Math.max(0, Math.min(100, Number(syncItem.discountPercent) || 0));

  const base = {
    sync_price: syncPrice,
    sync_original_price: syncOriginal,
    sync_discount_percent: syncDiscount,
  };

  if (isManualDiscountActive(row)) {
    const manual = computeManualPrice(syncOriginal, row.manual_discount_percent);
    return {
      ...base,
      price: manual.price,
      original_price: manual.original_price,
      discount_percent: manual.discount_percent,
    };
  }

  const effective = normalizeSyncPricing(syncPrice, syncOriginal, syncDiscount);
  return { ...base, ...effective };
}

async function expireManualDiscounts(db) {
  const [rows] = await db.query(
    `SELECT id, sync_price, sync_original_price, sync_discount_percent, price, original_price, discount_percent
     FROM product_variants
     WHERE manual_discount_until IS NOT NULL
       AND manual_discount_until <= NOW()
       AND manual_discount_percent IS NOT NULL
       AND manual_discount_percent > 0`,
  );

  for (const row of rows) {
    const baseline = getSyncBaseline(row);
    const effective = normalizeSyncPricing(
      baseline.syncPrice,
      baseline.syncOriginal,
      baseline.syncDiscount,
    );
    await db.query(
      `UPDATE product_variants SET
        manual_discount_percent = NULL,
        manual_discount_until = NULL,
        price = ?,
        original_price = ?,
        discount_percent = ?
       WHERE id = ?`,
      [effective.price, effective.original_price, effective.discount_percent, row.id],
    );
  }

  return rows.length;
}

async function applyManualDiscountToVariants(db, { discountPercent, until, productId, variantId } = {}) {
  const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const untilVal = until || null;

  let query = 'SELECT * FROM product_variants WHERE 1=1';
  const params = [];
  if (variantId) {
    query += ' AND id = ?';
    params.push(variantId);
  } else if (productId) {
    query += ' AND product_id = ?';
    params.push(productId);
  }

  const [variants] = await db.query(query, params);
  if (!variants.length) return { updated: 0 };

  let updated = 0;
  for (const row of variants) {
    const baseline = getSyncBaseline(row);
    await db.query(
      `UPDATE product_variants SET
        sync_price = COALESCE(sync_price, ?),
        sync_original_price = COALESCE(sync_original_price, ?),
        sync_discount_percent = COALESCE(sync_discount_percent, ?)
       WHERE id = ?`,
      [baseline.syncPrice, baseline.syncOriginal, baseline.syncDiscount, row.id],
    );

    if (pct <= 0) {
      const effective = normalizeSyncPricing(
        baseline.syncPrice,
        baseline.syncOriginal,
        baseline.syncDiscount,
      );
      await db.query(
        `UPDATE product_variants SET
          manual_discount_percent = NULL,
          manual_discount_until = NULL,
          price = ?,
          original_price = ?,
          discount_percent = ?
         WHERE id = ?`,
        [effective.price, effective.original_price, effective.discount_percent, row.id],
      );
    } else {
      const effective = computeManualPrice(baseline.syncOriginal, pct);
      await db.query(
        `UPDATE product_variants SET
          manual_discount_percent = ?,
          manual_discount_until = ?,
          price = ?,
          original_price = ?,
          discount_percent = ?
         WHERE id = ?`,
        [pct, untilVal, effective.price, effective.original_price, effective.discount_percent, row.id],
      );
    }
    updated += 1;
  }

  return { updated, discount_percent: pct, until: untilVal };
}

async function getManualDiscountStatus(db) {
  const [activeRows] = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM product_variants
     WHERE manual_discount_percent IS NOT NULL
       AND manual_discount_percent > 0
       AND (manual_discount_until IS NULL OR manual_discount_until > NOW())`,
  );
  const [expiredRows] = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM product_variants
     WHERE manual_discount_until IS NOT NULL
       AND manual_discount_until <= NOW()
       AND manual_discount_percent IS NOT NULL
       AND manual_discount_percent > 0`,
  );
  const [sample] = await db.query(
    `SELECT manual_discount_percent, manual_discount_until
     FROM product_variants
     WHERE manual_discount_percent IS NOT NULL
       AND manual_discount_percent > 0
       AND (manual_discount_until IS NULL OR manual_discount_until > NOW())
     ORDER BY manual_discount_until DESC NULLS LAST
     LIMIT 1`,
  );

  return {
    active_variants: activeRows[0]?.count || 0,
    expired_pending_cleanup: expiredRows[0]?.count || 0,
    current_discount_percent: sample[0]?.manual_discount_percent ?? null,
    current_until: sample[0]?.manual_discount_until ?? null,
  };
}

module.exports = {
  DISPLAY_PRICE_ROUND_STEP,
  clampPrice,
  roundDisplayPrice,
  isManualDiscountActive,
  getSyncBaseline,
  computeManualPrice,
  normalizeSyncPricing,
  resolveEffectivePricing,
  resolveVariantsPricing,
  buildEffectiveFromSyncRow,
  expireManualDiscounts,
  applyManualDiscountToVariants,
  getManualDiscountStatus,
};
