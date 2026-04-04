import { useState, useEffect } from 'react'
import { webSettingsAPI } from '../services/api'
import './FreeShippingBar.css'

export default function FreeShippingBar({ subtotal }) {
  const [threshold, setThreshold] = useState(null)

  useEffect(() => {
    webSettingsAPI.get().then((r) => {
      const t = parseInt(r?.data?.free_shipping_threshold, 10)
      if (!isNaN(t) && t > 0) setThreshold(t)
    }).catch(() => {})
  }, [])

  if (!threshold || subtotal >= threshold) return null

  const remaining = threshold - subtotal
  const pct = Math.min(100, (subtotal / threshold) * 100)

  return (
    <div className="free-shipping-bar">
      <div className="free-shipping-bar-fill" style={{ width: pct + '%' }} />
      <span className="free-shipping-bar-text">
        اضيفي {remaining.toLocaleString('ar-IQ')} د.ع لتحصلي على توصيل مجاني
      </span>
    </div>
  )
}
