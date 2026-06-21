import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { IMG_BASE } from '../services/api'
import FreeShippingBar from '../components/FreeShippingBar'
import MobileHeader from '../components/MobileHeader'
import { formatPrice, formatNumber, formatPercent } from '../utils/format'
import { roundDisplayPrice } from '../utils/pricing'
import './Cart.css'

export default function Cart() {
  const { user } = useAuth()
  const {
    items,
    bundles,
    loading,
    updateItem,
    updateBundle,
    removeItem,
    removeBundle,
    totalCount,
  } = useCart()

  const getItemId = (item) => (item.id != null ? item.id : item.variant_id)
  const getBundleId = (bundle) => bundle.id ?? bundle.bundle_key ?? bundle.offer_id
  const getItemImage = (item) => item.variant_image || item.product_image || item.image
  const getItemName = (item) => item.product_name || 'منتج'
  const getItemPrice = (item) => roundDisplayPrice(item.price) ?? item.price ?? 0
  const getBundleTotal = (b) => b.total_price ?? (b.unit_price || 0) * (b.quantity || 1)

  const itemsTotal = items.reduce((sum, i) => sum + getItemPrice(i) * (i.quantity || 0), 0)
  const bundlesTotal = bundles.reduce((sum, b) => sum + getBundleTotal(b), 0)
  const total = itemsTotal + bundlesTotal
  const isInitialLoading = loading && user && items.length === 0 && bundles.length === 0
  const isEmpty = !isInitialLoading && items.length === 0 && bundles.length === 0

  if (isInitialLoading) {
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

  if (isEmpty) {
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

  return (
    <div className="cart-page">
      <MobileHeader title="السلة" showBack showCart={false} />
      <div className="cart-content">
        <div className="cart-header">
          <h2 className="cart-title">سلة التسوق</h2>
          <span className="cart-badge">{formatNumber(totalCount)} {totalCount === 1 ? 'عنصر' : 'عناصر'}</span>
        </div>
        {!user && (
          <Link to="/login" className="cart-guest-banner">
            <span className="cart-guest-icon">🔐</span>
            سجّلي الدخول لإتمام الطلب وحفظ السلة
          </Link>
        )}
        <FreeShippingBar subtotal={total} />
        <div className="cart-list">
          {bundles.map((bundle, idx) => {
            const qty = bundle.quantity || 1
            const bundleId = getBundleId(bundle)
            const img = bundle.offer_image || bundle.lines?.[0]?.image
            return (
              <div key={`bundle-${bundleId}`} className="cart-bundle-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="cart-bundle-head">
                  <div className="cart-bundle-thumb">
                    {img ? <img src={`${IMG_BASE}${img}`} alt="" /> : <span>باكج</span>}
                  </div>
                  <div className="cart-bundle-meta">
                    <span className="cart-bundle-badge">باكج حصري</span>
                    <h3>{bundle.offer_title || 'باكج حصري'}</h3>
                    {bundle.discount_percent > 0 && (
                      <span className="cart-bundle-discount">خصم {formatPercent(bundle.discount_percent)}</span>
                    )}
                  </div>
                </div>
                <ul className="cart-bundle-lines">
                  {(bundle.lines || []).map((line) => (
                    <li key={line.variant_id}>
                      <span>{line.product_name}{line.shade_name ? ` (${line.shade_name})` : ''}</span>
                      <span>{formatPrice(line.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="cart-item-row">
                  <span className="cart-item-unit-price">{formatPrice(bundle.unit_price || getBundleTotal(bundle) / qty)}</span>
                  <div className="cart-item-qty">
                    <button type="button" onClick={() => updateBundle(bundleId, Math.max(1, qty - 1))}>−</button>
                    <span>{formatNumber(qty)}</span>
                    <button type="button" onClick={() => updateBundle(bundleId, qty + 1)}>+</button>
                  </div>
                </div>
                <div className="cart-item-footer">
                  <span className="cart-item-total">{formatPrice(getBundleTotal(bundle))}</span>
                  <button type="button" className="cart-item-remove" onClick={() => removeBundle(bundleId)}>
                    حذف الباكج
                  </button>
                </div>
              </div>
            )
          })}

          {items.map((item, idx) => {
            const img = getItemImage(item)
            const itemTotal = getItemPrice(item) * (item.quantity || 0)
            const qty = item.quantity || 1
            return (
              <div key={getItemId(item)} className="cart-item" style={{ animationDelay: `${(bundles.length + idx) * 0.05}s` }}>
                <Link to={`/products/${item.product_id || item.productId || ''}`} className="cart-item-image">
                  {img ? <img src={`${IMG_BASE}${img}`} alt="" /> : <span className="cart-item-placeholder">صورة</span>}
                  {qty > 1 && <span className="cart-item-qty-badge">×{formatNumber(qty)}</span>}
                </Link>
                <div className="cart-item-body">
                  <Link to={`/products/${item.product_id || item.productId || ''}`} className="cart-item-name">
                    {getItemName(item)}
                  </Link>
                  {item.shade_name && <span className="cart-item-shade">{item.shade_name}</span>}
                  <div className="cart-item-row">
                    <span className="cart-item-unit-price">{formatPrice(getItemPrice(item))}</span>
                    <div className="cart-item-qty">
                      <button type="button" onClick={() => updateItem(getItemId(item), Math.max(1, qty - 1))}>−</button>
                      <span>{formatNumber(qty)}</span>
                      <button type="button" onClick={() => updateItem(getItemId(item), qty + 1)}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-footer">
                    <span className="cart-item-total">{formatPrice(itemTotal)}</span>
                    <button type="button" className="cart-item-remove" onClick={() => removeItem(getItemId(item))} aria-label="حذف">
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
            <span>المجموع ({formatNumber(totalCount)} عنصر)</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Link to="/checkout" className="cart-checkout-btn">إتمام الطلب</Link>
          <Link to="/explore" className="cart-continue-link">استمري في التسوق</Link>
        </div>
      </div>
      <div className="cart-sticky-bar">
        <div className="cart-sticky-info">
          <span className="cart-sticky-total">{formatPrice(total)}</span>
          <span className="cart-sticky-count">{formatNumber(totalCount)} عنصر</span>
        </div>
        <Link to="/checkout" className="cart-sticky-btn">إتمام الطلب</Link>
      </div>
    </div>
  )
}
