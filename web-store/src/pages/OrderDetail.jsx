import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import './OrderDetail.css'

const statusLabels = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ordersAPI.getById(id)
      .then((r) => setOrder(r?.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="loading">جاري التحميل...</p>
  if (!order) return <p className="empty-msg">الطلب غير موجود</p>

  return (
    <div className="order-detail-page">
      <Link to="/orders" className="back-link">← طلباتي</Link>
      <h2>طلب #{order.id}</h2>
      <div className="order-detail-card">
        <p><strong>الحالة:</strong> <span className={`status status-${order.status}`}>{statusLabels[order.status] || order.status}</span></p>
        <p><strong>العنوان:</strong> {order.address} - {order.city}</p>
        {order.phone && <p><strong>الهاتف:</strong> {order.phone}</p>}
        <p><strong>المجموع:</strong> {Number(order.final_price).toLocaleString('ar-IQ')} د.ع</p>
      </div>
      {order.items?.length > 0 && (
        <div className="order-items">
          <h3>العناصر</h3>
          {order.items.map((i) => (
            <div key={i.id} className="order-item">
              <span>{i.product_name} - {i.shade_name}</span>
              <span>× {i.quantity}</span>
              <span>{Number(i.price * i.quantity).toLocaleString('ar-IQ')} د.ع</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
