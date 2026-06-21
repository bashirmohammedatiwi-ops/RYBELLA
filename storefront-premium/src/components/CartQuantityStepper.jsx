import { useRef } from 'react'
import { formatNumber } from '../utils/format'

export default function CartQuantityStepper({ value, onDecrease, onIncrease, min = 1 }) {
  const qty = value || 1
  const lockRef = useRef(false)

  const run = (action) => {
    if (lockRef.current) return
    lockRef.current = true
    action()
    window.setTimeout(() => {
      lockRef.current = false
    }, 120)
  }

  return (
    <div className="cart-item-qty" role="group" aria-label="الكمية">
      <button
        type="button"
        className="cart-qty-btn"
        onClick={() => run(onDecrease)}
        disabled={qty <= min}
        aria-label="تقليل الكمية"
      >
        −
      </button>
      <span className="cart-qty-value" aria-live="off" aria-atomic="true">
        {formatNumber(qty)}
      </span>
      <button
        type="button"
        className="cart-qty-btn"
        onClick={() => run(onIncrease)}
        aria-label="زيادة الكمية"
      >
        +
      </button>
    </div>
  )
}
