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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { bannersAPI, productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';
import BannerPositionEditor from '../components/BannerPositionEditor';

const defaultForm = {
  title: '',
  subtitle: '',
  discount_percent: '',
  discount_label: 'خصم',
  button_text: 'اطلب الآن',
  button_color: '#1A1A1A',
  background_color: '#F5F5F5',
  border_color: '#E85D7A',
  border_radius: 24,
  link_type: 'none',
  link_value: '',
  sort_order: 0,
  active: 1,
  image_pos_x: 80,
  image_pos_y: 100,
  image_size: 0,
};

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [imageFile, setImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => { loadBanners(); }, []);
  useEffect(() => { categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => []); }, []);
  useEffect(() => { brandsAPI.getAll().then((r) => setBrands(r?.data || [])).catch(() => []); }, []);
  useEffect(() => { subcategoriesAPI.getAll().then((r) => setSubcategories(r?.data || [])).catch(() => []); }, []);
  useEffect(() => {
    if (!productSearch || productSearch.length < 2) { setProducts([]); return; }
    setProductLoading(true);
    productsAPI.getAll({ search: productSearch }).then((r) => setProducts(r?.data || [])).catch(() => []).finally(() => setProductLoading(false));
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
        subtitle: banner.subtitle || '',
        discount_percent: banner.discount_percent != null ? banner.discount_percent : '',
        discount_label: banner.discount_label || 'خصم',
        button_text: banner.button_text || 'اطلب الآن',
        button_color: banner.button_color || '#1A1A1A',
        background_color: banner.background_color || '#F5F5F5',
        border_color: banner.border_color || '#E85D7A',
        border_radius: banner.border_radius != null ? parseFloat(banner.border_radius) : 24,
        link_type: banner.link_type || 'none',
        link_value: banner.link_value || '',
        sort_order: banner.sort_order || 0,
        active: banner.active !== undefined ? banner.active : 1,
        image_pos_x: banner.image_pos_x != null ? parseFloat(banner.image_pos_x) : 80,
        image_pos_y: banner.image_pos_y != null ? parseFloat(banner.image_pos_y) : 100,
        image_size: banner.image_size != null ? parseFloat(banner.image_size) : 0,
      });
    } else {
      setEditingBanner(null);
      setForm({ ...defaultForm });
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
      Object.entries(form).forEach(([k, v]) => formData.append(k, v ?? ''));
      if (imageFile) formData.append('image', imageFile, imageFile.name || 'image.jpg');
      if (backgroundImageFile) formData.append('background_image', backgroundImageFile, backgroundImageFile.name || 'background.jpg');

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
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'حدث خطأ';
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
      <Typography variant="h5" sx={{ mb: 2 }}>البانرات</Typography>
      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>{message.text}</Alert>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>إضافة بانر</Button>

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
            </TableHead>
            <TableBody>
              {banners.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {b.background_image && <ImageDisplay src={b.background_image} width={48} height={32} fit="cover" title="الخلفية" />}
                      <ImageDisplay src={b.image} width={48} height={32} fit="cover" title="الصورة الأمامية" />
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
                    <IconButton size="small" onClick={() => handleOpenDialog(b)}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(b.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
            {/* 1. المحتوى */}
            <Accordion defaultExpanded={true} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>المحتوى</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField label="العنوان الرئيسي" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth size="small" placeholder="مثال: MATTE LIQUID LIPSTICK" />
                <TextField label="العنوان الفرعي" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} fullWidth size="small" placeholder="مثال: لون ثابت ... إطلالة تدوم" />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField label="نص الزر" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} size="small" sx={{ width: 180 }} placeholder="اطلب الآن" />
                  <TextField label="نسبة الخصم %" type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} size="small" sx={{ width: 100 }} placeholder="30" />
                  <TextField label="نص شارة الخصم" value={form.discount_label} onChange={(e) => setForm({ ...form, discount_label: e.target.value })} size="small" sx={{ width: 120 }} placeholder="خصم" />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* 2. المظهر */}
            <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>المظهر</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField label="لون الخلفية" value={form.background_color} onChange={(e) => setForm({ ...form, background_color: e.target.value })} size="small" sx={{ width: 140 }} placeholder="#F5F5F5" />
                  <TextField label="لون الحدود" value={form.border_color} onChange={(e) => setForm({ ...form, border_color: e.target.value })} size="small" sx={{ width: 140 }} placeholder="#E85D7A" />
                  <TextField label="لون الزر" value={form.button_color} onChange={(e) => setForm({ ...form, button_color: e.target.value })} size="small" sx={{ width: 140 }} placeholder="#1A1A1A" />
                  <TextField label="نصف قطر الزوايا" type="number" value={form.border_radius} onChange={(e) => setForm({ ...form, border_radius: parseFloat(e.target.value) || 24 })} size="small" sx={{ width: 120 }} placeholder="24" />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* 3. الصور والموضع */}
            <Accordion defaultExpanded={true} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>الصور والموضع</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>صورة الخلفية (اختياري)</Typography>
                  <Button variant="outlined" component="label" size="small">
                    {backgroundImageFile ? backgroundImageFile.name : editingBanner?.background_image ? 'تغيير الخلفية' : 'اختر صورة الخلفية'}
                    <input type="file" hidden accept="image/*" onChange={(e) => setBackgroundImageFile(e.target.files?.[0] ?? null)} />
                  </Button>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>الصورة الأمامية (مطلوبة) — تظهر على اليمين وتخرج من أعلى البانر</Typography>
                  <Button variant="outlined" component="label" size="small" color={!editingBanner && !imageFile ? 'error' : 'primary'}>
                    {imageFile ? imageFile.name : editingBanner?.image ? 'تغيير الصورة' : 'اختر الصورة'}
                    <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
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
                  <Typography variant="caption" color="error">الصورة الأمامية مطلوبة للبانر الجديد</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {/* 4. الرابط */}
            <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>الرابط</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
              </AccordionDetails>
            </Accordion>

            {/* 5. الإعدادات */}
            <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>الإعدادات</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField label="الترتيب" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })} size="small" sx={{ width: 100 }} />
                <Switch checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })} />
                <Typography variant="body2">نشط</Typography>
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 2 }} />
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
