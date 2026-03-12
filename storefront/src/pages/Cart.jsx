import { Link } from 'react-router-dom'
import { Container, Box, Typography, Button, IconButton, TextField } from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { IMG_BASE } from '../services/api'

export default function Cart() {
  const { items, updateItem, removeItem } = useCart()
  const { user } = useAuth()

  const total = items.reduce((s, i) => s + (Number(i.price || 0) * (Number(i.quantity) || 0)), 0)

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 3 }}>سلة الشراء فارغة</Typography>
        <Box sx={{ textAlign: 'center' }}>
          <Button component={Link} to="/products" variant="contained">تسوّق الآن</Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>سلة الشراء</Typography>
      {items.map((i) => (
        <Box
          key={i.variant_id || i.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            mb: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box
            component="img"
            src={i.variant_image || i.image ? `${IMG_BASE}${i.variant_image || i.image}` : undefined}
            alt=""
            sx={{ width: 72, height: 72, borderRadius: 2, objectFit: 'cover', bgcolor: 'grey.200' }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>{i.product_name || 'منتج'}</Typography>
            <Typography variant="body2" color="text.secondary">{i.shade_name}</Typography>
          </Box>
          <TextField
            type="number"
            size="small"
            value={i.quantity}
            onChange={(e) => {
              const q = Math.max(0, +e.target.value)
              if (q === 0) removeItem(i.id || i.variant_id)
              else updateItem(i.id || i.variant_id, q)
            }}
            inputProps={{ min: 0 }}
            sx={{ width: 70 }}
          />
          <Typography fontWeight={600}>
            {i.price ? `${Number(i.price * (i.quantity || 0)).toLocaleString('ar-IQ')} د.ع` : '—'}
          </Typography>
          <IconButton size="small" color="error" onClick={() => removeItem(i.id || i.variant_id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6">المجموع: {Number(total).toLocaleString('ar-IQ')} د.ع</Typography>
        <Button component={Link} to={user ? '/checkout' : '/login'} variant="contained" size="large">
          إتمام الطلب
        </Button>
      </Box>
      {!user && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          سجّلي دخولك لإتمام الطلب
        </Typography>
      )}
    </Container>
  )
}
