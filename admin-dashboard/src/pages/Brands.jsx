import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { brandsAPI } from '../services/api';
import SortableTableRow, { DragHandleCell } from '../components/SortableTableRow';
import ImageDisplay from '../components/ImageDisplay';

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(-1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data } = await brandsAPI.getAll();
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تحميل العلامات التجارية. تأكد من تشغيل Backend (نافذة Rybella Backend) على المنفذ 5000 ثم اضغط إعادة المحاولة' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setForm({ name: brand.name, sort_order: brand.sort_order ?? '' });
    } else {
      setEditingBrand(null);
      setForm({ name: '', sort_order: '' });
    }
    setLogoFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (form.sort_order !== '' && form.sort_order != null) formData.append('sort_order', form.sort_order);
      if (logoFile) formData.append('logo', logoFile);

      if (editingBrand) {
        await brandsAPI.update(editingBrand.id, formData);
        setMessage({ type: 'success', text: 'تم تحديث العلامة التجارية بنجاح' });
      } else {
        await brandsAPI.create(formData);
        setMessage({ type: 'success', text: 'تم إضافة العلامة التجارية بنجاح' });
      }
      setDialogOpen(false);
      loadBrands();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  const handleReorder = async (fromIndex, toIndex) => {
    const reordered = [...brands];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const items = reordered.map((b, i) => ({ id: b.id, sort_order: i }));
    try {
      await brandsAPI.reorder(items);
      setBrands(reordered.map((b, i) => ({ ...b, sort_order: i })));
      setMessage({ type: 'success', text: 'تم تحديث الترتيب بنجاح' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشل تحديث الترتيب' });
    }
    setDraggedIndex(-1);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">العلامات التجارية</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          إضافة علامة تجارية
        </Button>
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          onClose={() => setMessage({ type: '', text: '' })}
          sx={{ mb: 2 }}
          action={message.type === 'error' && <Button size="small" onClick={loadBrands}>إعادة المحاولة</Button>}
        >
          {message.text}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}></TableCell>
              <TableCell sx={{ width: 60 }}>التسلسل</TableCell>
              <TableCell>الشعار</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((b, i) => (
              <SortableTableRow
                key={b.id}
                item={b}
                index={i}
                isDragging={draggedIndex === i}
                onDragStart={setDraggedIndex}
                onDrop={handleReorder}
                onDragEnd={() => setDraggedIndex(-1)}
              >
                <DragHandleCell />
                <TableCell>{b.sort_order ?? i}</TableCell>
                <TableCell>
                  <ImageDisplay src={b.logo} size="md" fit="contain" />
                </TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell align="left">
                  <IconButton onClick={() => handleOpenDialog(b)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </SortableTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>{editingBrand ? 'تعديل العلامة التجارية' : 'إضافة علامة تجارية'}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <TextField label="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField label="التسلسل" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} fullWidth placeholder="رقم أقل = ظهور أولاً" inputProps={{ min: 0 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {(editingBrand?.logo || logoFile) && (
                <ImageDisplay
                  src={logoFile ? URL.createObjectURL(logoFile) : editingBrand?.logo}
                  size="lg"
                  fit="contain"
                  baseUrl={logoFile ? '' : undefined}
                />
              )}
              <Button variant="outlined" component="label">
                {logoFile ? logoFile.name : editingBrand?.logo ? 'تغيير الشعار' : 'اختر الشعار'}
                <input type="file" hidden accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained">حفظ</Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
