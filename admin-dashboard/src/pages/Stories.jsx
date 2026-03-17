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
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoIcon from '@mui/icons-material/AddPhotoAlternate';
import { storiesAPI, productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';

const emptySlide = () => ({ link_type: 'none', link_value: '', file: null });

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [slides, setSlides] = useState([emptySlide()]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productSearch, setProductSearch] = useState({});
  const [productLoading, setProductLoading] = useState({});

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

  const loadProducts = (idx, query) => {
    if (!query || query.length < 2) {
      setProducts((p) => ({ ...p, [idx]: [] }));
      return;
    }
    setProductLoading((l) => ({ ...l, [idx]: true }));
    productsAPI.getAll({ search: query })
      .then((r) => setProducts((p) => ({ ...p, [idx]: r?.data || [] })))
      .catch(() => setProducts((p) => ({ ...p, [idx]: [] })))
      .finally(() => setProductLoading((l) => ({ ...l, [idx]: false })));
  };

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
    setSlides([emptySlide()]);
    setProductSearch({});
    setDialogOpen(true);
  };

  const addSlide = () => {
    setSlides((s) => [...s, emptySlide()]);
  };

  const removeSlide = (idx) => {
    if (slides.length <= 1) return;
    setSlides((s) => s.filter((_, i) => i !== idx));
  };

  const updateSlide = (idx, field, value) => {
    setSlides((s) => {
      const next = [...s];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const slidesWithFiles = slides.filter((s) => s.file);
    if (!slidesWithFiles.length) {
      setMessage({ type: 'error', text: 'يجب إضافة صورة واحدة على الأقل' });
      return;
    }
    try {
      const formData = new FormData();
      slidesWithFiles.forEach((s) => formData.append('images', s.file, s.file.name || 'image.jpg'));
      formData.append('slides', JSON.stringify(slidesWithFiles.map((s) => ({ link_type: s.link_type, link_value: s.link_value || '' }))));
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

  const LinkSelect = ({ idx, slide }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel>نوع الرابط</InputLabel>
        <Select value={slide.link_type} label="نوع الرابط" onChange={(e) => updateSlide(idx, 'link_type', e.target.value)}>
          <MenuItem value="none">بدون رابط</MenuItem>
          <MenuItem value="product">منتج</MenuItem>
          <MenuItem value="category">فئة</MenuItem>
          <MenuItem value="subcategory">فئة ثانوية</MenuItem>
          <MenuItem value="brand">براند</MenuItem>
          <MenuItem value="url">رابط خارجي</MenuItem>
        </Select>
      </FormControl>
      {slide.link_type === 'product' && (
        <Autocomplete
          freeSolo
          options={products[idx] || []}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || opt?.barcode || '')}
          loading={productLoading[idx]}
          inputValue={productSearch[idx] || ''}
          onInputChange={(_, v) => { setProductSearch((p) => ({ ...p, [idx]: v })); updateSlide(idx, 'link_value', v); loadProducts(idx, v); }}
          onChange={(_, val) => { const v = typeof val === 'string' ? val : val?.name || val?.barcode || ''; updateSlide(idx, 'link_value', v); setProductSearch((p) => ({ ...p, [idx]: v })); }}
          renderInput={(params) => <TextField {...params} label="اسم المنتج أو الباركود" size="small" />}
        />
      )}
      {slide.link_type === 'category' && (
        <Autocomplete
          options={categories}
          getOptionLabel={(opt) => opt?.name || ''}
          value={categories.find((c) => c.name === slide.link_value) || null}
          onChange={(_, val) => updateSlide(idx, 'link_value', val?.name || '')}
          renderInput={(params) => <TextField {...params} label="اختر الفئة" size="small" />}
        />
      )}
      {slide.link_type === 'subcategory' && (
        <Autocomplete
          options={subcategories}
          getOptionLabel={(opt) => opt?.name || ''}
          value={subcategories.find((s) => s.name === slide.link_value) || null}
          onChange={(_, val) => updateSlide(idx, 'link_value', val?.name || '')}
          renderInput={(params) => <TextField {...params} label="اختر الفئة الثانوية" size="small" />}
        />
      )}
      {slide.link_type === 'brand' && (
        <Autocomplete
          options={brands}
          getOptionLabel={(opt) => opt?.name || ''}
          value={brands.find((b) => b.name === slide.link_value) || null}
          onChange={(_, val) => updateSlide(idx, 'link_value', val?.name || '')}
          renderInput={(params) => <TextField {...params} label="اختر البراند" size="small" />}
        />
      )}
      {slide.link_type === 'url' && (
        <TextField label="الرابط" value={slide.link_value} onChange={(e) => updateSlide(idx, 'link_value', e.target.value)} fullWidth size="small" placeholder="https://..." />
      )}
    </Box>
  );

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        اليوميات
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        أضف صوراً متعددة لكل يومية - تظهر مثل ستوريات انستغرام مع إمكانية التصفح بينها
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
              <TableCell>الصور</TableCell>
              <TableCell>عدد الشرائح</TableCell>
              <TableCell>تاريخ الإضافة</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stories.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(s.slides || []).slice(0, 4).map((sl) => (
                      <ImageDisplay key={sl.id} src={sl.image} width={48} height={48} fit="cover" />
                    ))}
                    {(s.slides?.length || 0) > 4 && <Chip size="small" label={`+${s.slides.length - 4}`} sx={{ alignSelf: 'center' }} />}
                  </Box>
                </TableCell>
                <TableCell>{s.slides?.length || 0}</TableCell>
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
        <DialogTitle>إضافة يومية جديدة (صور متعددة)</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            {slides.map((slide, idx) => (
              <Box key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">صورة {idx + 1}</Typography>
                  {slides.length > 1 && (
                    <IconButton size="small" color="error" onClick={() => removeSlide(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Button variant="outlined" component="label" size="small" startIcon={<AddPhotoIcon />} sx={{ mb: 1 }}>
                  {slide.file ? slide.file.name : 'اختر صورة'}
                  <input type="file" hidden accept="image/*" onChange={(e) => updateSlide(idx, 'file', e.target.files?.[0] ?? null)} />
                </Button>
                {slide.file && (
                  <Box sx={{ mt: 1 }}>
                    <img src={URL.createObjectURL(slide.file)} alt="" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                  </Box>
                )}
                <LinkSelect idx={idx} slide={slide} />
              </Box>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addSlide} sx={{ alignSelf: 'flex-start' }}>
              إضافة صورة أخرى
            </Button>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained" disabled={!slides.some((s) => s.file)}>
                إضافة
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
