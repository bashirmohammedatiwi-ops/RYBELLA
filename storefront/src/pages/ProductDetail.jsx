import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material'
import { productsAPI, IMG_BASE } from '../services/api'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    productsAPI.getById(id)
      .then((r) => {
        const p = r?.data
        setProduct(p)
        if (p?.variants?.[0]) setVariantId(String(p.variants[0].id))
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!variantId) return
    const v = product?.variants?.find((x) => String(x.id) === String(variantId))
    if (!v) return
    try {
      await addItem(Number(variantId), qty, {
        product_id: product.id,
        product_name: product.name,
        shade_name: v.shade_name,
        price: v.price,
        image: v.image || product.main_image,
      })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      alert(e.response?.data?.message || 'فشل الإضافة')
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  if (!product) return <Typography sx={{ py: 8, textAlign: 'center' }}>المنتج غير موجود</Typography>

  const thumb = product.main_image || product.images?.[0]
  const v = product?.variants?.find((x) => String(x.id) === String(variantId))

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'grey.100',
              aspectRatio: '1',
            }}
          >
            {thumb && (
              <Box
                component="img"
                src={`${IMG_BASE}${thumb}`}
                alt={product.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{product.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{product.brand_name}</Typography>
          {product.is_featured && <Chip label="مميز" size="small" color="secondary" sx={{ mr: 0.5 }} />}
          {product.is_best_seller && <Chip label="أكثر مبيعاً" size="small" color="success" sx={{ mr: 0.5 }} />}
          <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ mt: 2 }}>
            {v?.price ? `${Number(v.price).toLocaleString('ar-IQ')} د.ع` : '—'}
          </Typography>
          {product.description && (
            <Typography variant="body2" sx={{ mt: 2 }}>{product.description}</Typography>
          )}
          {product.variants?.length > 1 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>اختاري اللون / الظل</InputLabel>
              <Select value={variantId} label="اختاري اللون / الظل" onChange={(e) => setVariantId(e.target.value)}>
                {product.variants.map((x) => (
                  <MenuItem key={x.id} value={String(x.id)}>
                    {x.shade_name} {x.color_code && <Box component="span" sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: x.color_code, display: 'inline-block', ml: 1, verticalAlign: 'middle' }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <TextField type="number" label="الكمية" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} inputProps={{ min: 1 }} sx={{ width: 100 }} />
            <Button variant="contained" size="large" onClick={handleAddToCart} disabled={added}>
              {added ? 'تمت الإضافة ✓' : 'أضف للسلة'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}
