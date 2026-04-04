import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Grid, Typography, CircularProgress } from '@mui/material'
import { productsAPI, categoriesAPI } from '../services/api'
import ProductCard from '../components/ProductCard'

export default function Category() {
  const { id } = useParams()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      productsAPI.getAll({ category_id: id, status: 'published' }),
      categoriesAPI.getAll(),
    ])
      .then(([pRes, cRes]) => {
        setProducts(Array.isArray(pRes?.data) ? pRes.data : [])
        const cat = (cRes?.data || []).find((c) => String(c.id) === String(id))
        setCategory(cat)
      })
      .catch(() => {
        setProducts([])
        setCategory(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        {category?.name || 'المنتجات'}
      </Typography>
      <Grid container spacing={3}>
        {products.map((p) => (
          <Grid item xs={6} sm={4} md={3} key={p.id}>
            <ProductCard product={p} />
          </Grid>
        ))}
      </Grid>
      {products.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
          لا توجد منتجات
        </Typography>
      )}
    </Container>
  )
}
