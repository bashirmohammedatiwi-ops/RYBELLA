import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersAPI, deliveryZonesAPI } from '../services/api'
import { useCart } from '../context/CartContext'
import './Checkout.css'

export default function Checkout() {
  const [zones, setZones] = useState([])
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const { items, loadCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    deliveryZonesAPI.getAll().then((r) => setZones(r?.data || [])).catch(() => [])
  }, [])

  const total = items.reduce((s, i) => s + (Number(i.price || 0) * (Number(i.quantity) || 0)), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!address || !city) return
    setLoading(true)
    try {
      const orderItems = items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity || 1 }))
      await ordersAPI.create({ items: orderItems, address, city, phone: phone || undefined, payment_method: 'cash' })
      await loadCart()
      navigate('/orders')
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إنشاء الطلب')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="checkout-page">
      <h2>إتمام الطلب</h2>
      <form onSubmit={handleSubmit} className="checkout-form">
        <input
          placeholder="العنوان *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <select value={city} onChange={(e) => setCity(e.target.value)} required>
          <option value="">اختر المدينة *</option>
          {zones.map((z) => (
            <option key={z.city} value={z.city}>
              {z.city} - {Number(z.delivery_fee || 0).toLocaleString('ar-IQ')} د.ع توصيل
            </option>
          ))}
        </select>
        <input placeholder="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="checkout-total">المجموع: {Number(total).toLocaleString('ar-IQ')} د.ع</p>
        <button type="submit" disabled={loading}>{loading ? 'جاري...' : 'تأكيد الطلب'}</button>
      </form>
    </div>
  )
}
