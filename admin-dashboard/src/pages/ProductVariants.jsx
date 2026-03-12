import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Chip,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { productsAPI, variantsAPI } from '../services/api';

import { IMG_BASE } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';

export default function ProductVariants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [form, setForm] = useState({
    shade_name: '',
    color_code: '#000000',
    barcode: '',
    sku: '',
    price: '',
    stock: '',
    expiration_date: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data } = await productsAPI.getById(id);
      setProduct(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تحميل المنتج' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (variant = null) => {
    if (variant) {
      setEditingVariant(variant);
      setForm({
        shade_name: variant.shade_name,
        color_code: variant.color_code || '#000000',
        barcode: variant.barcode || '',
        sku: variant.sku || '',
        price: variant.price,
        stock: variant.stock,
        expiration_date: variant.expiration_date ? variant.expiration_date.split('T')[0] : '',
      });
    } else {
      setEditingVariant(null);
      setForm({
        shade_name: '',
        color_code: '#000000',
        barcode: '',
        sku: '',
        price: '',
        stock: '',
        expiration_date: '',
      });
    }
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVariant(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== '') formData.append(key, form[key]);
      });
      if (imageFile) formData.append('image', imageFile);

      if (editingVariant) {
        await variantsAPI.update(editingVariant.id, form, imageFile ? formData : null);
        setMessage({ type: 'success', text: 'تم تحديث العنصر بنجاح' });
      } else {
        await variantsAPI.create(id, form, formData);
        setMessage({ type: 'success', text: 'تم إضافة العنصر بنجاح' });
      }
      handleCloseDialog();
      loadProduct();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  const handleDelete = async (variantId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    try {
      await variantsAPI.delete(variantId);
      setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
      loadProduct();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (!product) return <Alert severity="error">المنتج غير موجود</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/products')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">العناصر الإضافية للمنتج: {product.name}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          إضافة عنصر إضافي
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>اسم العنصر / اللون</TableCell>
              <TableCell>اللون</TableCell>
              <TableCell>الباركود</TableCell>
              <TableCell>السعر (د.ع)</TableCell>
              <TableCell>المخزون</TableCell>
              <TableCell>تاريخ الانتهاء</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(product.variants || []).map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <ImageDisplay src={v.image} size="md" fit="cover" />
                </TableCell>
                <TableCell>{v.shade_name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: v.color_code || '#000', border: '1px solid #ccc' }} />
                    {v.color_code}
                  </Box>
                </TableCell>
                <TableCell>{v.barcode || '-'}</TableCell>
                <TableCell>{Number(v.price).toLocaleString('ar-IQ')}</TableCell>
                <TableCell>
                  <Chip label={v.stock} color={v.stock <= 5 ? 'error' : 'default'} size="small" />
                </TableCell>
                <TableCell>{v.expiration_date ? new Date(v.expiration_date).toLocaleDateString('ar-IQ') : '-'}</TableCell>
                <TableCell align="left">
                  <IconButton size="small" onClick={() => handleOpenDialog(v)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(v.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVariant ? 'تعديل العنصر الإضافي' : 'إضافة عنصر إضافي جديد'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <TextField label="اسم العنصر / اللون" value={form.shade_name} onChange={(e) => setForm({ ...form, shade_name: e.target.value })} required fullWidth />
            <TextField label="كود اللون" type="color" value={form.color_code} onChange={(e) => setForm({ ...form, color_code: e.target.value })} sx={{ width: 80, height: 40 }} />
            <TextField label="كود اللون (hex)" value={form.color_code} onChange={(e) => setForm({ ...form, color_code: e.target.value })} fullWidth />
            <TextField label="الباركود *" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} required fullWidth helperText="مطلوب لكل منتج حتى ذو اللون الواحد" />
            <TextField label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} fullWidth />
            <TextField label="السعر" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required fullWidth />
            <TextField label="المخزون" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} fullWidth />
            <TextField label="تاريخ الانتهاء" type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>صورة العنصر</Typography>
              {(editingVariant?.image || imageFile) && (
                <Box sx={{ mb: 1 }}>
                  <Box
                    component="img"
                    src={imageFile ? URL.createObjectURL(imageFile) : `${IMG_BASE}${editingVariant?.image}`}
                    alt=""
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                  />
                </Box>
              )}
              <Button type="button" variant="outlined" component="label">
                {imageFile ? imageFile.name : editingVariant?.image ? 'تغيير الصورة' : 'اختر صورة'}
                <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseDialog}>إلغاء</Button>
              <Button type="submit" variant="contained">
                {editingVariant ? 'تحديث' : 'إضافة'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
