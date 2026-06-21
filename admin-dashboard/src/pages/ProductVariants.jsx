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
  Chip,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SyncIcon from '@mui/icons-material/Sync';
import { productsAPI, variantsAPI, syncAPI, getImgBase } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';

function formatPrice(n) {
  return Number(n || 0).toLocaleString('ar-IQ');
}

function formatPricing(v) {
  const price = Number(v.price || 0);
  const original = Number(v.original_price || 0);
  const discount = Number(v.discount_percent || 0);
  if (discount > 0 && original > price) {
    return `${formatPrice(price)} د.ع (قبل: ${formatPrice(original)} · خصم ${discount}%)`;
  }
  return `${formatPrice(price)} د.ع`;
}

export default function ProductVariants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [form, setForm] = useState({
    shade_name: '',
    color_code: '#000000',
    barcode: '',
    sku: '',
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

  const handleSyncProduct = async () => {
    try {
      setSyncing(true);
      await syncAPI.refreshProduct(id);
      await loadProduct();
      setMessage({ type: 'success', text: 'تمت مزامنة الأسعار والمخزون من نظام المبيعات' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشلت المزامنة' });
    } finally {
      setSyncing(false);
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
        expiration_date: variant.expiration_date ? variant.expiration_date.split('T')[0] : '',
      });
    } else {
      setEditingVariant(null);
      setForm({
        shade_name: '',
        color_code: '#000000',
        barcode: '',
        sku: '',
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
    if (!form.barcode?.trim()) {
      setMessage({ type: 'error', text: 'الباركود مطلوب' });
      return;
    }
    try {
      const payload = {
        shade_name: form.shade_name,
        color_code: form.color_code,
        barcode: form.barcode.trim(),
        sku: form.sku || undefined,
        expiration_date: form.expiration_date || null,
      };
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);

      if (editingVariant) {
        await variantsAPI.update(editingVariant.id, payload, imageFile ? formData : null);
      } else {
        await variantsAPI.create(id, payload, formData);
      }
      await syncAPI.refreshProduct(id);
      setMessage({ type: 'success', text: 'تم الحفظ ومزامنة السعر والمخزون تلقائياً' });
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/products')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1 }}>العناصر الإضافية للمنتج: {product.name}</Typography>
        <Button variant="outlined" startIcon={syncing ? <CircularProgress size={18} /> : <SyncIcon />} onClick={handleSyncProduct} disabled={syncing}>
          مزامنة الآن
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          إضافة عنصر إضافي
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        السعر والمخزون ونسبة التخفيض تُجلب تلقائياً من نظام المبيعات حسب الباركود — لا يمكن تعديلها يدوياً.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>اسم العنصر / اللون</TableCell>
              <TableCell>اللون</TableCell>
              <TableCell>الباركود</TableCell>
              <TableCell>السعر</TableCell>
              <TableCell>المخزون</TableCell>
              <TableCell>آخر مزامنة</TableCell>
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
                <TableCell>{formatPricing(v)}</TableCell>
                <TableCell>
                  <Chip label={v.stock} color={v.stock <= 5 ? 'error' : 'default'} size="small" />
                </TableCell>
                <TableCell>{v.last_synced_at ? new Date(v.last_synced_at).toLocaleString('ar-IQ') : '-'}</TableCell>
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
            <TextField label="الباركود *" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} required fullWidth helperText="يُستخدم لجلب السعر والمخزون ونسبة التخفيض تلقائياً" />
            <TextField label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} fullWidth />
            {editingVariant && (
              <Typography variant="body2" color="text.secondary">
                {formatPricing(editingVariant)}
              </Typography>
            )}
            <TextField label="تاريخ الانتهاء" type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>صورة العنصر</Typography>
              {(editingVariant?.image || imageFile) && (
                <Box sx={{ mb: 1 }}>
                  <Box
                    component="img"
                    src={imageFile ? URL.createObjectURL(imageFile) : `${getImgBase()}${editingVariant?.image}`}
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
