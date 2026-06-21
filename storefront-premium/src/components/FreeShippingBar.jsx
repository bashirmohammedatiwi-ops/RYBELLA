import { useState, useEffect } from 'react'
import { webSettingsAPI } from '../services/api'
import { formatPrice } from '../utils/format'
import './FreeShippingBar.css'

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
    <div className={`free-shipping-bar${reached ? ' is-complete' : ''}`}>
      <div className="free-shipping-bar-fill" style={{ width: `${pct}%` }} />
      <span className="free-shipping-bar-text">
        {reached
          ? '🎉 مبروك! حصلتِ على توصيل مجاني'
          : `اضيفي ${formatPrice(remaining)} لتحصلي على توصيل مجاني`}
      </span>
    </div>
  )
}
