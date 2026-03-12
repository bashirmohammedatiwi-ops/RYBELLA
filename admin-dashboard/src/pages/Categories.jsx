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
import { categoriesAPI, IMG_BASE } from '../services/api'
import SortableTableRow, { DragHandleCell } from '../components/SortableTableRow'
import ImageDisplay from '../components/ImageDisplay'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', image: null })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل الفئات. تأكد من تشغيل Backend')
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

  const handleReorder = async (fromIndex, toIndex) => {
    const reordered = [...categories]
    const [removed] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, removed)
    const items = reordered.map((c, i) => ({ id: c.id, sort_order: i }))
    try {
      await categoriesAPI.reorder(items)
      setCategories(reordered.map((c, i) => ({ ...c, sort_order: i })))
      setSuccess('تم تحديث الترتيب بنجاح')
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الترتيب')
    }
    setDraggedIndex(-1)
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
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}></TableCell>
              <TableCell sx={{ width: 60 }}>التسلسل</TableCell>
              <TableCell>الصورة</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell align="left">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat, i) => (
              <SortableTableRow
                key={cat.id}
                item={cat}
                index={i}
                isDragging={draggedIndex === i}
                onDragStart={setDraggedIndex}
                onDrop={handleReorder}
                onDragEnd={() => setDraggedIndex(-1)}
              >
                <DragHandleCell />
                <TableCell>{cat.sort_order ?? i}</TableCell>
                <TableCell>
                  <ImageDisplay src={cat.image} size="md" fit="cover" />
                </TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell align="left">
                  <IconButton onClick={() => openEdit(cat)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(cat.id)}><Delete /></IconButton>
                </TableCell>
              </SortableTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>{editing ? 'تعديل الفئة' : 'إضافة فئة'}</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField fullWidth label="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {(editing?.image || form.image) && (
                <ImageDisplay
                  src={form.image ? URL.createObjectURL(form.image) : editing?.image}
                  size="lg"
                  fit="cover"
                  baseUrl={form.image ? '' : IMG_BASE}
                />
              )}
              <Button variant="outlined" component="label">
                {form.image ? form.image.name : editing?.image ? 'تغيير الصورة' : 'رفع صورة'}
                <input type="file" hidden accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
              </Button>
            </Box>
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
