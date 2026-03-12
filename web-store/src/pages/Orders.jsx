import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import './Orders.css'

const statusLabels = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersAPI.getAll()
      .then((r) => setOrders(Array.isArray(r?.data) ? r.data : []))
      .catch(() => [])
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="orders-page">
      <h2>طلباتي</h2>
      {loading && <p className="loading">جاري التحميل...</p>}
      {!loading && orders.length === 0 && <p className="empty-msg">لا توجد طلبات</p>}
      {!loading && orders.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="order-card">
          <div className="order-header">
            <strong>طلب #{o.id}</strong>
            <span className={`order-status status-${o.status}`}>{statusLabels[o.status] || o.status}</span>
          </div>
          <p>{o.address} - {o.city}</p>
          <p className="order-total">المجموع: {Number(o.final_price).toLocaleString('ar-IQ')} د.ع</p>
        </Link>
      ))}
    </div>
  )
}
