import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import { useCart } from '../context/CartContext'
import { formatPrice, formatNumber, formatDate } from '../utils/format'
import { getOrderStatusLabel, getOrderStatusClass, normalizeOrderStatus } from '../utils/orderStatus'
import MobileHeader from '../components/MobileHeader'
import './OrderDetail.css'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { startOrderEdit } = useCart()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    setLoading(true)
    ordersAPI.getById(id)
      .then((r) => setOrder(r?.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  const canEdit = order && normalizeOrderStatus(order.status) === 'pending'

  const handleEditViaCart = async () => {
    if (!order) return
    setEditLoading(true)
    setEditError('')
    try {
      await startOrderEdit(order.id)
      navigate('/cart')
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'تعذّر إعادة الطلب إلى السلة')
    } finally {
      setEditLoading(false)
    }
  }

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

  const displayItems = order.items || []
  const displayBundles = order.bundles || []

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

        {editError && (
          <div className="premium-order-edit-error premium-order-edit-error--top" role="alert">{editError}</div>
        )}

        {canEdit && (
          <button
            type="button"
            className="premium-order-edit-btn"
            onClick={handleEditViaCart}
            disabled={editLoading}
          >
            {editLoading ? 'جاري التحميل إلى السلة...' : 'تعديل الطلب عبر السلة'}
          </button>
        )}

        {order.status === 'cancelled' && order.cancel_reason && (
          <div className="premium-order-cancel-box">
            <strong>سبب الإلغاء</strong>
            <p>{order.cancel_reason}</p>
          </div>
        )}

        {displayBundles.length > 0 && (
          <div className="premium-order-detail-section">
            <h2>الباكجات الحصرية</h2>
            {displayBundles.map((bundle) => (
              <div key={bundle.id} className="premium-order-bundle">
                <div className="premium-order-bundle-head">
                  <strong>{bundle.offer_title}</strong>
                  <span>× {formatNumber(bundle.quantity)}</span>
                  {bundle.discount_percent > 0 && (
                    <span className="premium-order-bundle-discount">خصم {bundle.discount_percent}%</span>
                  )}
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

        {displayItems.length > 0 && (
          <div className="premium-order-detail-section">
            <h2>منتجات منفصلة</h2>
            <div className="premium-order-items">
              {displayItems.map((item) => (
                <div key={item.id} className="premium-order-item">
                  <span>
                    {item.product_name}
                    {item.shade_name ? ` (${item.shade_name})` : ''} × {formatNumber(item.quantity)}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="premium-order-detail-section">
          <h2>عنوان التوصيل</h2>
          <p>{order.address}</p>
          <p>{order.city}</p>
          {order.phone && <p className="premium-order-phone" dir="ltr">{order.phone}</p>}
          {order.notes && <p className="premium-order-notes">{order.notes}</p>}
        </div>

        <div className="premium-order-detail-totals">
          <div>
            <span>رسوم التوصيل</span>
            <span>{formatPrice(order.delivery_fee ?? 0)}</span>
          </div>
          {order.discount > 0 && (
            <div>
              <span>الخصم</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="premium-order-final">
            <span>المجموع الكلي</span>
            <strong>{formatPrice(order.final_price ?? 0)}</strong>
          </div>
        </div>

        {canEdit && (
          <p className="premium-order-edit-note">
            يمكنك تعديل الطلب عبر السلة طالما حالته قيد الانتظار. ستُحمَّل المنتجات في السلة لتعديلها ثم إعادة تأكيد الطلب.
          </p>
        )}
      </div>
    </div>
  )
}
