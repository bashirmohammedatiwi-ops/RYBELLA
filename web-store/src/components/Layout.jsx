import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './Layout.css'

const navItems = [
  { path: '/', label: 'الرئيسية', icon: '🏠' },
  { path: '/explore', label: 'استكشف المنتجات', icon: '✨' },
  { path: '/categories', label: 'الفئات', icon: '📂' },
  { path: '/brands', label: 'العلامات', icon: '🏷️' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { totalCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="layout">
      {/* Top header - inspired by BuyMore/child.com */}
      <header className="layout-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="القائمة">
          <span className="menu-icon">≡</span>
        </button>
        <Link to="/" className="logo" onClick={closeSidebar}>
          Rybella
        </Link>
        <div className="header-actions">
          <Link to="/explore" className="header-link">المنتجات</Link>
          <Link to="/cart" className="cart-btn" onClick={closeSidebar}>
            <span className="cart-icon">🛒</span>
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </Link>
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-link" onClick={closeSidebar}>
                <span className="user-avatar">{user.name?.[0] || '?'}</span>
                <span className="user-name">{user.name}</span>
              </Link>
              <button className="logout-btn" onClick={() => { logout(); closeSidebar(); }}>
                خروج
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn" onClick={closeSidebar}>
              تسجيل الدخول
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar - inspired by BuyMore */}
      <aside className={`layout-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Rybella</span>
          <button className="close-btn" onClick={closeSidebar}>×</button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="sidebar-footer">
            <Link to="/orders" className="sidebar-link" onClick={closeSidebar}>
              <span className="nav-icon">📋</span>
              طلباتي
            </Link>
            <Link to="/wishlist" className="sidebar-link" onClick={closeSidebar}>
              <span className="nav-icon">❤️</span>
              المفضلة
            </Link>
            <button className="sidebar-link logout" onClick={() => { logout(); closeSidebar(); navigate('/'); }}>
              <span className="nav-icon">🚪</span>
              تسجيل الخروج
            </button>
          </div>
        )}
      </aside>

      <main className="layout-main">
        {children}
      </main>
    </div>
  )
}
