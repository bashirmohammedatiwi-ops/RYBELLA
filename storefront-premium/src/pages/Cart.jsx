import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { IMG_BASE } from '../services/api'
import FreeShippingBar from '../components/FreeShippingBar'
import MobileHeader from '../components/MobileHeader'
import './Cart.css'

export default function Cart() {
  const { user } = useAuth()
  const { items, loading, updateItem, removeItem, loadCart } = useCart()

  useEffect(() => {
    loadCart()
  }, [user])

  const getItemId = (item) => item.id ?? item.variant_id
  const getItemImage = (item) => item.variant_image || item.product_image || item.image
  const getItemName = (item) => item.product_name || 'منتج'
  const getItemPrice = (item) => item.price ?? 0

  const total = items.reduce((sum, i) => sum + getItemPrice(i) * (i.quantity || 0), 0)

  if (loading && user) {
    return (
      <div className="cart-page cart-loading">
        <MobileHeader title="السلة" showBack showCart={false} />
        <div className="cart-loading-content">
          <div className="cart-spinner" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="cart-page cart-empty">
        <MobileHeader title="السلة" showBack showCart={false} />
        <div className="cart-empty-content">
          <div className="cart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </div>
          <h2>سلة التسوق فارغة</h2>
          <p>{user ? 'أضيفي منتجاتك المفضلة وابدئي التسوق' : 'سجّلي الدخول لعرض السلة أو تصفّحي وأضيفي منتجات'}</p>
          <div className="cart-empty-actions">
            <Link to="/explore" className="cart-btn-primary">تسوق الآن</Link>
            {!user && <Link to="/login" className="cart-btn-secondary">تسجيل الدخول</Link>}
          </div>
        </div>
      </div>
    )
  }

  const itemCount = items.reduce((s, i) => s + (i.quantity || 0), 0)

  return (
    <div className="cart-page">
      <MobileHeader title="السلة" showBack showCart={false} />
      <div className="cart-content">
        <div className="cart-header">
          <h2 className="cart-title">سلة التسوق</h2>
          <span className="cart-badge">{itemCount} {itemCount === 1 ? 'منتج' : 'منتجات'}</span>
        </div>
        {!user && (
          <Link to="/login" className="cart-guest-banner">
            <span className="cart-guest-icon">🔐</span>
            سجّلي الدخول لإتمام الطلب وحفظ السلة
          </Link>
        )}
        <FreeShippingBar subtotal={total} />
        <div className="cart-list">
          {items.map((item, idx) => {
            const img = getItemImage(item)
            const itemTotal = getItemPrice(item) * (item.quantity || 0)
            const qty = item.quantity || 1
            return (
              <div key={getItemId(item)} className="cart-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                <Link to={`/products/${item.product_id || item.productId || ''}`} className="cart-item-image">
                  {img ? <img src={`${IMG_BASE}${img}`} alt="" /> : <span className="cart-item-placeholder">صورة</span>}
                  {qty > 1 && <span className="cart-item-qty-badge">×{qty}</span>}
                </Link>
                <div className="cart-item-body">
                  <Link to={`/products/${item.product_id || item.productId || ''}`} className="cart-item-name">
                    {getItemName(item)}
                  </Link>
                  {item.shade_name && <span className="cart-item-shade">{item.shade_name}</span>}
                  <div className="cart-item-row">
                    <span className="cart-item-unit-price">{getItemPrice(item).toLocaleString('ar-IQ')} د.ع</span>
                    <div className="cart-item-qty">
                      <button type="button" onClick={() => updateItem(getItemId(item), Math.max(1, (item.quantity || 0) - 1))}>−</button>
                      <span>{item.quantity || 1}</span>
                      <button type="button" onClick={() => updateItem(getItemId(item), (item.quantity || 0) + 1)}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-footer">
                    <span className="cart-item-total">{itemTotal.toLocaleString('ar-IQ')} د.ع</span>
                    <button type="button" className="cart-item-remove" onClick={() => removeItem(getItemId(item))} aria-label="حذف">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>المجموع ({itemCount} {itemCount === 1 ? 'منتج' : 'منتجات'})</span>
            <strong>{total.toLocaleString('ar-IQ')} د.ع</strong>
          </div>
          <Link to="/checkout" className="cart-checkout-btn">إتمام الطلب</Link>
          <Link to="/explore" className="cart-continue-link">استمري في التسوق</Link>
        </div>
      </div>
      <div className="cart-sticky-bar">
        <div className="cart-sticky-info">
          <span className="cart-sticky-total">{total.toLocaleString('ar-IQ')} د.ع</span>
          <span className="cart-sticky-count">{itemCount} منتج</span>
        </div>
        <Link to="/checkout" className="cart-sticky-btn">إتمام الطلب</Link>
      </div>
    </div>
  )
}
