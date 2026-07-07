import { useState, useEffect } from 'react'
import { webSettingsAPI } from '../services/api'
import { formatPrice } from '../utils/format'
import './FreeShippingBar.css'

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="1.5" />
      <path d="M16 8h4l3 4v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export default function FreeShippingBar({ subtotal }) {
  const [threshold, setThreshold] = useState(null)

  useEffect(() => {
    webSettingsAPI.get().then((r) => {
      const t = parseInt(r?.data?.free_shipping_threshold, 10)
      if (!isNaN(t) && t > 0) setThreshold(t)
    }).catch(() => {})
  }, [])

  if (!threshold) {
    return <div className="free-shipping-bar free-shipping-bar--placeholder" aria-hidden="true" />
  }

  const reached = subtotal >= threshold
  const remaining = Math.max(0, threshold - subtotal)
  const pct = reached ? 100 : Math.min(100, (subtotal / threshold) * 100)

  return (
    <div className={`free-shipping-bar${reached ? ' is-complete' : ''}`} role="status" aria-live="polite">
      <div className="free-shipping-bar-top">
        <span className="free-shipping-bar-icon" aria-hidden="true">
          {reached ? <CheckIcon /> : <TruckIcon />}
        </span>
        <div className="free-shipping-bar-copy">
          {reached ? (
            <>
              <strong className="free-shipping-bar-title">مبروك! توصيل مجاني 🎉</strong>
              <span className="free-shipping-bar-sub">طلبكِ مؤهل للتوصيل بدون رسوم</span>
            </>
          ) : (
            <>
              <strong className="free-shipping-bar-title">
                بقي <span className="free-shipping-bar-amount">{formatPrice(remaining)}</span> للتوصيل المجاني
              </strong>
              <span className="free-shipping-bar-sub">
                أضيفي منتجات بقيمة {formatPrice(remaining)} لتفعيل التوصيل المجاني
              </span>
            </>
          )}
        </div>
        <span className="free-shipping-bar-pct" aria-hidden="true">{Math.round(pct)}%</span>
      </div>

      <div className="free-shipping-bar-track" aria-hidden="true">
        <div className="free-shipping-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
