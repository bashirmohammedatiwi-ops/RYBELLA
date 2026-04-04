import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './BottomNav.css'

const TABS = [
  { path: '/', label: 'الرئيسية', icon: 'home' },
  { path: '/categories', label: 'الفئات', icon: 'view-grid' },
  { path: '/cart', label: 'السلة', icon: 'cart', isCart: true },
  { path: '/orders', label: 'طلباتي', icon: 'clipboard-list' },
  { path: '/profile', label: 'حسابي', icon: 'account' },
]

function NavIcon({ name }) {
  const icons = {
    home: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    'view-grid': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    cart: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
    'clipboard-list': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="15" y2="16" />
      </svg>
    ),
    account: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }
  return icons[name] || icons.home
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalCount } = useCart()
  const { user } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleTabClick = (tab) => {
    if (tab.path === '/orders' && !user) {
      navigate('/login')
      return
    }
    if (tab.path === '/profile' && !user) {
      navigate('/login')
      return
    }
    navigate(tab.path)
  }

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-bar">
        {TABS.map((tab) => {
          if (tab.isCart) {
            const active = isActive('/cart')
            return (
              <div key={tab.path} className="mobile-nav-cart-slot">
                <button
                  className={`mobile-nav-cart-btn ${active ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab)}
                >
                  <span className="mobile-nav-cart-icon">
                    <NavIcon name="cart" />
                    {totalCount > 0 && (
                      <span className={`mobile-nav-cart-badge ${active ? 'active' : ''}`}>
                        {totalCount > 99 ? '99+' : totalCount}
                      </span>
                    )}
                  </span>
                </button>
                <span className={`mobile-nav-label ${active ? 'active' : ''}`}>{tab.label}</span>
              </div>
            )
          }
          const active = isActive(tab.path)
          return (
            <button
              key={tab.path}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              <span className="mobile-nav-icon">
                <NavIcon name={tab.icon} />
              </span>
              <span className="mobile-nav-label">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
