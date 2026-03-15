import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  Divider,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { productsAPI, brandsAPI, categoriesAPI, subcategoriesAPI, variantsAPI, IMG_BASE } from '../services/api';

const emptyElement = () => ({ barcode: '', color_code: '#000000', shade_name: '', price: '', stock: '', expiration_date: '', imageFile: null });

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    brand_id: '',
    category_id: '',
    subcategory_id: '',
    description: '',
    barcode: '',
    price: '',
    stock: '',
    status: 'published',
    is_featured: false,
    is_best_seller: false,
    new_until: '',
    sort_order: '',
    meta_title: '',
    meta_description: '',
    tags: '',
  });
  const [mainImage, setMainImage] = useState(null);
  const [images, setImages] = useState([]);
  const [elements, setElements] = useState([]);
  const [existingMainImage, setExistingMainImage] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

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
      const [brandsRes, categoriesRes] = await Promise.all([
        brandsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
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
      const hasSingleSimpleVariant = vars.length === 1 && (vars[0].shade_name === 'وحدة واحدة' || vars[0].shade_name === 'عنصر إضافي');
      setForm({
        name: data.name,
        brand_id: data.brand_id,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id || '',
        description: data.description || '',
        barcode: data.barcode || '',
        price: hasSingleSimpleVariant && vars[0] ? String(vars[0].price) : '',
        stock: hasSingleSimpleVariant && vars[0] ? String(vars[0].stock || 0) : '',
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
      setElements(hasSingleSimpleVariant ? [] : vars.map((v) => ({
        id: v.id,
        barcode: v.barcode || '',
        color_code: v.color_code || '#000000',
        shade_name: v.shade_name || '',
        price: String(v.price),
        stock: String(v.stock || 0),
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

  const addElement = () => setElements([...elements, { ...emptyElement(), imageFile: null }]);
  const removeElement = (i) => setElements(elements.filter((_, idx) => idx !== i));
  const updateElement = (i, field, value) => {
    const next = [...elements];
    if (field === 'imageFile') next[i] = { ...next[i], imageFile: value };
    else next[i] = { ...next[i], [field]: value };
    setElements(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand_id || !form.category_id) {
      alert('الاسم والعلامة التجارية والفئة مطلوبة');
      return;
    }
    const hasElements = elements.length > 0;
    if (!hasElements) {
      if (!form.barcode.trim()) {
        alert('أدخل باركود المنتج أو أضف عناصر إضافية مع باركود لكل عنصر');
        return;
      }
      if (!form.price || Number(form.price) <= 0) {
        alert('السعر مطلوب ويجب أن يكون أكبر من صفر للمنتجات بدون عناصر إضافية');
        return;
      }
    }
    if (hasElements) {
      const noBarcode = elements.find((el) => !el.barcode?.trim());
      if (noBarcode) {
        alert('الباركود مطلوب لكل عنصر إضافي');
        return;
      }
      const noPrice = elements.find((el) => !el.price || Number(el.price) <= 0);
      if (noPrice) {
        alert('السعر مطلوب ويجب أن يكون أكبر من صفر لكل عنصر إضافي');
        return;
      }
    }

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
          const variantData = (el) => ({ shade_name: el.shade_name || el.color_code, color_code: el.color_code, barcode: el.barcode, price: el.price, stock: el.stock || 0, expiration_date: el.expiration_date || null });
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const fd = new FormData();
            if (el.imageFile) fd.append('image', el.imageFile);
            if (el.id) await variantsAPI.update(el.id, variantData(el), el.imageFile ? fd : null);
            else await variantsAPI.create(id, variantData(el), fd);
          }
        } else {
          const { data: productData } = await productsAPI.getById(id);
          for (const v of productData.variants || []) {
            await variantsAPI.delete(v.id);
          }
          await variantsAPI.create(id, { shade_name: 'وحدة واحدة', barcode: form.barcode.trim(), price: form.price, stock: form.stock || 0 });
        }
        alert('تم تحديث المنتج بنجاح');
      } else {
        const { data } = await productsAPI.create(formData);
        const productId = data.id;
        if (hasElements) {
          const variantData = (el) => ({ shade_name: el.shade_name || el.color_code, color_code: el.color_code, barcode: el.barcode, price: el.price, stock: el.stock || 0, expiration_date: el.expiration_date || null });
          for (const el of elements) {
            const fd = new FormData();
            if (el.imageFile) fd.append('image', el.imageFile);
            await variantsAPI.create(String(productId), variantData(el), fd);
          }
          alert('تم إنشاء المنتج بنجاح');
          navigate(`/products/${productId}/variants`);
        } else {
          await variantsAPI.create(String(productId), { shade_name: 'وحدة واحدة', barcode: form.barcode.trim(), price: form.price, stock: form.stock || 0 });
          alert('تم إنشاء المنتج بنجاح');
          navigate('/products');
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit && !form.name) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/products')} sx={{ mb: 2 }}>
        رجوع
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {isEdit ? 'تعديل المنتج' : 'منتج جديد'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="اسم المنتج" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <FormControl fullWidth required>
              <InputLabel>العلامة التجارية</InputLabel>
              <Select value={form.brand_id} label="العلامة التجارية" onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                {brands.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>الفئة</InputLabel>
              <Select value={form.category_id} label="الفئة" onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!form.category_id}>
              <InputLabel>الفئة الثانوية (اختياري)</InputLabel>
              <Select
                value={form.category_id ? form.subcategory_id : ''}
                label="الفئة الثانوية (اختياري)"
                onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                displayEmpty
              >
                <MenuItem value="">
                  {form.category_id ? '— لا يوجد —' : '— اختر الفئة أولاً —'}
                </MenuItem>
                {subcategories.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {elements.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>سعر ومخزون المنتج (بدون عناصر إضافية)</Typography>
                <TextField
                  label="باركود المنتج"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  fullWidth
                  required
                  helperText="للمنتجات التي لا تحتوي على ألوان أو تشكيلات متعددة"
                />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="سعر المنتج (د.ع)"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ minWidth: 160 }}
                  />
                  <TextField
                    label="المخزون"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    inputProps={{ min: 0 }}
                    sx={{ minWidth: 140 }}
                    helperText="اختياري"
                  />
                </Box>
              </Box>
            )}

            <TextField label="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={4} fullWidth />

            <FormControl fullWidth>
              <InputLabel>حالة المنتج</InputLabel>
              <Select value={form.status} label="حالة المنتج" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="draft">مسودة</MenuItem>
                <MenuItem value="published">منشور</MenuItem>
                <MenuItem value="archived">مؤرشف</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Switch checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />}
                label="منتج مميز"
              />
              <FormControlLabel
                control={<Switch checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} />}
                label="الأكثر مبيعاً"
              />
            </Box>
            <TextField
              label="عرض كـ جديد حتى (اختياري)"
              type="date"
              value={form.new_until}
              onChange={(e) => setForm({ ...form, new_until: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="سيظهر شارة جديد حتى هذا التاريخ. اتركه فارغاً لإظهارها حسب تاريخ الإنشاء (30 يوم)"
            />
            <TextField label="التسلسل" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} fullWidth placeholder="رقم أقل = ظهور أولاً ضمن البراند والفئة" inputProps={{ min: 0 }} />
            <TextField label="وسوم (مفصولة بفاصلة)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} fullWidth placeholder="مثلاً: مضاد للبكتيريا، مناسب للبشرة الجافة" helperText="للبحث والتصفية" />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>حقول SEO</Typography>
            <TextField label="عنوان Meta (للمحركات)" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} fullWidth />
            <TextField label="وصف Meta (للمحركات)" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} multiline rows={2} fullWidth />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                الصورة الرئيسية
              </Typography>
              {(existingMainImage || mainImage) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Box
                    component="img"
                    src={mainImage ? URL.createObjectURL(mainImage) : `${IMG_BASE}${existingMainImage}`}
                    alt=""
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                  />
                </Box>
              )}
              <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files[0])} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                صور إضافية
              </Typography>
              {isEdit && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    صور المنتج الإضافية الحالية:
                  </Typography>
                  {existingImages?.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {existingImages.map((img, i) => (
                      <Box
                        key={`e-${i}`}
                        component="img"
                        src={`${IMG_BASE}${img}`}
                        alt={`صورة ${i + 1}`}
                        sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      لا توجد صور إضافية حالياً
                    </Typography>
                  )}
                </Box>
              )}
              {(images?.length > 0) && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    صور جديدة (سيتم إضافتها عند الحفظ):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <Box
                        key={`n-${i}`}
                        component="img"
                        src={URL.createObjectURL(img)}
                        alt={`جديد ${i + 1}`}
                        sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid #8bc34a' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files))} />
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight={600}>عناصر إضافية</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              لكل عنصر: باركود، صورة، لون، سعر، مخزون (اختياري للمنتجات ذات التشكيلة الواحدة)
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addElement} sx={{ alignSelf: 'flex-start' }}>
              إضافة عنصر إضافي
            </Button>

            {elements.map((el, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>عنصر {i + 1}</Typography>
                  <IconButton size="small" color="error" onClick={() => removeElement(i)}><DeleteIcon /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                  {(el.existingImage || el.imageFile) && (
                    <Box sx={{ flexShrink: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>صورة العنصر:</Typography>
                      <Box
                        component="img"
                        src={el.imageFile ? URL.createObjectURL(el.imageFile) : `${IMG_BASE}${el.existingImage}`}
                        alt=""
                        sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                      />
                    </Box>
                  )}
                  <TextField label="اسم الظل" value={el.shade_name} onChange={(e) => updateElement(i, 'shade_name', e.target.value)} size="small" sx={{ minWidth: 140 }} placeholder="مثل: أحمر قاني" />
                  <TextField label="الباركود *" value={el.barcode} onChange={(e) => updateElement(i, 'barcode', e.target.value)} required size="small" sx={{ minWidth: 140 }} />
                  <TextField label="اللون" type="color" value={el.color_code} onChange={(e) => updateElement(i, 'color_code', e.target.value)} size="small" sx={{ width: 60, height: 40 }} />
                  <TextField label="كود اللون" value={el.color_code} onChange={(e) => updateElement(i, 'color_code', e.target.value)} size="small" sx={{ width: 120 }} />
                  <TextField label="السعر" type="number" value={el.price} onChange={(e) => updateElement(i, 'price', e.target.value)} required size="small" sx={{ width: 100 }} />
                  <TextField label="المخزون" type="number" value={el.stock} onChange={(e) => updateElement(i, 'stock', e.target.value)} size="small" sx={{ width: 80 }} />
                  <TextField label="تاريخ الصلاحية" type="date" value={el.expiration_date} onChange={(e) => updateElement(i, 'expiration_date', e.target.value)} InputLabelProps={{ shrink: true }} size="small" sx={{ width: 160 }} />
                  <Button size="small" variant="outlined" component="label" sx={{ alignSelf: 'flex-end' }}>
                    {el.imageFile ? el.imageFile.name : el.existingImage ? 'تغيير الصورة' : 'إضافة صورة'}
                    <input type="file" hidden accept="image/*" onChange={(e) => updateElement(i, 'imageFile', e.target.files[0])} />
                  </Button>
                </Box>
              </Paper>
            ))}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />} disabled={loading}>
                {isEdit ? 'حفظ التعديلات' : 'إنشاء المنتج'}
              </Button>
              <Button onClick={() => navigate('/products')}>إلغاء</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
