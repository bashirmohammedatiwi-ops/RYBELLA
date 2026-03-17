import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { deliveryZonesAPI, couponsAPI, ordersAPI, IMG_BASE } from '../services/api'
import './Checkout.css'

export default function Checkout() {
  const { items, loadCart } = useCart()
  const navigate = useNavigate()
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    deliveryZonesAPI.getAll().then((r) => setZones(r?.data || [])).catch(() => []).finally(() => setLoading(false))
  }, [])

  const handleApplyCoupon = async () => {
    const list = Array.isArray(items) ? items : []
    if (!couponCode.trim() || !list.length) return
    const total = list.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0)
    try {
      const { data } = await couponsAPI.apply({ code: couponCode.trim(), total_price: total })
      setCouponApplied(data)
      setError('')
    } catch (err) {
      setCouponApplied(null)
      setError(err.response?.data?.message || 'كود غير صالح')
    }
  }

  const handleCityChange = (c) => {
    setCity(c)
    const zone = zones.find((z) => z.city === c)
    setDeliveryFee(zone ? Number(zone.delivery_fee) : 0)
  }

  const handlePlaceOrder = async () => {
    if (!address.trim() || !city.trim() || !phone.trim()) {
      setError('يرجى إدخال العنوان والمدينة ورقم الهاتف')
      return
    }
    const list = Array.isArray(items) ? items : []
    if (!list.length) {
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
      await ordersAPI.create({
        items: orderItems,
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
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

  if (loading) return <div className="premium-checkout premium-loading">جاري التحميل...</div>

  const list = Array.isArray(items) ? items : []
  if (list.length === 0) {
    return (
      <div className="premium-checkout premium-checkout-empty">
        <h2>سلة التسوق فارغة</h2>
        <Link to="/cart">العودة للسلة</Link>
      </div>
    )
  }

  const subtotal = list.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0)
  const discount = couponApplied?.discount_amount || 0
  const finalTotal = subtotal - discount + deliveryFee

  const getItemName = (i) => i.product_name || 'منتج'
  const getItemPrice = (i) => i.price ?? 0

  return (
    <div className="premium-checkout">
      <h1>إتمام الطلب</h1>
      {error && <div className="premium-checkout-error">{error}</div>}
      <div className="premium-checkout-grid">
        <div className="premium-checkout-form">
          <section className="premium-checkout-section">
            <h2>عنوان التوصيل</h2>
            <input placeholder="العنوان الكامل" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input
              placeholder="المدينة"
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              list="cities"
            />
            <datalist id="cities">
              {zones.map((z) => <option key={z.id} value={z.city} />)}
            </datalist>
            <input placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </section>
          <section className="premium-checkout-section">
            <h2>كود الخصم</h2>
            <div className="premium-coupon-row">
              <input placeholder="أدخلي الكود" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <button type="button" onClick={handleApplyCoupon}>تطبيق</button>
            </div>
            {couponApplied && <p className="premium-coupon-success">تم تطبيق الخصم</p>}
          </section>
        </div>
        <div className="premium-checkout-summary">
          <h2>ملخص الطلب</h2>
          <div className="premium-checkout-items">
            {list.map((i) => (
              <div key={i.id ?? i.variant_id} className="premium-checkout-item">
                <span>{getItemName(i)} × {i.quantity || 1}</span>
                <span>{(getItemPrice(i) * (i.quantity || 1)).toLocaleString('ar-IQ')} د.ع</span>
              </div>
            ))}
          </div>
          <div className="premium-checkout-totals">
            <div><span>المجموع الفرعي</span><span>{subtotal.toLocaleString('ar-IQ')} د.ع</span></div>
            {discount > 0 && <div><span>الخصم</span><span>-{discount.toLocaleString('ar-IQ')} د.ع</span></div>}
            {deliveryFee > 0 && <div><span>التوصيل</span><span>{deliveryFee.toLocaleString('ar-IQ')} د.ع</span></div>}
            <div className="premium-checkout-final"><span>المجموع</span><strong>{finalTotal.toLocaleString('ar-IQ')} د.ع</strong></div>
          </div>
          <button className="premium-checkout-submit" onClick={handlePlaceOrder} disabled={submitting}>
            {submitting ? 'جاري الطلب...' : 'تأكيد الطلب'}
          </button>
        </div>
      </div>
    </div>
  )
}
