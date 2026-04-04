import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './MobileHeader.css'

export default function MobileHeader({ title, showBack = false, showCart = true }) {
  const navigate = useNavigate()
  const { totalCount } = useCart()

  return (
    <header className="mobile-header">
      <div className="mobile-header-inner">
        {showBack ? (
          <button className="mobile-header-btn" onClick={() => navigate(-1)} aria-label="رجوع">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <div className="mobile-header-spacer" />
        )}
        <h1 className="mobile-header-title">{title}</h1>
        {showCart ? (
          <Link to="/cart" className="mobile-header-btn mobile-header-cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {totalCount > 0 && <span className="mobile-header-cart-badge">{totalCount > 9 ? '9+' : totalCount}</span>}
          </Link>
        ) : (
          <div className="mobile-header-spacer" />
        )}
      </div>
    </header>
  )
}
