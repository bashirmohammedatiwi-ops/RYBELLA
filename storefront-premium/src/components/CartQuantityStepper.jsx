import { formatNumber } from '../utils/format'

export default function CartQuantityStepper({
  value,
  onDecrease,
  onIncrease,
  min = 1,
}) {
  const qty = Number(value) || 1

  return (
    <div className="cart-item-qty" role="group" aria-label="الكمية">
      <button
        type="button"
        className="cart-qty-btn"
        onClick={onDecrease}
        disabled={qty <= min}
        aria-label="تقليل الكمية"
      >
        −
      </button>
      <span className="cart-qty-value">{formatNumber(qty)}</span>
      <button
        type="button"
        className="cart-qty-btn"
        onClick={onIncrease}
        aria-label="زيادة الكمية"
      >
        +
      </button>
    </div>
  )
}
