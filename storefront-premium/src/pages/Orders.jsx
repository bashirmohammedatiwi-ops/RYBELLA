import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import { formatPrice, formatNumber, formatDate } from '../utils/format'
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

  if (loading) return <div className="premium-orders premium-loading">جاري التحميل...</div>

  return (
    <div className="premium-orders">
      <h1>طلباتي</h1>
      {orders.length === 0 ? (
        <div className="premium-orders-empty">
          <p>لا توجد طلبات.</p>
          <Link to="/explore">تسوق الآن</Link>
        </div>
      ) : (
        <div className="premium-orders-list">
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="premium-order-card">
              <div className="premium-order-head">
                <span>طلب #{formatNumber(o.id)}</span>
                <span className={`premium-order-status premium-status-${o.status}`}>{o.status}</span>
              </div>
              <p>المجموع: {formatPrice(o.final_price || o.total_price || 0)}</p>
              <p className="premium-order-date">{formatDate(o.created_at)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
