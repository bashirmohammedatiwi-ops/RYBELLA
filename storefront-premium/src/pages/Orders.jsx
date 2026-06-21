import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import { formatPrice, formatNumber, formatDate } from '../utils/format'
import { getOrderStatusLabel, getOrderStatusClass } from '../utils/orderStatus'
import MobileHeader from '../components/MobileHeader'
import './Orders.css'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersAPI.getAll()
      .then((r) => setOrders(r?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="premium-orders premium-orders-loading">
        <MobileHeader title="طلباتي" showBack showCart={false} />
        <div className="premium-orders-loading-inner">
          <div className="premium-orders-spinner" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-orders">
      <MobileHeader title="طلباتي" showBack showCart={false} />
      <div className="premium-orders-body">
        <h1 className="premium-orders-title">طلباتي</h1>
        {orders.length === 0 ? (
          <div className="premium-orders-empty">
            <p>لا توجد طلبات بعد.</p>
            <Link to="/explore" className="premium-orders-shop-btn">تسوق الآن</Link>
          </div>
        ) : (
          <div className="premium-orders-list">
            {orders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="premium-order-card">
                <div className="premium-order-head">
                  <span className="premium-order-id">طلب #{formatNumber(o.id)}</span>
                  <span className={`premium-order-status ${getOrderStatusClass(o.status)}`}>
                    {getOrderStatusLabel(o.status)}
                  </span>
                </div>
                <p className="premium-order-total">المجموع: {formatPrice(o.final_price || o.total_price || 0)}</p>
                {o.status === 'cancelled' && o.cancel_reason && (
                  <p className="premium-order-cancel-hint">سبب الإلغاء: {o.cancel_reason}</p>
                )}
                <p className="premium-order-date">{formatDate(o.created_at)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
