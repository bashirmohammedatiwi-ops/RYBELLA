import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import { formatPrice, formatNumber, formatDate } from '../utils/format'
import { getOrderStatusLabel, getOrderStatusClass } from '../utils/orderStatus'
import MobileHeader from '../components/MobileHeader'
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

  if (loading) {
    return (
      <div className="premium-order-detail premium-order-detail-loading">
        <MobileHeader title="تفاصيل الطلب" showBack showCart={false} />
        <div className="premium-order-detail-loading-inner">جاري التحميل...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="premium-order-detail premium-order-detail-empty">
        <MobileHeader title="تفاصيل الطلب" showBack showCart={false} />
        <p>الطلب غير موجود.</p>
        <Link to="/orders">العودة لطلباتي</Link>
      </div>
    )
  }

  return (
    <div className="premium-order-detail">
      <MobileHeader title={`طلب #${formatNumber(order.id)}`} showBack showCart={false} />

      <div className="premium-order-detail-body">
        <div className="premium-order-detail-header">
          <div>
            <p className="premium-order-detail-date">{formatDate(order.created_at)}</p>
            <h1>طلب #{formatNumber(order.id)}</h1>
          </div>
          <span className={`premium-order-status ${getOrderStatusClass(order.status)}`}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        {order.status === 'cancelled' && order.cancel_reason && (
          <div className="premium-order-cancel-box">
            <strong>سبب الإلغاء</strong>
            <p>{order.cancel_reason}</p>
          </div>
        )}

        <div className="premium-order-detail-section">
          <h2>عنوان التوصيل</h2>
          <p>{order.address}</p>
          <p>{order.city}</p>
          {order.phone && <p className="premium-order-phone" dir="ltr">{order.phone}</p>}
        </div>

        {(order.bundles || []).length > 0 && (
        <div className="premium-order-detail-section">
          <h2>الباكجات الحصرية</h2>
          {(order.bundles || []).map((bundle) => (
            <div key={bundle.id} className="premium-order-bundle">
              <div className="premium-order-bundle-head">
                <strong>{bundle.offer_title}</strong>
                <span>× {formatNumber(bundle.quantity)}</span>
                {bundle.discount_percent > 0 && <span className="premium-order-bundle-discount">خصم {bundle.discount_percent}%</span>}
              </div>
              <ul className="premium-order-bundle-lines">
                {(bundle.items || []).map((line) => (
                  <li key={line.id}>
                    <span>{line.product_name}{line.shade_name ? ` (${line.shade_name})` : ''}</span>
                    <span>{formatPrice(line.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="premium-order-bundle-total">
                <span>إجمالي الباكج</span>
                <strong>{formatPrice(bundle.total_price)}</strong>
              </div>
            </div>
          ))}
        </div>
        )}

        {(order.items || []).length > 0 && (
        <div className="premium-order-detail-section">
          <h2>منتجات منفصلة</h2>
          <div className="premium-order-items">
            {order.items?.map((i) => (
              <div key={i.id} className="premium-order-item">
                <span>{i.product_name}{i.shade_name ? ` (${i.shade_name})` : ''} × {formatNumber(i.quantity)}</span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
        )}

        <div className="premium-order-detail-totals">
          <div><span>رسوم التوصيل</span><span>{formatPrice(order.delivery_fee || 0)}</span></div>
          {order.discount > 0 && <div><span>الخصم</span><span>-{formatPrice(order.discount)}</span></div>}
          <div className="premium-order-final"><span>المجموع الكلي</span><strong>{formatPrice(order.final_price || 0)}</strong></div>
        </div>
      </div>
    </div>
  )
}
