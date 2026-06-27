import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Grid,
  Alert,
  Chip,
  Stack,
  alpha,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Inventory as ProductIcon,
  QrCode as BarcodeIcon,
  PhotoLibrary as PhotoIcon,
  Palette as VariantIcon,
  Search as SeoIcon,
  Star as StarIcon,
  TrendingUp as BestSellerIcon,
  NewReleases as NewIcon,
} from '@mui/icons-material';
import { productsAPI, brandsAPI, categoriesAPI, subcategoriesAPI, variantsAPI, syncAPI, getImgBase } from '../services/api';
import SyncedPricingBox from '../components/SyncedPricingBox';
import ImageUploadZone from '../components/ImageUploadZone';

const emptyElement = () => ({
  barcode: '', color_code: '#000000', shade_name: '', price: '', stock: '',
  original_price: '', discount_percent: '', expiration_date: '', imageFile: null,
});

const STATUS_OPTIONS = [
  { value: 'published', label: 'منشور', color: 'success' },
  { value: 'draft', label: 'مسودة', color: 'warning' },
  { value: 'archived', label: 'مؤرشف', color: 'default' },
];

function SectionCard({ title, icon: Icon, children, accent = '#5e35b1' }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden', mb: 3 }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(accent, 0.08), borderBottom: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1 }}>
        {Icon && <Icon sx={{ color: accent, fontSize: 22 }} />}
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState({
    name: '', brand_id: '', category_id: '', subcategory_id: '', description: '',
    barcode: '', price: '', stock: '', original_price: '', discount_percent: '',
    status: 'published', is_featured: false, is_best_seller: false, new_until: '',
    sort_order: '', meta_title: '', meta_description: '', tags: '',
  });
  const [mainImage, setMainImage] = useState(null);
  const [images, setImages] = useState([]);
  const [elements, setElements] = useState([]);
  const [existingMainImage, setExistingMainImage] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBrandsAndCategories();
    if (isEdit) loadProduct();
  }, [id]);

  useEffect(() => {
    if (form.category_id) {
      subcategoriesAPI.getAll({ category_id: form.category_id })
        .then((r) => setSubcategories(r.data || []))
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
      setForm((f) => ({ ...f, subcategory_id: '' }));
    }
  }, [form.category_id]);

  const loadBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([brandsAPI.getAll(), categoriesAPI.getAll()]);
      setBrands(brandsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const { data } = await productsAPI.getById(id);
      const vars = data.variants || [];
      const hasSingle = vars.length === 1 && (vars[0].shade_name === 'وحدة واحدة' || vars[0].shade_name === 'عنصر إضافي');
      setForm({
        name: data.name,
        brand_id: data.brand_id,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id || '',
        description: data.description || '',
        barcode: data.barcode || '',
        price: hasSingle && vars[0] ? String(vars[0].price) : '',
        stock: hasSingle && vars[0] ? String(vars[0].stock || 0) : '',
        original_price: hasSingle && vars[0] ? String(vars[0].original_price || '') : '',
        discount_percent: hasSingle && vars[0] ? String(vars[0].discount_percent || 0) : '',
        status: data.status || 'published',
        is_featured: !!data.is_featured,
        is_best_seller: !!data.is_best_seller,
        new_until: data.new_until ? data.new_until.slice(0, 10) : '',
        sort_order: data.sort_order ?? '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
      });
      setExistingMainImage(data.main_image || null);
      setExistingImages(data.images || []);
      setElements(hasSingle ? [] : vars.map((v) => ({
        id: v.id,
        barcode: v.barcode || '',
        color_code: v.color_code || '#000000',
        shade_name: v.shade_name || '',
        price: String(v.price),
        stock: String(v.stock || 0),
        original_price: String(v.original_price || ''),
        discount_percent: String(v.discount_percent || 0),
        expiration_date: v.expiration_date ? v.expiration_date.slice(0, 10) : '',
        imageFile: null,
        existingImage: v.image,
      })));
    } catch (err) {
      console.error(err);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const syncBarcodeFields = async (barcode, apply) => {
    if (!barcode?.trim()) return;
    try {
      const { data } = await syncAPI.refreshBarcode(barcode.trim());
      const item = data?.item;
      if (item && apply) {
        apply({ price: item.price, stock: item.stock, original_price: item.originalPrice, discount_percent: item.discountPercent });
      }
    } catch (_) {}
  };

  const addElement = () => setElements([...elements, { ...emptyElement() }]);
  const removeElement = (i) => setElements(elements.filter((_, idx) => idx !== i));
  const updateElement = (i, field, value) => {
    const next = [...elements];
    next[i] = { ...next[i], [field]: value };
    setElements(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.brand_id || !form.category_id) {
      setError('الاسم والعلامة التجارية والفئة مطلوبة');
      return;
    }
    const hasElements = elements.length > 0;
    if (!hasElements && !form.barcode.trim()) {
      setError('أدخل باركود المنتج أو أضف ظلال/عناصر إضافية');
      return;
    }
    if (hasElements && elements.find((el) => !el.barcode?.trim())) {
      setError('الباركود مطلوب لكل عنصر إضافي');
      return;
    }

    const variantPayload = (el) => ({
      shade_name: el.shade_name || el.color_code,
      color_code: el.color_code,
      barcode: el.barcode,
      expiration_date: el.expiration_date || null,
    });

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('brand_id', form.brand_id);
      formData.append('category_id', form.category_id);
      formData.append('subcategory_id', form.subcategory_id || '');
      formData.append('description', form.description);
      formData.append('barcode', hasElements ? '' : (form.barcode?.trim() || ''));
      formData.append('status', form.status);
      formData.append('is_featured', form.is_featured ? '1' : '0');
      formData.append('is_best_seller', form.is_best_seller ? '1' : '0');
      formData.append('new_until', form.new_until || '');
      formData.append('meta_title', form.meta_title || '');
      formData.append('meta_description', form.meta_description || '');
      formData.append('tags', (form.tags || '').split(/[،,]/).map((t) => t.trim()).filter(Boolean).join(','));
      if (form.sort_order !== '' && form.sort_order != null) formData.append('sort_order', form.sort_order);
      if (mainImage) formData.append('main_image', mainImage);
      images.forEach((img) => formData.append('images', img));

      if (isEdit) {
        await productsAPI.update(id, formData);
        if (hasElements) {
          for (const el of elements) {
            const fd = new FormData();
            if (el.imageFile) fd.append('image', el.imageFile);
            if (el.id) await variantsAPI.update(el.id, variantPayload(el), el.imageFile ? fd : null);
            else await variantsAPI.create(id, variantPayload(el), fd);
          }
        } else {
          const { data: productData } = await productsAPI.getById(id);
          for (const v of productData.variants || []) await variantsAPI.delete(v.id);
          await variantsAPI.create(id, { shade_name: 'وحدة واحدة', barcode: form.barcode.trim() });
        }
        await syncAPI.refreshProduct(id);
        setSnack('تم تحديث المنتج ومزامنة الأسعار');
      } else {
        const { data } = await productsAPI.create(formData);
        const productId = data.id;
        if (hasElements) {
          for (const el of elements) {
            const fd = new FormData();
            if (el.imageFile) fd.append('image', el.imageFile);
            await variantsAPI.create(String(productId), variantPayload(el), fd);
          }
          await syncAPI.refreshProduct(productId);
          navigate(`/products/${productId}/variants`);
        } else {
          await variantsAPI.create(String(productId), { shade_name: 'وحدة واحدة', barcode: form.barcode.trim() });
          await syncAPI.refreshProduct(productId);
          navigate('/products');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit && !form.name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasElements = elements.length > 0;

  return (
    <Box sx={{ direction: 'rtl', pb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon sx={{ transform: 'scaleX(-1)' }} />} onClick={() => navigate('/products')} sx={{ borderRadius: 2 }}>
            رجوع
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800}>{isEdit ? 'تعديل المنتج' : 'منتج جديد'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? `تعديل #${id}` : 'أضيفي منتجاً جديداً للمتجر'}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/products')}>إلغاء</Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={loading}
            onClick={handleSubmit}
            sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}
          >
            {isEdit ? 'حفظ التعديلات' : 'إنشاء المنتج'}
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Box component="form" onSubmit={handleSubmit}>
            <SectionCard title="المعلومات الأساسية" icon={ProductIcon}>
              <Stack spacing={2.5}>
                <TextField
                  label="اسم المنتج"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  fullWidth
                  placeholder="مثال: كريم أساس طويل الثبات"
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>العلامة التجارية</InputLabel>
                      <Select value={form.brand_id} label="العلامة التجارية" onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                        {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>الفئة</InputLabel>
                      <Select value={form.category_id} label="الفئة" onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}>
                        {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!form.category_id}>
                      <InputLabel>الفئة الثانوية</InputLabel>
                      <Select
                        value={form.category_id ? form.subcategory_id : ''}
                        label="الفئة الثانوية"
                        onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                      >
                        <MenuItem value="">{form.category_id ? '— لا يوجد —' : '— اختر الفئة أولاً —'}</MenuItem>
                        {subcategories.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="التسلسل"
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                      fullWidth
                      placeholder="رقم أقل = ظهور أولاً"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
                <TextField
                  label="الوصف"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  multiline
                  rows={5}
                  fullWidth
                  placeholder="وصف تفصيلي للمنتج..."
                />
              </Stack>
            </SectionCard>

            {!hasElements && (
              <SectionCard title="الباركود والأسعار" icon={BarcodeIcon} accent="#0288d1">
                <Alert severity="info" sx={{ mb: 2 }}>السعر والمخزون ونسبة التخفيض تُجلب تلقائياً من نظام المبيعات عند حفظ الباركود</Alert>
                <TextField
                  label="باركود المنتج"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  onBlur={() => syncBarcodeFields(form.barcode, (synced) => setForm((f) => ({ ...f, ...synced })))}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
                <SyncedPricingBox data={form} />
              </SectionCard>
            )}

            <SectionCard title="الصور" icon={PhotoIcon} accent="#E85D7A">
              <ImageUploadZone
                mainImage={mainImage}
                onMainChange={setMainImage}
                existingMain={existingMainImage}
                onClearExistingMain={() => setExistingMainImage(null)}
                extraImages={images}
                onExtraChange={setImages}
                existingExtras={existingImages}
              />
            </SectionCard>

            <SectionCard title="الظلال والعناصر الإضافية" icon={VariantIcon} accent="#7b1fa2">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                لكل ظل: باركود، لون، صورة — السعر والمخزون يُجلبان تلقائياً. إذا أضفتِ ظلالاً، يُلغى باركود المنتج الواحد.
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addElement} sx={{ mb: 2, borderRadius: 2 }}>
                إضافة ظل / عنصر
              </Button>
              <Stack spacing={2}>
                {elements.map((el, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: alpha('#7b1fa2', 0.25), bgcolor: alpha('#7b1fa2', 0.02) }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: el.color_code, border: '2px solid white', boxShadow: 1 }} />
                        <Typography fontWeight={700}>ظل {i + 1}</Typography>
                        {el.shade_name && <Chip size="small" label={el.shade_name} />}
                      </Box>
                      <IconButton size="small" color="error" onClick={() => removeElement(i)}><DeleteIcon /></IconButton>
                    </Box>
                    <Grid container spacing={2} alignItems="flex-start">
                      {(el.existingImage || el.imageFile) && (
                        <Grid item xs={12} sm="auto">
                          <Box
                            component="img"
                            src={el.imageFile ? URL.createObjectURL(el.imageFile) : `${getImgBase()}${el.existingImage}`}
                            alt=""
                            sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField label="اسم الظل" value={el.shade_name} onChange={(e) => updateElement(i, 'shade_name', e.target.value)} fullWidth size="small" placeholder="أحمر قاني" />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField label="الباركود *" value={el.barcode} onChange={(e) => updateElement(i, 'barcode', e.target.value)} onBlur={() => syncBarcodeFields(el.barcode, (synced) => { const next = [...elements]; next[i] = { ...next[i], ...synced }; setElements(next); })} required fullWidth size="small" />
                      </Grid>
                      <Grid item xs={6} sm={3} md={2}>
                        <TextField label="اللون" type="color" value={el.color_code} onChange={(e) => updateElement(i, 'color_code', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                      </Grid>
                      <Grid item xs={6} sm={3} md={2}>
                        <TextField label="Hex" value={el.color_code} onChange={(e) => updateElement(i, 'color_code', e.target.value)} fullWidth size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField label="تاريخ الصلاحية" type="date" value={el.expiration_date} onChange={(e) => updateElement(i, 'expiration_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button variant="outlined" component="label" fullWidth size="small" sx={{ height: 40 }}>
                          {el.imageFile ? 'تغيير الصورة' : 'صورة الظل'}
                          <input type="file" hidden accept="image/*" onChange={(e) => updateElement(i, 'imageFile', e.target.files[0])} />
                        </Button>
                      </Grid>
                      <Grid item xs={12}>
                        <SyncedPricingBox data={el} compact />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                {!elements.length && (
                  <Box sx={{ textAlign: 'center', py: 3, borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}>
                    <VariantIcon sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">لا توجد ظلال — استخدمي باركود المنتج الواحد أعلاه أو أضيفي ظلالاً</Typography>
                  </Box>
                )}
              </Stack>
            </SectionCard>

            <SectionCard title="SEO والوسوم" icon={SeoIcon} accent="#455a64">
              <Stack spacing={2}>
                <TextField label="وسوم (مفصولة بفاصلة)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} fullWidth placeholder="مضاد للبكتيريا، مناسب للبشرة الجافة" />
                <TextField label="عنوان Meta" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} fullWidth />
                <TextField label="وصف Meta" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} multiline rows={3} fullWidth />
              </Stack>
            </SectionCard>
          </Box>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.200',
              overflow: 'hidden',
              position: { lg: 'sticky' },
              top: 24,
            }}
          >
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha('#5e35b1', 0.08), borderBottom: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="subtitle1" fontWeight={700}>النشر والإعدادات</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>حالة المنتج</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2.5 }}>
                {STATUS_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    color={form.status === opt.value ? opt.color : 'default'}
                    variant={form.status === opt.value ? 'filled' : 'outlined'}
                    onClick={() => setForm({ ...form, status: opt.value })}
                    sx={{ fontWeight: 600, cursor: 'pointer' }}
                  />
                ))}
              </Stack>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <FormControlLabel
                  control={<Switch checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} color="secondary" />}
                  label={(
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon sx={{ fontSize: 18, color: form.is_featured ? '#E85D7A' : 'grey.400' }} />
                      <Typography variant="body2" fontWeight={600}>منتج مميز</Typography>
                    </Box>
                  )}
                />
                <FormControlLabel
                  control={<Switch checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} color="success" />}
                  label={(
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BestSellerIcon sx={{ fontSize: 18, color: form.is_best_seller ? '#2e7d32' : 'grey.400' }} />
                      <Typography variant="body2" fontWeight={600}>الأكثر مبيعاً</Typography>
                    </Box>
                  )}
                />
              </Paper>

              <TextField
                label="عرض كـ جديد حتى"
                type="date"
                value={form.new_until}
                onChange={(e) => setForm({ ...form, new_until: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                helperText="شارة «جديد» حتى هذا التاريخ"
                sx={{ mb: 2.5 }}
              />

              <Alert severity="info" icon={<NewIcon />} sx={{ mb: 2.5, fontSize: 13 }}>
                {hasElements
                  ? `${elements.length} ظل/عنصر — الأسعار تُزامَن تلقائياً`
                  : 'منتج بباركود واحد — أضيفي ظلالاً للمنتجات متعددة الألوان'}
              </Alert>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={loading}
                onClick={handleSubmit}
                sx={{ borderRadius: 2, py: 1.25, bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}
              >
                {isEdit ? 'حفظ التعديلات' : 'إنشاء المنتج'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
