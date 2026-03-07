import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { productsAPI, brandsAPI, categoriesAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    brand_id: '',
    category_id: '',
    description: '',
  });
  const [mainImage, setMainImage] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadBrandsAndCategories();
    if (isEdit) loadProduct();
  }, [id]);

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
      setForm({
        name: data.name,
        brand_id: data.brand_id,
        category_id: data.category_id,
        description: data.description || '',
      });
    } catch (err) {
      console.error(err);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand_id || !form.category_id) {
      alert('الاسم والعلامة التجارية والفئة مطلوبة');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('brand_id', form.brand_id);
      formData.append('category_id', form.category_id);
      formData.append('description', form.description);
      if (mainImage) formData.append('main_image', mainImage);
      images.forEach((img) => formData.append('images', img));

      if (isEdit) {
        await productsAPI.update(id, formData);
        alert('تم تحديث المنتج بنجاح');
      } else {
        const { data } = await productsAPI.create(formData);
        alert('تم إنشاء المنتج بنجاح');
        navigate(`/products/${data.id}/edit`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

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
            <TextField
              label="اسم المنتج"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>العلامة التجارية</InputLabel>
              <Select
                value={form.brand_id}
                label="العلامة التجارية"
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
              >
                {brands.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>الفئة</InputLabel>
              <Select
                value={form.category_id}
                label="الفئة"
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="الوصف"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                الصورة الرئيسية
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMainImage(e.target.files[0])}
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                صور إضافية
              </Typography>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files))}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
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
