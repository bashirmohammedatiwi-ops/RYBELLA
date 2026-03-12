import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { ordersAPI, deliveryZonesAPI, cartAPI } from '../services/api'
import { useCart } from '../context/CartContext'

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
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>إتمام الطلب</Typography>
      <form onSubmit={handleSubmit}>
        <TextField fullWidth label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} required sx={{ mb: 2 }} />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>المدينة</InputLabel>
          <Select value={city} label="المدينة" onChange={(e) => setCity(e.target.value)} required>
            {zones.map((z) => <MenuItem key={z.city} value={z.city}>{z.city} - {Number(z.delivery_fee).toLocaleString('ar-IQ')} د.ع توصيل</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth label="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>المجموع: {Number(total).toLocaleString('ar-IQ')} د.ع</Typography>
        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
          {loading ? 'جاري...' : 'تأكيد الطلب'}
        </Button>
      </form>
    </Container>
  )
}
