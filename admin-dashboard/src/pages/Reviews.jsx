import { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  Rating,
} from '@mui/material'
import { Delete } from '@mui/icons-material'
import { reviewsAPI } from '../services/api'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await reviewsAPI.getAll()
        setReviews(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return
    try {
      await reviewsAPI.delete(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>التقييمات</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>المستخدم</TableCell>
              <TableCell>المنتج</TableCell>
              <TableCell>التقييم</TableCell>
              <TableCell>التعليق</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell align="left">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.user_name}</TableCell>
                <TableCell>{r.product_name}</TableCell>
                <TableCell><Rating value={r.rating} readOnly size="small" /></TableCell>
                <TableCell sx={{ maxWidth: 200 }}>{r.comment || '-'}</TableCell>
                <TableCell>{new Date(r.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                <TableCell align="left">
                  <IconButton color="error" size="small" onClick={() => handleDelete(r.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
