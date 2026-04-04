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
  const [form, setForm] = useState({ name: '', image: null, icon: '', icon_image: null, overlay_text: '' })
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
      if (form.icon_image) formData.append('icon_image', form.icon_image)
      else formData.append('icon', form.icon || '')
      formData.append('overlay_text', form.overlay_text || '')
      if (editing) {
        await categoriesAPI.update(editing.id, formData, formData)
        setSuccess('تم تحديث الفئة بنجاح')
      } else {
        await categoriesAPI.create(formData, formData)
        setSuccess('تم إضافة الفئة بنجاح')
      }
      setOpen(false)
      setEditing(null)
      setForm({ name: '', image: null, icon: '', icon_image: null, overlay_text: '' })
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
    setForm({ name: cat.name, image: null, icon: cat.icon || '', icon_image: null, overlay_text: cat.overlay_text || '' })
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
      <Button variant="contained" startIcon={<Add />} onClick={() => { setOpen(true); setEditing(null); setForm({ name: '', image: null, icon: '', icon_image: null, overlay_text: '' }) }} sx={{ mb: 2 }}>
        إضافة فئة
      </Button>
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}></TableCell>
              <TableCell sx={{ width: 60 }}>التسلسل</TableCell>
              <TableCell>الصورة</TableCell>
                <TableCell>الأيقونة</TableCell>
                <TableCell>النص فوق الصورة</TableCell>
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
                <TableCell>
                  {cat.icon && (cat.icon.startsWith('/') || cat.icon.startsWith('http') || /\.(png|jpg|jpeg|gif|webp)$/i.test(cat.icon)) ? (
                    <ImageDisplay src={cat.icon} size="sm" fit="cover" width={40} height={40} />
                  ) : (
                    cat.icon || '—'
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: 120 }}>{cat.overlay_text ? (cat.overlay_text.length > 20 ? cat.overlay_text.slice(0, 20) + '...' : cat.overlay_text) : '—'}</TableCell>
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
            <Typography variant="subtitle2" sx={{ mb: 1 }}>الأيقونة (تظهر في الواجهة الرئيسية)</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
              <TextField size="small" label="اسم الأيقونة (اختياري)" value={form.icon_image ? '' : form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value, icon_image: null })} placeholder="tag-outline, brush, lipstick..." sx={{ flex: 1, minWidth: 180 }} />
              <Button variant="outlined" component="label" size="small">
                {form.icon_image ? form.icon_image.name : (editing?.icon && (editing.icon.startsWith('/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(editing.icon)) ? 'تغيير صورة الأيقونة' : 'رفع صورة أيقونة')}
                <input type="file" hidden accept="image/*" onChange={(e) => setForm({ ...form, icon_image: e.target.files[0] || null, icon: '' })} />
              </Button>
            </Box>
            {(form.icon_image || (editing?.icon && (editing.icon.startsWith('/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(editing.icon)))) && (
              <Box sx={{ mb: 2 }}>
                {form.icon_image ? (
                  <ImageDisplay src={URL.createObjectURL(form.icon_image)} size="sm" fit="cover" width={48} height={48} />
                ) : (
                  <ImageDisplay src={editing?.icon} size="sm" fit="cover" width={48} height={48} baseUrl={IMG_BASE} />
                )}
                {form.icon_image && <Button size="small" onClick={() => setForm({ ...form, icon_image: null })} sx={{ mt: 0.5 }}>إزالة</Button>}
              </Box>
            )}
            <TextField fullWidth label="نص يظهر فوق الصورة (اختياري)" value={form.overlay_text} onChange={(e) => setForm({ ...form, overlay_text: e.target.value })} placeholder="مثال: تصفح الآن" sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>الصورة (تظهر في صفحة الفئات)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
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
