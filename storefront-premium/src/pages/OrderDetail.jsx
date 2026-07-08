import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ordersAPI, deliveryZonesAPI, webSettingsAPI } from '../services/api'
import { formatPrice, formatNumber, formatDate } from '../utils/format'
import { getOrderStatusLabel, getOrderStatusClass, normalizeOrderStatus } from '../utils/orderStatus'
import { parseFreeShippingThreshold, computeDeliveryFee } from '../utils/delivery'
import { roundDisplayPrice } from '../utils/pricing'
import { isValidIraqiPhone, normalizeIraqiPhone, IRAQI_PHONE_HINT } from '../utils/phone'
import MobileHeader from '../components/MobileHeader'
import ProvinceSelect from '../components/ProvinceSelect'
import CartQuantityStepper from '../components/CartQuantityStepper'
import './OrderDetail.css'

function mapOrderToForm(o, zones) {
  const zone = zones.find((z) => z.city === o.city)
  return {
    address: o.address || '',
    city: o.city || '',
    phone: o.phone || '',
    notes: o.notes || '',
    zoneFee: zone ? Number(zone.delivery_fee) || 0 : 0,
    items: (o.items || []).map((item) => ({
      id: item.id,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      product_name: item.product_name,
      shade_name: item.shade_name,
    })),
    bundles: (o.bundles || []).map((bundle) => ({
      id: bundle.id,
      quantity: Number(bundle.quantity) || 1,
      baseQty: Number(bundle.quantity) || 1,
      offer_title: bundle.offer_title,
      subtotal: Number(bundle.subtotal) || 0,
      total_price: Number(bundle.total_price) || 0,
      discount_percent: bundle.discount_percent,
    })),
  }
}

