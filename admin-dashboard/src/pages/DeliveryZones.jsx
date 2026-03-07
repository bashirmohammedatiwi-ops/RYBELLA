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
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { deliveryZonesAPI } from '../services/api'

export default function DeliveryZones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ city: '', delivery_fee: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadZones = async () => {
    try {
      const { data } = await deliveryZonesAPI.getAll()
      setZones(data)
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل المناطق')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadZones()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await deliveryZonesAPI.update(editing.id, form)
        setSuccess('تم تحديث المنطقة بنجاح')
      } else {
        await deliveryZonesAPI.create(form)
        setSuccess('تم إضافة المنطقة بنجاح')
      }
      setOpen(false)
      setEditing(null)
      setForm({ city: '', delivery_fee: '' })
      loadZones()
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return
    try {
      await deliveryZonesAPI.delete(id)
      setSuccess('تم الحذف بنجاح')
      loadZones()
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الحذف')
    }
  }

  const openEdit = (z) => {
    setEditing(z)
    setForm({ city: z.city, delivery_fee: z.delivery_fee })
    setOpen(true)
  }

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>مناطق التوصيل</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Button variant="contained" startIcon={<Add />} onClick={() => { setOpen(true); setEditing(null); setForm({ city: '', delivery_fee: '' }) }} sx={{ mb: 2 }}>
        إضافة منطقة
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>المدينة</TableCell>
              <TableCell>رسوم التوصيل (د.ع)</TableCell>
              <TableCell align="left">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {zones.map((z) => (
              <TableRow key={z.id}>
                <TableCell>{z.city}</TableCell>
                <TableCell>{Number(z.delivery_fee).toLocaleString('ar-IQ')}</TableCell>
                <TableCell align="left">
                  <IconButton onClick={() => openEdit(z)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(z.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editing ? 'تعديل المنطقة' : 'إضافة منطقة'}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="المدينة" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required sx={{ mt: 1 }} />
            <TextField fullWidth type="number" label="رسوم التوصيل (د.ع)" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} required sx={{ mt: 1 }} />
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
