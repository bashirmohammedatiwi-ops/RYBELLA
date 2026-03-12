import { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { subcategoriesAPI, categoriesAPI } from '../services/api';
import SortableTableRow, { DragHandleCell } from '../components/SortableTableRow';
import ImageDisplay from '../components/ImageDisplay';

export default function Subcategories() {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category_id: '', sort_order: '', image: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [subRes, catRes] = await Promise.all([
        subcategoriesAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setSubcategories(Array.isArray(subRes.data) ? subRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل الفئات الثانوية. تأكد من تشغيل Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category_id) {
      setError('اختر الفئة الرئيسية');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category_id', form.category_id);
      if (form.sort_order !== '' && form.sort_order != null) formData.append('sort_order', form.sort_order);
      if (form.image) formData.append('image', form.image);
      if (editing) {
        await subcategoriesAPI.update(editing.id, formData);
        setSuccess('تم تحديث الفئة الثانوية بنجاح');
      } else {
        await subcategoriesAPI.create(formData);
        setSuccess('تم إضافة الفئة الثانوية بنجاح');
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: '', category_id: '', sort_order: '', image: null });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await subcategoriesAPI.delete(id);
      setSuccess('تم الحذف بنجاح');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const openEdit = (sub) => {
    setEditing(sub);
    setForm({ name: sub.name, category_id: String(sub.category_id), sort_order: sub.sort_order ?? '', image: null });
    setOpen(true);
  };

  const handleReorder = async (fromIndex, toIndex) => {
    const reordered = [...subcategories];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const items = reordered.map((s, i) => ({ id: s.id, sort_order: i }));
    try {
      await subcategoriesAPI.reorder(items);
      setSubcategories(reordered.map((s, i) => ({ ...s, sort_order: i })));
      setSuccess('تم تحديث الترتيب بنجاح');
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث الترتيب');
    }
    setDraggedIndex(-1);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>الفئات الثانوية</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => { setOpen(true); setEditing(null); setForm({ name: '', category_id: '', sort_order: '', image: null }); }}
        sx={{ mb: 2 }}
      >
        إضافة فئة ثانوية
      </Button>
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}></TableCell>
              <TableCell sx={{ width: 70 }}>التسلسل</TableCell>
              <TableCell>الصورة</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell>الفئة الرئيسية</TableCell>
              <TableCell align="left">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subcategories.map((sub, i) => (
              <SortableTableRow
                key={sub.id}
                item={sub}
                index={i}
                isDragging={draggedIndex === i}
                onDragStart={setDraggedIndex}
                onDrop={handleReorder}
                onDragEnd={() => setDraggedIndex(-1)}
              >
                <DragHandleCell />
                <TableCell>{sub.sort_order ?? i}</TableCell>
                <TableCell>
                  <ImageDisplay src={sub.image} size="md" fit="cover" />
                </TableCell>
                <TableCell>{sub.name}</TableCell>
                <TableCell>{sub.category_name || '-'}</TableCell>
                <TableCell align="left">
                  <IconButton onClick={() => openEdit(sub)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(sub.id)}><Delete /></IconButton>
                </TableCell>
              </SortableTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>{editing ? 'تعديل الفئة الثانوية' : 'إضافة فئة ثانوية'}</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <FormControl fullWidth required sx={{ mt: 1 }}>
              <InputLabel>الفئة الرئيسية</InputLabel>
              <Select
                value={form.category_id}
                label="الفئة الرئيسية"
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="اسم الفئة الثانوية"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              sx={{ mt: 2 }}
            />
            <TextField fullWidth label="التسلسل" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} sx={{ mt: 2 }} placeholder="رقم أقل = ظهور أولاً" inputProps={{ min: 0 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {(editing?.image || form.image) && (
                <ImageDisplay
                  src={form.image ? URL.createObjectURL(form.image) : editing?.image}
                  size="lg"
                  fit="cover"
                  baseUrl={form.image ? '' : undefined}
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
  );
}
