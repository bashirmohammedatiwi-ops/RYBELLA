import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI, deliveryZonesAPI, webSettingsAPI } from '../services/api'
import { formatPrice, formatNumber, formatDate } from '../utils/format'
import { getOrderStatusLabel, getOrderStatusClass, normalizeOrderStatus } from '../utils/orderStatus'
import { parseFreeShippingThreshold, computeDeliveryFee } from '../utils/delivery'
import { isValidIraqiPhone, normalizeIraqiPhone, IRAQI_PHONE_HINT } from '../utils/phone'
import MobileHeader from '../components/MobileHeader'
import ProvinceSelect from '../components/ProvinceSelect'
import './OrderDetail.css'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [zones, setZones] = useState([])
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50000)
  const [form, setForm] = useState({ address: '', city: '', phone: '', notes: '', zoneFee: 0 })

  const loadOrder = () => {
    setLoading(true)
    return ordersAPI.getById(id)
      .then((r) => setOrder(r?.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrder()
    deliveryZonesAPI.getAll().then((r) => setZones(r?.data || [])).catch(() => [])
    webSettingsAPI.get()
      .then((r) => setFreeShippingThreshold(parseFreeShippingThreshold(r?.data?.free_shipping_threshold)))
      .catch(() => {})
  }, [id])

  const canEdit = order && normalizeOrderStatus(order.status) === 'pending'

  const resetFormFromOrder = (o) => {
    const zone = zones.find((z) => z.city === o.city)
    setForm({
      address: o.address || '',
      city: o.city || '',
      phone: o.phone || '',
      notes: o.notes || '',
      zoneFee: zone ? Number(zone.delivery_fee) || 0 : 0,
    })
  }

  const startEditing = () => {
    if (!order) return
    resetFormFromOrder(order)
    setEditError('')
    setEditSuccess('')
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditError('')
  }

  const handleProvinceChange = (city, fee) => {
    setForm((f) => ({ ...f, city, zoneFee: fee }))
    setEditError('')
  }

  const handleSave = async () => {
    if (!order) return
    if (!form.city.trim()) {
      setEditError('يرجى اختيار المحافظة')
      return
    }
    if (!form.address.trim()) {
      setEditError('يرجى إدخال العنوان الكامل')
      return
    }
    const normalizedPhone = normalizeIraqiPhone(form.phone)
    if (!isValidIraqiPhone(normalizedPhone)) {
      setEditError(IRAQI_PHONE_HINT)
      return
    }

    setSaving(true)
    setEditError('')
    setEditSuccess('')
    try {
      const res = await ordersAPI.update(order.id, {
        address: form.address.trim(),
        city: form.city.trim(),
        phone: normalizedPhone,
        notes: form.notes.trim(),
      })
      const updated = res?.data?.order || res?.data
      if (updated?.id) setOrder(updated)
      else await loadOrder()
      setEditing(false)
      setEditSuccess(res?.data?.message || 'تم تحديث الطلب بنجاح')
    } catch (err) {
      setEditError(err.response?.data?.message || 'فشل تحديث الطلب')
    } finally {
      setSaving(false)
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

  const previewDeliveryFee = computeDeliveryFee(
    Number(order.total_price) || 0,
    form.zoneFee,
    freeShippingThreshold,
  )
  const previewFinal = (Number(order.total_price) || 0) - (Number(order.discount) || 0) + previewDeliveryFee

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

        {editSuccess && (
          <div className="premium-order-edit-success" role="status">{editSuccess}</div>
        )}

        {canEdit && !editing && (
          <button type="button" className="premium-order-edit-btn" onClick={startEditing}>
            تعديل بيانات التوصيل
          </button>
        )}

        {order.status === 'cancelled' && order.cancel_reason && (
          <div className="premium-order-cancel-box">
            <strong>سبب الإلغاء</strong>
            <p>{order.cancel_reason}</p>
          </div>
        )}

        <div className="premium-order-detail-section">
          <h2>عنوان التوصيل</h2>
          {editing ? (
            <div className="premium-order-edit-form">
              {editError && <div className="premium-order-edit-error" role="alert">{editError}</div>}
              <ProvinceSelect
                zones={zones}
                value={form.city}
                onChange={handleProvinceChange}
                disabled={!zones.length}
                subtotal={Number(order.total_price) || 0}
                freeShippingThreshold={freeShippingThreshold}
              />
              <label className="premium-order-edit-label" htmlFor="order-edit-address">العنوان الكامل</label>
              <input
                id="order-edit-address"
                className="premium-order-edit-input"
                value={form.address}
                onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setEditError('') }}
                placeholder="الحي، الشارع، أقرب نقطة دالة..."
              />
              <label className="premium-order-edit-label" htmlFor="order-edit-phone">رقم الهاتف</label>
              <input
                id="order-edit-phone"
                className="premium-order-edit-input premium-order-edit-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => { setForm((f) => ({ ...f, phone: normalizeIraqiPhone(e.target.value).slice(0, 11) })); setEditError('') }}
                placeholder="07xxxxxxxxx"
                dir="ltr"
                inputMode="numeric"
                maxLength={11}
              />
              <label className="premium-order-edit-label" htmlFor="order-edit-notes">ملاحظات <span>(اختياري)</span></label>
              <textarea
                id="order-edit-notes"
                className="premium-order-edit-textarea"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="تعليمات إضافية للتوصيل..."
              />
              {form.city && (
                <p className="premium-order-edit-hint">
                  رسوم التوصيل بعد التعديل:{' '}
                  <strong>{previewDeliveryFee === 0 ? 'مجاني' : formatPrice(previewDeliveryFee)}</strong>
                  {' — '}
                  المجموع الكلي: <strong>{formatPrice(previewFinal)}</strong>
                </p>
              )}
              <div className="premium-order-edit-actions">
                <button type="button" className="premium-order-edit-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button type="button" className="premium-order-edit-cancel" onClick={cancelEditing} disabled={saving}>
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>{order.address}</p>
              <p>{order.city}</p>
              {order.phone && <p className="premium-order-phone" dir="ltr">{order.phone}</p>}
              {order.notes && <p className="premium-order-notes">{order.notes}</p>}
            </>
          )}
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

        {canEdit && (
          <p className="premium-order-edit-note">
            يمكنك تعديل عنوان التوصيل ورقم الهاتف والملاحظات طالما الطلب قيد الانتظار.
          </p>
        )}
      </div>
    </div>
  )
}
