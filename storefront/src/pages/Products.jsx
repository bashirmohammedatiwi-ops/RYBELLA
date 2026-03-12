import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Container, Grid, Typography, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { productsAPI, categoriesAPI, brandsAPI } from '../services/api'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '')
  const [brandId, setBrandId] = useState('')

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => [])
    brandsAPI.getAll().then((r) => setBrands(r?.data || [])).catch(() => [])
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { status: 'published' }
    if (search) params.search = search
    if (categoryId) params.category_id = categoryId
    if (brandId) params.brand_id = brandId
    productsAPI.getAll(params)
      .then((r) => setProducts(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [search, categoryId, brandId])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        المنتجات
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>الفئة</InputLabel>
            <Select value={categoryId} label="الفئة" onChange={(e) => setCategoryId(e.target.value)}>
              <MenuItem value="">الكل</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>البراند</InputLabel>
            <Select value={brandId} label="البراند" onChange={(e) => setBrandId(e.target.value)}>
              <MenuItem value="">الكل</MenuItem>
              {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {products.map((p) => (
            <Grid item xs={6} sm={4} md={3} key={p.id}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      )}
      {!loading && products.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
          لا توجد منتجات
        </Typography>
      )}
    </Container>
  )
}
