import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Container, Typography, TextField, InputAdornment, Grid, Button } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { productsAPI, categoriesAPI, bannersAPI, IMG_BASE } from '../services/api'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [banners, setBanners] = useState([])
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(Array.isArray(r?.data) ? r.data : [])).catch(() => [])
    bannersAPI.getAll().then((r) => setBanners(Array.isArray(r?.data) ? r.data : [])).catch(() => [])
    productsAPI.getAll({ featured: '1', status: 'published' }).then((r) => setFeatured(Array.isArray(r?.data) ? r.data.slice(0, 8) : [])).catch(() => [])
  }, [])

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero */}
      <Box
        sx={{
          py: 8,
          px: 3,
          background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
          borderRadius: 4,
          mx: 2,
          mt: 3,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>
            تجميلك يبدأ هنا
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            اكتشفي تشكيلة واسعة من مستحضرات التجميل الأصلية
          </Typography>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); navigate(search ? `/products?search=${encodeURIComponent(search)}` : '/products'); }}>
          <TextField
            fullWidth
            placeholder="ابحثي عن منتجات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              maxWidth: 480,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" sx={{ mt: 2, display: 'block' }}>بحث</Button>
          </Box>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          تصفح الفئات
        </Typography>
        <Grid container spacing={2}>
          {categories.slice(0, 6).map((c) => (
            <Grid item xs={6} sm={4} md={2} key={c.id}>
              <Link to={`/category/${c.id}`} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'primary.light', color: 'white', borderColor: 'primary.main' },
                  }}
                >
                  {c.image && (
                    <Box
                      component="img"
                      src={`${IMG_BASE}${c.image}`}
                      alt=""
                      sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 2, mb: 1 }}
                    />
                  )}
                  <Typography variant="body2" fontWeight={600}>
                    {c.name}
                  </Typography>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Banners */}
      {banners.length > 0 && (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <Grid container spacing={2}>
            {banners.slice(0, 2).map((b) => (
              <Grid item xs={12} md={6} key={b.id}>
                <Box
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    height: 160,
                    bgcolor: 'grey.200',
                  }}
                >
                  {b.image && (
                    <Box
                      component="img"
                      src={`${IMG_BASE}${b.image}`}
                      alt={b.title}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Featured */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            المنتجات المميزة
          </Typography>
          <Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              عرض الكل
            </Typography>
          </Link>
        </Box>
        <Grid container spacing={3}>
          {(featured.length > 0 ? featured : []).map((p) => (
            <Grid item xs={6} sm={4} md={3} key={p.id}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
