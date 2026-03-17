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
  Switch,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { bannersAPI, productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';
import BannerPositionEditor from '../components/BannerPositionEditor';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({
    title: '',
    link_type: 'none',
    link_value: '',
    sort_order: 0,
    active: 1,
    image_pos_x: 80,
    image_pos_y: 70,
    image_size: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    loadBanners();
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

  const loadBanners = async () => {
    try {
      const { data } = await bannersAPI.getAll();
      setBanners(data || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تحميل البانرات' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setForm({
        title: banner.title || '',
        link_type: banner.link_type || 'none',
        link_value: banner.link_value || '',
        sort_order: banner.sort_order || 0,
        active: banner.active !== undefined ? banner.active : 1,
        image_pos_x: banner.image_pos_x != null ? parseFloat(banner.image_pos_x) : 80,
        image_pos_y: banner.image_pos_y != null ? parseFloat(banner.image_pos_y) : 70,
        image_size: banner.image_size != null ? parseFloat(banner.image_size) : 0,
      });
    } else {
      setEditingBanner(null);
      setForm({
        title: '',
        link_type: 'none',
        link_value: '',
        sort_order: 0,
        active: 1,
        image_pos_x: 80,
        image_pos_y: 70,
        image_size: 0,
      });
    }
    setImageFile(null);
    setBackgroundImageFile(null);
    setProductSearch(banner && banner.link_type === 'product' && banner.link_value ? banner.link_value : '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('link_type', form.link_type);
      formData.append('link_value', form.link_value);
      formData.append('sort_order', form.sort_order);
      formData.append('active', form.active ? 1 : 0);
      formData.append('image_pos_x', form.image_pos_x);
      formData.append('image_pos_y', form.image_pos_y);
      formData.append('image_size', form.image_size);
      if (imageFile) formData.append('image', imageFile);
      if (backgroundImageFile) formData.append('background_image', backgroundImageFile);

      if (editingBanner) {
        await bannersAPI.update(editingBanner.id, formData);
        setMessage({ type: 'success', text: 'تم تحديث البانر بنجاح' });
      } else {
        await bannersAPI.create(formData);
        setMessage({ type: 'success', text: 'تم إضافة البانر بنجاح' });
      }
      setDialogOpen(false);
      loadBanners();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'حدث خطأ';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      await bannersAPI.delete(id);
      setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
      loadBanners();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        البانرات
      </Typography>
      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        إضافة بانر
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>العنوان</TableCell>
              <TableCell>الرابط</TableCell>
              <TableCell>الترتيب</TableCell>
              <TableCell>نشط</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banners.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {b.background_image && <ImageDisplay src={b.background_image} width={64} height={40} fit="cover" title="الخلفية" />}
                    <ImageDisplay src={b.image} width={64} height={40} fit="cover" title="الصورة العلوية" />
                  </Box>
                </TableCell>
                <TableCell>{b.title || '-'}</TableCell>
                <TableCell>
                  {b.link_type === 'product' && `منتج: ${b.link_value}`}
                  {b.link_type === 'category' && `فئة: ${b.link_value}`}
                  {b.link_type === 'subcategory' && `فئة ثانوية: ${b.link_value}`}
                  {b.link_type === 'brand' && `براند: ${b.link_value}`}
                  {b.link_type === 'url' && b.link_value}
                  {b.link_type === 'none' && '-'}
                </TableCell>
                <TableCell>{b.sort_order}</TableCell>
                <TableCell>{b.active ? 'نعم' : 'لا'}</TableCell>
                <TableCell align="left">
                  <IconButton size="small" onClick={() => handleOpenDialog(b)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(b.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
            {/* 1. المعلومات الأساسية */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>المعلومات الأساسية</Typography>
              <TextField label="العنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth size="small" />
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField label="الترتيب" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })} size="small" sx={{ width: 100 }} />
                <Switch checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })} />
                <Typography variant="body2">نشط</Typography>
              </Box>
            </Box>

            {/* 2. صورة الخلفية */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>صورة الخلفية</Typography>
              <Typography variant="caption" color="text.secondary">تدرج وردي أو صورة كاملة للبانر</Typography>
              <Button variant="outlined" component="label" size="small" sx={{ alignSelf: 'flex-start' }}>
                {backgroundImageFile ? backgroundImageFile.name : editingBanner?.background_image ? 'تغيير الخلفية' : 'اختر صورة الخلفية'}
                <input type="file" hidden accept="image/*" onChange={(e) => setBackgroundImageFile(e.target.files[0])} />
              </Button>
            </Box>

            {/* 3. الصورة الثانية - التحكم الدقيق */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>الصورة الثانية (فوق البانر)</Typography>
              <Typography variant="caption" color="text.secondary">صورة المنتج أو الشخص - تظهر على اليمين أو اليسار حسب الموضع</Typography>
              <Button variant="outlined" component="label" size="small" sx={{ alignSelf: 'flex-start' }}>
                {imageFile ? imageFile.name : editingBanner?.image ? 'تغيير الصورة' : 'اختر الصورة'}
                <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              </Button>
            </Box>
            {(imageFile || editingBanner?.image) && (
              <BannerPositionEditor
                backgroundSrc={backgroundImageFile || editingBanner?.background_image}
                imageSrc={imageFile || editingBanner?.image}
                imagePosX={form.image_pos_x}
                imagePosY={form.image_pos_y}
                imageSize={form.image_size}
                onPositionChange={({ x, y }) => setForm((f) => ({ ...f, image_pos_x: x, image_pos_y: y }))}
                onSizeChange={(v) => setForm((f) => ({ ...f, image_size: v }))}
              />
            )}
            {!editingBanner && !imageFile && (
              <Typography variant="caption" color="error">الصورة العلوية مطلوبة للبانر الجديد</Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained" disabled={!editingBanner && !imageFile}>
                {editingBanner ? 'تحديث' : 'إضافة'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
