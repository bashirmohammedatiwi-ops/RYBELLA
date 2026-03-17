import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { IMG_BASE } from '../services/api'
import FreeShippingBar from '../components/FreeShippingBar'
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
    return <div className="premium-cart premium-loading">جاري التحميل...</div>
  }

  if (items.length === 0) {
    return (
      <div className="premium-cart premium-cart-empty">
        <h2>سلة التسوق فارغة</h2>
        <p>{user ? 'أضفي منتجاتك المفضلة وابدئي التسوق' : 'سجّلي الدخول لعرض السلة أو تصفّحي وأضيفي منتجات'}</p>
        <Link to="/" className="premium-cart-shop-btn">تسوق الآن</Link>
        {!user && <Link to="/login" className="premium-cart-login-btn">تسجيل الدخول</Link>}
      </div>
    )
  }

  return (
    <div className="premium-cart">
      <div className="premium-cart-header">
        <h1>السلة</h1>
        {!user && (
          <Link to="/login" className="premium-cart-guest-banner">سجّلي الدخول لإتمام الطلب</Link>
        )}
      </div>
      <FreeShippingBar subtotal={total} />
      <div className="premium-cart-list">
        {items.map((item) => {
          const img = getItemImage(item)
          return (
            <div key={getItemId(item)} className="premium-cart-item">
              <Link to={`/products/${item.product_id || item.productId || ''}`} className="premium-cart-item-img">
                {img ? <img src={`${IMG_BASE}${img}`} alt="" /> : <span className="premium-cart-placeholder">صورة</span>}
              </Link>
              <div className="premium-cart-item-info">
                <Link to={`/products/${item.product_id || item.productId || ''}`} className="premium-cart-item-name">
                  {getItemName(item)}
                  {item.shade_name && <span className="premium-cart-shade"> — {item.shade_name}</span>}
                </Link>
                <p className="premium-cart-item-price">{getItemPrice(item).toLocaleString('ar-IQ')} د.ع</p>
                <div className="premium-cart-item-qty">
                  <button onClick={() => updateItem(getItemId(item), Math.max(1, (item.quantity || 0) - 1))}>−</button>
                  <span>{item.quantity || 1}</span>
                  <button onClick={() => updateItem(getItemId(item), (item.quantity || 0) + 1)}>+</button>
                </div>
              </div>
              <div className="premium-cart-item-right">
                <span className="premium-cart-item-total">
                  {((getItemPrice(item) * (item.quantity || 0))).toLocaleString('ar-IQ')} د.ع
                </span>
                <button className="premium-cart-remove" onClick={() => removeItem(getItemId(item))}>حذف</button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="premium-cart-footer">
        <div className="premium-cart-total">
          <span>المجموع</span>
          <strong>{total.toLocaleString('ar-IQ')} د.ع</strong>
        </div>
        <Link to="/checkout" className="premium-cart-checkout-btn">إتمام الطلب</Link>
      </div>
    </div>
  )
}
