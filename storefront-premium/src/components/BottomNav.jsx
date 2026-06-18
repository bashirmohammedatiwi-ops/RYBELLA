import { NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatCount } from '../utils/format'
import './BottomNav.css'

function getLoginReturnPath(location) {
  const from = location.state?.from
  if (typeof from === 'string') return from
  return from?.pathname || null
}

function useIsTabActive(path, end = false) {
  const location = useLocation()
  const { pathname } = location

  const matches =
    end
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`)

  if (matches) return true

  if (pathname === '/login') {
    const fromPath = getLoginReturnPath(location)
    if (!fromPath) return false
    return end
      ? fromPath === path
      : fromPath === path || fromPath.startsWith(`${path}/`)
  }

  return false
}

const TABS = [
  { path: '/', label: 'الرئيسية', icon: 'home', end: true },
  { path: '/categories', label: 'الفئات', icon: 'view-grid' },
  { path: '/cart', label: 'السلة', icon: 'cart', isCart: true },
  { path: '/orders', label: 'طلباتي', icon: 'clipboard-list', auth: true },
  { path: '/profile', label: 'حسابي', icon: 'account', auth: true },
]

function NavIcon({ name, active }) {
  const stroke = active ? 'var(--primary)' : 'currentColor'
  const icons = {
    home: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    'view-grid': (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    cart: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
    'clipboard-list': (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
    account: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }
  return icons[name] || icons.home
}

function CartTab({ totalCount }) {
  const badge = formatCount(totalCount)
  const isActive = useIsTabActive('/cart')

  return (
    <NavLink
      to="/cart"
      className={`mobile-nav-cart-slot${isActive ? ' active' : ''}`}
      aria-label="السلة"
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="mobile-nav-cart-btn">
        <span className="mobile-nav-cart-icon">
          <NavIcon name="cart" active={isActive} />
          {badge && <span className="mobile-nav-cart-badge">{badge}</span>}
        </span>
      </span>
      <span className="mobile-nav-label">السلة</span>
    </NavLink>
  )
}

function NavTab({ tab }) {
  const isActive = useIsTabActive(tab.path, Boolean(tab.end))

  return (
    <NavLink
      to={tab.path}
      end={tab.end}
      className={`mobile-nav-item${isActive ? ' active' : ''}`}
      aria-label={tab.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="mobile-nav-icon-wrap">
        <NavIcon name={tab.icon} active={isActive} />
      </span>
      <span className="mobile-nav-label">{tab.label}</span>
    </NavLink>
  )
}

export default function BottomNav() {
  const { totalCount } = useCart()

  return (
    <nav className="mobile-bottom-nav" aria-label="التنقل الرئيسي">
      <div className="mobile-bottom-nav-inner">
        <div className="mobile-bottom-nav-bar">
          {TABS.map((tab) =>
            tab.isCart ? (
              <CartTab key={tab.path} totalCount={totalCount} />
            ) : (
              <NavTab key={tab.path} tab={tab} />
            )
          )}
        </div>
      </div>
    </nav>
  )
}
