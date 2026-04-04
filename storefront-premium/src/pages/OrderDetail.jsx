import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import './OrderDetail.css'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersAPI.getById(id)
      .then((r) => setOrder(r?.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="premium-order-detail premium-loading">جاري التحميل...</div>
  if (!order) return <div className="premium-order-detail premium-empty">الطلب غير موجود.</div>

  return (
    <div className="premium-order-detail">
      <Link to="/orders" className="premium-order-back">← العودة لطلباتي</Link>
      <div className="premium-order-detail-header">
        <h1>طلب #{order.id}</h1>
        <span className={`premium-order-status premium-status-${order.status}`}>{order.status}</span>
      </div>
      <div className="premium-order-detail-section">
        <h2>العنوان</h2>
        <p>{order.address}, {order.city}</p>
        {order.phone && <p>{order.phone}</p>}
      </div>
      <div className="premium-order-detail-section">
        <h2>المنتجات</h2>
        <div className="premium-order-items">
          {order.items?.map((i) => (
            <div key={i.id} className="premium-order-item">
              <span>{i.product_name}{i.shade_name ? ` (${i.shade_name})` : ''} × {i.quantity}</span>
              <span>{(i.price * i.quantity).toLocaleString('ar-IQ')} د.ع</span>
            </div>
          ))}
        </div>
      </div>
      <div className="premium-order-detail-totals">
        <div><span>التوصيل</span><span>{Number(order.delivery_fee || 0).toLocaleString('ar-IQ')} د.ع</span></div>
        {order.discount > 0 && <div><span>الخصم</span><span>-{Number(order.discount).toLocaleString('ar-IQ')} د.ع</span></div>}
        <div className="premium-order-final"><span>المجموع</span><strong>{Number(order.final_price || 0).toLocaleString('ar-IQ')} د.ع</strong></div>
      </div>
    </div>
  )
}
