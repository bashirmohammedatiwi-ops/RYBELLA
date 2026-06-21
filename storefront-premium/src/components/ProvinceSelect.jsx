import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../utils/format'
import { computeDeliveryFee, qualifiesForFreeShipping } from '../utils/delivery'
import './ProvinceSelect.css'

export default function ProvinceSelect({ zones, value, onChange, disabled, subtotal = 0, freeShippingThreshold = 50000 }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = zones.find((z) => z.city === value)
  const freeShipping = qualifiesForFreeShipping(subtotal, freeShippingThreshold)

  const formatZoneFee = (zone) => {
    const fee = computeDeliveryFee(subtotal, zone.delivery_fee, freeShippingThreshold)
    return fee === 0 ? 'مجاني' : formatPrice(fee)
  }

  const handleSelect = (zone) => {
    onChange(zone.city, Number(zone.delivery_fee) || 0)
    setOpen(false)
  }

  return (
    <div className={`province-select ${open ? 'is-open' : ''} ${value ? 'has-value' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="province-select-trigger"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="province-select-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <span className="province-select-content">
          <span className="province-select-label">المحافظة</span>
          <span className={`province-select-value ${!value ? 'is-placeholder' : ''}`}>
            {value || 'اختر المحافظة'}
          </span>
        </span>
        {selected && (
          <span className={`province-select-fee ${freeShipping ? 'is-free' : ''}`}>
            {formatZoneFee(selected)}
          </span>
        )}
        <span className={`province-select-chevron ${open ? 'is-open' : ''}`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="province-select-dropdown" role="listbox">
          <div className="province-select-dropdown-head">
            <span>المحافظات المتاحة</span>
            <span>{zones.length} محافظة</span>
          </div>
          <ul className="province-select-list">
            {zones.map((zone) => {
              const isSelected = zone.city === value
              return (
                <li key={zone.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`province-select-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(zone)}
                  >
                    <span className="province-select-option-name">{zone.city}</span>
                    <span className={`province-select-option-fee ${freeShipping ? 'is-free' : ''}`}>
                      توصيل {formatZoneFee(zone)}
                    </span>
                    {isSelected && (
                      <span className="province-select-check" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
