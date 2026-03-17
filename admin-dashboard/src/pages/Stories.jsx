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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { storiesAPI, productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    link_type: 'none',
    link_value: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => []);
    brandsAPI.getAll().then((r) => setBrands(r?.data || [])).catch(() => []);
  }, []);

  useEffect(() => {
    subcategoriesAPI.getAll().then((r) => setSubcategories(r?.data || [])).catch(() => []);
  }, []);

  useEffect(() => {
    if (!productSearch || productSearch.length < 2) {
      setProducts([]);
      return;
    }
    setProductLoading(true);
    productsAPI.getAll({ search: productSearch })
      .then((r) => setProducts(r?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setProductLoading(false));
  }, [productSearch]);

  const loadStories = async () => {
    try {
      const { data } = await storiesAPI.getAll();
      setStories(data || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تحميل اليوميات' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setForm({ link_type: 'none', link_value: '' });
    setImageFile(null);
    setProductSearch('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setMessage({ type: 'error', text: 'الصورة مطلوبة' });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('link_type', form.link_type);
      formData.append('link_value', form.link_value || '');
      formData.append('image', imageFile, imageFile.name || 'image.jpg');

      await storiesAPI.create(formData);
      setMessage({ type: 'success', text: 'تم إضافة اليومية بنجاح' });
      setDialogOpen(false);
      loadStories();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'حدث خطأ';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه اليومية؟')) return;
    try {
      await storiesAPI.delete(id);
      setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
      loadStories();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' });
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        اليوميات
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        اليوميات تظهر في المتجر لمدة 24 ساعة ثم تختفي تلقائياً (مثل انستغرام)
      </Typography>
      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog} sx={{ mb: 2 }}>
        إضافة يومية
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>الرابط</TableCell>
              <TableCell>تاريخ الإضافة</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stories.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <ImageDisplay src={s.image} width={80} height={80} fit="cover" />
                </TableCell>
                <TableCell>
                  {s.link_type === 'product' && `منتج: ${s.link_value}`}
                  {s.link_type === 'category' && `فئة: ${s.link_value}`}
                  {s.link_type === 'subcategory' && `فئة ثانوية: ${s.link_value}`}
                  {s.link_type === 'brand' && `براند: ${s.link_value}`}
                  {s.link_type === 'url' && s.link_value}
                  {s.link_type === 'none' && '-'}
                </TableCell>
                <TableCell>{formatDate(s.created_at)}</TableCell>
                <TableCell align="left">
                  <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {stories.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          لا توجد يوميات. أضف يومية جديدة.
        </Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة يومية جديدة</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
              {imageFile ? imageFile.name : 'اختر صورة'}
              <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            </Button>
            <FormControl fullWidth size="small">
              <InputLabel>نوع الرابط</InputLabel>
              <Select value={form.link_type} label="نوع الرابط" onChange={(e) => setForm({ ...form, link_type: e.target.value, link_value: '' })}>
                <MenuItem value="none">بدون رابط</MenuItem>
                <MenuItem value="product">منتج (اسم أو باركود)</MenuItem>
                <MenuItem value="category">فئة</MenuItem>
                <MenuItem value="subcategory">فئة ثانوية</MenuItem>
                <MenuItem value="brand">براند</MenuItem>
                <MenuItem value="url">رابط خارجي</MenuItem>
              </Select>
            </FormControl>
            {form.link_type === 'product' && (
              <Autocomplete
                freeSolo
                options={products}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || opt?.barcode || '')}
                loading={productLoading}
                inputValue={productSearch}
                onInputChange={(_, v) => { setProductSearch(v); setForm((f) => ({ ...f, link_value: v })); }}
                onChange={(_, val) => { const v = typeof val === 'string' ? val : val?.name || val?.barcode || ''; setForm((f) => ({ ...f, link_value: v })); setProductSearch(v); }}
                renderInput={(params) => <TextField {...params} label="اسم المنتج أو الباركود" size="small" placeholder="ابحث بالاسم أو الباركود" />}
              />
            )}
            {form.link_type === 'category' && (
              <Autocomplete
                options={categories}
                getOptionLabel={(opt) => opt?.name || ''}
                value={categories.find((c) => c.name === form.link_value) || null}
                onChange={(_, val) => setForm((f) => ({ ...f, link_value: val?.name || '' }))}
                renderInput={(params) => <TextField {...params} label="اختر الفئة" size="small" />}
              />
            )}
            {form.link_type === 'subcategory' && (
              <Autocomplete
                options={subcategories}
                getOptionLabel={(opt) => opt?.name || ''}
                value={subcategories.find((s) => s.name === form.link_value) || null}
                onChange={(_, val) => setForm((f) => ({ ...f, link_value: val?.name || '' }))}
                renderInput={(params) => <TextField {...params} label="اختر الفئة الثانوية" size="small" />}
              />
            )}
            {form.link_type === 'brand' && (
              <Autocomplete
                options={brands}
                getOptionLabel={(opt) => opt?.name || ''}
                value={brands.find((b) => b.name === form.link_value) || null}
                onChange={(_, val) => setForm((f) => ({ ...f, link_value: val?.name || '' }))}
                renderInput={(params) => <TextField {...params} label="اختر البراند" size="small" />}
              />
            )}
            {form.link_type === 'url' && (
              <TextField label="الرابط" value={form.link_value} onChange={(e) => setForm({ ...form, link_value: e.target.value })} fullWidth size="small" placeholder="https://..." />
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained" disabled={!imageFile}>
                إضافة
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
