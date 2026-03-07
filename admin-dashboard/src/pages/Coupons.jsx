import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { couponsAPI } from '../services/api'

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ code: '', discount_percent: '', expiration_date: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCoupons = async () => {
    try {
      const { data } = await couponsAPI.getAll()
      setCoupons(data)
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل الكوبونات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await couponsAPI.create(form)
      setSuccess('تم إنشاء الكوبون بنجاح')
      setOpen(false)
      setForm({ code: '', discount_percent: '', expiration_date: '' })
      loadCoupons()
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ')
    }
  }

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>الكوبونات</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} sx={{ mb: 2 }}>
        إضافة كوبون
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الكود</TableCell>
              <TableCell>نسبة الخصم %</TableCell>
              <TableCell>تاريخ الانتهاء</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.discount_percent}%</TableCell>
                <TableCell>{c.expiration_date ? new Date(c.expiration_date).toLocaleDateString('ar-IQ') : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>إضافة كوبون</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="الكود" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required sx={{ mt: 1 }} />
            <TextField fullWidth type="number" label="نسبة الخصم %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} required sx={{ mt: 1 }} />
            <TextField fullWidth type="date" label="تاريخ الانتهاء" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions sx={{ flexDirection: 'row-reverse' }}>
            <Button type="submit" variant="contained">حفظ</Button>
            <Button onClick={() => setOpen(false)}>إلغاء</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
