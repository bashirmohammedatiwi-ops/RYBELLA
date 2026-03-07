import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material'
import { dashboardAPI } from '../services/api'

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await dashboardAPI.getStats()
        setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
  if (!stats) return null

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>التقارير</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">إجمالي المبيعات</Typography>
              <Typography variant="h5">{Number(stats.total_sales).toLocaleString('ar-IQ')} د.ع</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">إجمالي الطلبات</Typography>
              <Typography variant="h5">{stats.total_orders}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">إجمالي العملاء</Typography>
              <Typography variant="h5">{stats.total_customers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ mb: 2 }}>منتجات منخفضة المخزون</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>المنتج</TableCell>
              <TableCell>الظل</TableCell>
              <TableCell>الكمية</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(stats.low_stock_products || []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.product_name}</TableCell>
                <TableCell>{p.shade_name}</TableCell>
                <TableCell>{p.stock}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" sx={{ mb: 2 }}>الأكثر مبيعاً</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>المنتج</TableCell>
              <TableCell>الظل</TableCell>
              <TableCell>الكمية المباعة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(stats.top_selling_products || []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.product_name}</TableCell>
                <TableCell>{p.shade_name}</TableCell>
                <TableCell>{p.total_sold}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
