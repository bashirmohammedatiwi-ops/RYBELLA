import { Link } from 'react-router-dom'
import { Card, CardMedia, CardContent, Typography, Box } from '@mui/material'
import { FavoriteBorder as WishIcon } from '@mui/icons-material'
import { IMG_BASE } from '../services/api'

export default function ProductCard({ product }) {
  const thumb = product.main_image || product.images?.[0]
  const minPrice = product.min_price ?? product.variants?.[0]?.price

  return (
    <Card
      component={Link}
      to={`/products/${product.id}`}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ position: 'relative', pt: '100%' }}>
        <CardMedia
          component="img"
          image={thumb ? `${IMG_BASE}${thumb}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23eee" width="200" height="200"/%3E%3C/svg%3E'}
          alt={product.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'white',
            borderRadius: 2,
            p: 0.5,
          }}
        >
          <WishIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Box>
      </Box>
      <CardContent sx={{ flex: 1, p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }} noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={700}>
          {minPrice ? `${Number(minPrice).toLocaleString('ar-IQ')} د.ع` : '—'}
        </Typography>
      </CardContent>
    </Card>
  )
}
