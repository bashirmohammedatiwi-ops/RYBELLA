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
import { categoriesAPI } from '../services/api'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', image: null })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll()
      setCategories(data)
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل الفئات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      if (form.image) formData.append('image', form.image)
      if (editing) {
        await categoriesAPI.update(editing.id, formData, formData)
        setSuccess('تم تحديث الفئة بنجاح')
      } else {
        await categoriesAPI.create(formData, formData)
        setSuccess('تم إضافة الفئة بنجاح')
      }
      setOpen(false)
      setEditing(null)
      setForm({ name: '', image: null })
      loadCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return
    try {
      await categoriesAPI.delete(id)
      setSuccess('تم الحذف بنجاح')
      loadCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الحذف')
    }
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, image: null })
    setOpen(true)
  }

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>الفئات</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Button variant="contained" startIcon={<Add />} onClick={() => { setOpen(true); setEditing(null); setForm({ name: '', image: null }) }} sx={{ mb: 2 }}>
        إضافة فئة
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell align="left">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  {cat.image && <img src={`http://localhost:5000${cat.image}`} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />}
                </TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell align="left">
                  <IconButton onClick={() => openEdit(cat)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(cat.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editing ? 'تعديل الفئة' : 'إضافة فئة'}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required sx={{ mt: 1 }} />
            <Button variant="outlined" component="label" sx={{ mt: 2 }}>رفع صورة
              <input type="file" hidden accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
            </Button>
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
