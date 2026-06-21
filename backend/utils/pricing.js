const PRICE_ROUND_STEP = 250;

function roundSalePrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const rounded = Math.round(n / PRICE_ROUND_STEP) * PRICE_ROUND_STEP;
  return rounded > 0 ? rounded : PRICE_ROUND_STEP;
}

module.exports = {
  PRICE_ROUND_STEP,
  roundSalePrice,
};
