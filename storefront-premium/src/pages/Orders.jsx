import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
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
                <span>طلب #{o.id}</span>
                <span className={`premium-order-status premium-status-${o.status}`}>{o.status}</span>
              </div>
              <p>المجموع: {Number(o.final_price || o.total_price || 0).toLocaleString('ar-IQ')} د.ع</p>
              <p className="premium-order-date">{new Date(o.created_at).toLocaleDateString('ar-IQ')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