function computeEditPreview(order, form, freeShippingThreshold) {
  const itemsSubtotal = form.items
    .filter((item) => item.quantity > 0)
    .reduce((sum, item) => sum + item.price * item.quantity, 0)

  const bundlesSubtotal = form.bundles
    .filter((bundle) => bundle.quantity > 0)
    .reduce((sum, bundle) => {
      const unit = bundle.subtotal / (bundle.baseQty || 1)
      return sum + unit * bundle.quantity
    }, 0)

  const bundlesDiscount = form.bundles
    .filter((bundle) => bundle.quantity > 0)
    .reduce((sum, bundle) => {
      const unit = (bundle.subtotal - bundle.total_price) / (bundle.baseQty || 1)
      return sum + unit * bundle.quantity
    }, 0)

  const total_price = itemsSubtotal + bundlesSubtotal
  const oldItemsSubtotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  )
  const oldBundlesDiscount = (order.bundles || []).reduce(
    (sum, bundle) => sum + (Number(bundle.subtotal) - Number(bundle.total_price)),
    0
  )
  const oldCouponDiscount = Math.max(0, (Number(order.discount) || 0) - oldBundlesDiscount)
  const couponDiscount = oldItemsSubtotal > 0
    ? (roundDisplayPrice(oldCouponDiscount * (itemsSubtotal / oldItemsSubtotal)) ?? 0)
    : 0
  const discount = bundlesDiscount + couponDiscount
  const delivery_fee = computeDeliveryFee(total_price, form.zoneFee, freeShippingThreshold)
  const final_price = roundDisplayPrice(total_price + delivery_fee - discount)
    ?? (total_price + delivery_fee - discount)

  return { total_price, discount, delivery_fee, final_price }
}

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
  const [form, setForm] = useState({
    address: '',
    city: '',
    phone: '',
    notes: '',
    zoneFee: 0,
    items: [],
    bundles: [],
  })

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

  const previewTotals = useMemo(() => {
    if (!order) return null
    if (!editing) {
      return {
        delivery_fee: Number(order.delivery_fee) || 0,
        discount: Number(order.discount) || 0,
        final_price: Number(order.final_price) || 0,
      }
    }
    return computeEditPreview(order, form, freeShippingThreshold)
  }, [order, editing, form, freeShippingThreshold])

  const startEditing = () => {
    if (!order) return
    setForm(mapOrderToForm(order, zones))
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

  const adjustItemQuantity = (itemId, delta) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((item) => {
        if (item.id !== itemId) return item
        const next = Math.max(0, item.quantity + delta)
        return { ...item, quantity: next }
      }),
    }))
    setEditError('')
  }

  const adjustBundleQuantity = (bundleId, delta) => {
    setForm((f) => ({
      ...f,
      bundles: f.bundles.map((bundle) => {
        if (bundle.id !== bundleId) return bundle
        const next = Math.max(0, bundle.quantity + delta)
        return { ...bundle, quantity: next }
      }),
    }))
    setEditError('')
  }

  const handleSave = async () => {
    if (!order) return

    const activeItems = form.items.filter((item) => item.quantity > 0)
    const activeBundles = form.bundles.filter((bundle) => bundle.quantity > 0)
    if (!activeItems.length && !activeBundles.length) {
      setEditError('يجب أن يحتوي الطلب على منتج واحد على الأقل')
      return
    }
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
        items: form.items.map((item) => ({ id: item.id, quantity: item.quantity })),
        bundles: form.bundles.map((bundle) => ({ id: bundle.id, quantity: bundle.quantity })),
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

  const displayItems = editing
    ? form.items.filter((item) => item.quantity > 0)
    : (order.items || [])
  const displayBundles = editing
    ? form.bundles.filter((bundle) => bundle.quantity > 0)
    : (order.bundles || [])

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
            تعديل الطلب
          </button>
        )}

        {order.status === 'cancelled' && order.cancel_reason && (
          <div className="premium-order-cancel-box">
            <strong>سبب الإلغاء</strong>
            <p>{order.cancel_reason}</p>
          </div>
        )}

        {editError && editing && (
          <div className="premium-order-edit-error premium-order-edit-error--top" role="alert">{editError}</div>
        )}

        {(order.bundles || []).length > 0 && (
          <div className="premium-order-detail-section">
            <h2>الباكجات الحصرية</h2>
            {editing ? (
              form.bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  className={`premium-order-bundle premium-order-bundle--edit${bundle.quantity === 0 ? ' is-removed' : ''}`}
                >
                  <div className="premium-order-bundle-head">
                    <strong>{bundle.offer_title}</strong>
                    {bundle.discount_percent > 0 && (
                      <span className="premium-order-bundle-discount">خصم {bundle.discount_percent}%</span>
                    )}
                  </div>
                  <div className="premium-order-edit-qty-row">
                    <span>الكمية</span>
                    <CartQuantityStepper
                      value={bundle.quantity}
                      min={0}
                      onDecrease={() => adjustBundleQuantity(bundle.id, -1)}
                      onIncrease={() => adjustBundleQuantity(bundle.id, 1)}
                    />
                  </div>
                  {bundle.quantity > 0 && (
                    <div className="premium-order-bundle-total">
                      <span>إجمالي الباكج</span>
                      <strong>
                        {formatPrice(
                          (bundle.total_price / (bundle.baseQty || 1)) * bundle.quantity
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              ))
            ) : (
              displayBundles.map((bundle) => (
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
              ))
            )}
          </div>
        )}

        {(order.items || []).length > 0 && (
          <div className="premium-order-detail-section">
            <h2>منتجات منفصلة</h2>
            <div className="premium-order-items">
              {editing ? (
                form.items.map((item) => (
                  <div
                    key={item.id}
                    className={`premium-order-item premium-order-item--edit${item.quantity === 0 ? ' is-removed' : ''}`}
                  >
                    <div className="premium-order-item-info">
                      <span>
                        {item.product_name}
                        {item.shade_name ? ` (${item.shade_name})` : ''}
                      </span>
                      {item.quantity > 0 && (
                        <span className="premium-order-item-line-total">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      )}
                    </div>
                    <CartQuantityStepper
                      value={item.quantity}
                      min={0}
                      onDecrease={() => adjustItemQuantity(item.id, -1)}
                      onIncrease={() => adjustItemQuantity(item.id, 1)}
                    />
                  </div>
                ))
              ) : (
                displayItems.map((item) => (
                  <div key={item.id} className="premium-order-item">
                    <span>
                      {item.product_name}
                      {item.shade_name ? ` (${item.shade_name})` : ''} × {formatNumber(item.quantity)}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="premium-order-detail-section">
          <h2>عنوان التوصيل</h2>
          {editing ? (
            <div className="premium-order-edit-form">
              <ProvinceSelect
                zones={zones}
                value={form.city}
                onChange={handleProvinceChange}
                disabled={!zones.length}
                subtotal={previewTotals?.total_price ?? Number(order.total_price) || 0}
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

        <div className="premium-order-detail-totals">
          <div>
            <span>رسوم التوصيل</span>
            <span>{formatPrice(previewTotals?.delivery_fee ?? order.delivery_fee ?? 0)}</span>
          </div>
          {(previewTotals?.discount ?? order.discount) > 0 && (
            <div>
              <span>الخصم</span>
              <span>-{formatPrice(previewTotals?.discount ?? order.discount)}</span>
            </div>
          )}
          <div className="premium-order-final">
            <span>المجموع الكلي</span>
            <strong>{formatPrice(previewTotals?.final_price ?? order.final_price ?? 0)}</strong>
          </div>
        </div>

        {editing && (
          <div className="premium-order-edit-actions premium-order-edit-actions--footer">
            <button type="button" className="premium-order-edit-save" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button type="button" className="premium-order-edit-cancel" onClick={cancelEditing} disabled={saving}>
              إلغاء
            </button>
          </div>
        )}

        {canEdit && !editing && (
          <p className="premium-order-edit-note">
            يمكنك تعديل المنتجات والكميات وعنوان التوصيل طالما الطلب قيد الانتظار.
          </p>
        )}
      </div>
    </div>
  )
}
