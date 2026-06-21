import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { deliveryZonesAPI, couponsAPI, ordersAPI, webSettingsAPI } from '../services/api'
import { formatPrice, formatNumber } from '../utils/format'
import { roundDisplayPrice } from '../utils/pricing'
import { computeDeliveryFee, parseFreeShippingThreshold, qualifiesForFreeShipping } from '../utils/delivery'
import { isValidIraqiPhone, normalizeIraqiPhone, IRAQI_PHONE_HINT } from '../utils/phone'
import MobileHeader from '../components/MobileHeader'
import ProvinceSelect from '../components/ProvinceSelect'
import './Checkout.css'

export default function Checkout() {
  const { user } = useAuth()
  const { items, bundles, loadCart } = useCart()
  const navigate = useNavigate()
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [zoneDeliveryFee, setZoneDeliveryFee] = useState(0)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50000)
  const [error, setError] = useState('')

  useEffect(() => {
    deliveryZonesAPI.getAll().then((r) => setZones(r?.data || [])).catch(() => []).finally(() => setLoading(false))
    webSettingsAPI.get()
      .then((r) => setFreeShippingThreshold(parseFreeShippingThreshold(r?.data?.free_shipping_threshold)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user?.phone) setPhone(user.phone)
  }, [user?.phone])

  const handleProvinceChange = (provinceName, fee) => {
    setCity(provinceName)
    setZoneDeliveryFee(fee)
    setError('')
  }

  const handlePhoneChange = (e) => {
    setPhone(normalizeIraqiPhone(e.target.value).slice(0, 11))
  }

  const getItemPrice = (item) => roundDisplayPrice(item.price) ?? item.price ?? 0
  const getBundleTotal = (b) => b.total_price ?? (b.unit_price || 0) * (b.quantity || 1)

  const calcSubtotal = (cartItems, cartBundles) => {
    const itemsSum = (cartItems || []).reduce((s, i) => s + getItemPrice(i) * (i.quantity || 0), 0)
    const bundlesSum = (cartBundles || []).reduce((s, b) => s + getBundleTotal(b), 0)
    return itemsSum + bundlesSum
  }

  const handleApplyCoupon = async () => {
    const list = Array.isArray(items) ? items : []
    const bundleList = Array.isArray(bundles) ? bundles : []
    if (!couponCode.trim() || (!list.length && !bundleList.length)) return
    const total = calcSubtotal(list, bundleList)
    try {
      const { data } = await couponsAPI.apply({ code: couponCode.trim(), total_price: total })
      setCouponApplied(data)
      setError('')
    } catch (err) {
      setCouponApplied(null)
      setError(err.response?.data?.message || 'كود غير صالح')
    }
  }

  const handlePlaceOrder = async () => {
    if (!city.trim()) {
      setError('يرجى اختيار المحافظة')
      return
    }
    if (!address.trim()) {
      setError('يرجى إدخال العنوان الكامل')
      return
    }
    const normalizedPhone = normalizeIraqiPhone(phone)
    if (!isValidIraqiPhone(normalizedPhone)) {
      setError(IRAQI_PHONE_HINT)
      return
    }
    const list = Array.isArray(items) ? items : []
    const bundleList = Array.isArray(bundles) ? bundles : []
    if (!list.length && !bundleList.length) {
      setError('سلة التسوق فارغة')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const orderItems = list.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity || 1,
      }))
      const orderBundles = bundleList.map((b) => ({
        offer_id: b.offer_id,
        quantity: b.quantity || 1,
        lines: (b.lines || []).map((l) => ({ variant_id: l.variant_id, quantity: 1 })),
      }))
      await ordersAPI.create({
        items: orderItems,
        bundles: orderBundles,
        address: address.trim(),
        city: city.trim(),
        phone: normalizedPhone,
        notes: notes.trim() || null,
        payment_method: 'cash',
        coupon_code: couponApplied ? couponCode.trim() : null,
      })
      loadCart()
      navigate('/orders')
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تقديم الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="checkout-page checkout-loading">
        <MobileHeader title="إتمام الطلب" showBack showCart={false} />
        <div className="checkout-loading-content">
          <div className="checkout-spinner" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    )
  }

  const list = Array.isArray(items) ? items : []
  const bundleList = Array.isArray(bundles) ? bundles : []
  if (list.length === 0 && bundleList.length === 0) {
    return (
      <div className="checkout-page checkout-empty">
        <MobileHeader title="إتمام الطلب" showBack showCart={false} />
        <div className="checkout-empty-content">
          <div className="checkout-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </div>
          <h2>سلة التسوق فارغة</h2>
          <p>أضيفي منتجات للسلة قبل إتمام الطلب</p>
          <Link to="/cart" className="checkout-empty-btn">العودة للسلة</Link>
        </div>
      </div>
    )
  }

  const subtotal = calcSubtotal(list, bundleList)
  const discount = couponApplied?.discount_amount || 0
  const deliveryFee = computeDeliveryFee(subtotal, zoneDeliveryFee, freeShippingThreshold)
  const hasFreeShipping = city && qualifiesForFreeShipping(subtotal, freeShippingThreshold)
  const finalTotal = subtotal - discount + deliveryFee

  const getItemName = (i) => i.product_name || 'منتج'

  return (
    <div className="checkout-page">
      <MobileHeader title="إتمام الطلب" showBack showCart={false} />

      <div className="checkout-hero">
        <h1 className="checkout-title">إتمام الطلب</h1>
        <p className="checkout-subtitle">خطوة أخيرة لتصلك منتجاتك بأمان</p>
      </div>

      {error && <div className="checkout-error">{error}</div>}

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-card-head">
              <span className="checkout-step">1</span>
              <div>
                <h2>معلومات التوصيل</h2>
                <p>اختر المحافظة ثم أدخل عنوانك</p>
              </div>
            </div>

            <ProvinceSelect
              zones={zones}
              value={city}
              onChange={handleProvinceChange}
              disabled={!zones.length}
              subtotal={subtotal}
              freeShippingThreshold={freeShippingThreshold}
            />

            {!zones.length && (
              <p className="checkout-hint checkout-hint-warn">لا توجد محافظات متاحة للتوصيل حالياً</p>
            )}

            <div className="checkout-field">
              <label htmlFor="checkout-address">العنوان الكامل</label>
              <input
                id="checkout-address"
                placeholder="الحي، الشارع، أقرب نقطة دالة..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="checkout-phone">رقم الهاتف</label>
              <input
                id="checkout-phone"
                type="tel"
                placeholder="07xxxxxxxxx"
                value={phone}
                onChange={handlePhoneChange}
                inputMode="numeric"
                maxLength={11}
                dir="ltr"
                className="checkout-phone-input"
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="checkout-notes">ملاحظات <span className="checkout-optional">(اختياري)</span></label>
              <textarea
                id="checkout-notes"
                placeholder="تعليمات إضافية للتوصيل..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </section>

          <section className="checkout-card checkout-card-coupon">
            <div className="checkout-card-head">
              <span className="checkout-step checkout-step-muted">2</span>
              <div>
                <h2>كود الخصم</h2>
                <p>لديك كوبون؟ أدخليه هنا</p>
              </div>
            </div>
            <div className="checkout-coupon-row">
              <input
                placeholder="أدخلي الكود"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button type="button" onClick={handleApplyCoupon}>تطبيق</button>
            </div>
            {couponApplied && (
              <p className="checkout-coupon-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                تم تطبيق الخصم بنجاح
              </p>
            )}
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-inner">
            <h2>ملخص الطلب</h2>

            {city && (
              <div className="checkout-delivery-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                  <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>التوصيل إلى <strong>{city}</strong></span>
              </div>
            )}

            <div className="checkout-items">
              {bundleList.map((b) => (
                <div key={`bundle-${b.id ?? b.offer_id}`} className="checkout-item checkout-item-bundle">
                  <span className="checkout-item-name">
                    باكج: {b.offer_title || 'حصري'} × {formatNumber(b.quantity || 1)}
                  </span>
                  <span className="checkout-item-price">{formatPrice(getBundleTotal(b))}</span>
                </div>
              ))}
              {list.map((i) => (
                <div key={i.id ?? i.variant_id} className="checkout-item">
                  <span className="checkout-item-name">{getItemName(i)} × {formatNumber(i.quantity || 1)}</span>
                  <span className="checkout-item-price">{formatPrice(getItemPrice(i) * (i.quantity || 1))}</span>
                </div>
              ))}
            </div>

            <div className="checkout-totals">
              <div className="checkout-total-row">
                <span>المجموع الفرعي</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="checkout-total-row checkout-total-discount">
                  <span>الخصم</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="checkout-total-row">
                <span>رسوم التوصيل</span>
                <span>
                  {!city ? '—' : hasFreeShipping ? (
                    <span className="checkout-free-delivery">مجاني</span>
                  ) : formatPrice(deliveryFee)}
                </span>
              </div>
              {hasFreeShipping && (
                <p className="checkout-free-shipping-note">
                  🎉 توصيل مجاني للطلبات {formatPrice(freeShippingThreshold)} فأكثر
                </p>
              )}
              <div className="checkout-total-final">
                <span>المجموع الكلي</span>
                <strong>{formatPrice(finalTotal)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="checkout-submit"
              onClick={handlePlaceOrder}
              disabled={submitting || !zones.length}
            >
              {submitting ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب'}
            </button>

            <p className="checkout-payment-note">الدفع عند الاستلام</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
