import { useState, useEffect } from 'react'
import { Container, Typography, Box, Chip } from '@mui/material'
import { ordersAPI } from '../services/api'

const statusLabels = { pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' }

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersAPI.getAll().then((r) => setOrders(Array.isArray(r?.data) ? r.data : [])).catch(() => []).finally(() => setLoading(false))
  }, [])

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>طلباتي</Typography>
      {loading && <Typography>جاري التحميل...</Typography>}
      {!loading && orders.length === 0 && <Typography color="text.secondary">لا توجد طلبات</Typography>}
      {!loading && orders.map((o) => (
        <Box key={o.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography fontWeight={600}>طلب #{o.id}</Typography>
            <Chip label={statusLabels[o.status] || o.status} size="small" color="primary" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">{o.address} - {o.city}</Typography>
          <Typography variant="body2">المجموع: {Number(o.final_price).toLocaleString('ar-IQ')} د.ع</Typography>
        </Box>
      ))}
    </Container>
  )
}
