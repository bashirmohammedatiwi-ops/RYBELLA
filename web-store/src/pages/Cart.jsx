import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { IMG_BASE } from '../services/api'
import './Cart.css'

export default function Cart() {
  const { items, updateItem, removeItem } = useCart()
  const { user } = useAuth()

  const total = items.reduce((s, i) => s + (Number(i.price || 0) * (Number(i.quantity) || 0)), 0)

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h2>سلة الشراء فارغة</h2>
        <Link to="/explore" className="shop-btn">تسوّق الآن</Link>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h2>سلة الشراء</h2>
      <div className="cart-list">
        {items.map((i) => (
          <div key={i.id || i.variant_id} className="cart-item">
            <div className="cart-item-img">
              {(i.variant_image || i.image) ? (
                <img src={`${IMG_BASE}${i.variant_image || i.image}`} alt="" />
              ) : (
                <div className="img-placeholder">—</div>
              )}
            </div>
            <div className="cart-item-info">
              <strong>{i.product_name || 'منتج'}</strong>
              {i.shade_name && <span>{i.shade_name}</span>}
            </div>
            <input
              type="number"
              min="0"
              value={i.quantity}
              onChange={(e) => {
                const q = Math.max(0, +e.target.value)
                if (q === 0) removeItem(i.id || i.variant_id)
                else updateItem(i.id || i.variant_id, q)
              }}
              className="cart-qty"
            />
            <span className="cart-item-price">
              {i.price ? `${Number(i.price * (i.quantity || 0)).toLocaleString('ar-IQ')} د.ع` : '—'}
            </span>
            <button className="cart-remove" onClick={() => removeItem(i.id || i.variant_id)}>🗑</button>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <span className="cart-total">المجموع: {Number(total).toLocaleString('ar-IQ')} د.ع</span>
        <Link to={user ? '/checkout' : '/login'} className="checkout-btn">إتمام الطلب</Link>
      </div>
      {!user && <p className="cart-login-hint">سجّلي دخولك لإتمام الطلب</p>}
    </div>
  )
}
