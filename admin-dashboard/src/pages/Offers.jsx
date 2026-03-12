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
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { offersAPI } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';

function productIdsToFormValue(productIds) {
  if (!productIds) return '';
  try {
    const parsed = typeof productIds === 'string' ? JSON.parse(productIds || '[]') : productIds;
    return Array.isArray(parsed) ? parsed.join(', ') : String(productIds).replace(/[\[\]\"]/g, '').replace(/,/g, ', ');
  } catch (_) {
    return String(productIds).replace(/[\[\]\"]/g, '').replace(/,/g, ', ');
  }
}

function formValueToProductIdsStr(val) {
  if (!val || !String(val).trim()) return '[]';
  const ids = String(val)
    .split(/[\s,]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  return JSON.stringify(ids);
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState({
    title: '',
    discount_label: '',
    product_ids: '',
    sort_order: 0,
    active: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data } = await offersAPI.getAll();
      setOffers(data || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تحميل العروض' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setForm({
        title: offer.title || '',
        discount_label: offer.discount_label || '',
        product_ids: productIdsToFormValue(offer.product_ids),
        sort_order: offer.sort_order || 0,
        active: offer.active !== undefined ? offer.active : 1,
      });
    } else {
      setEditingOffer(null);
      setForm({
        title: '',
        discount_label: '',
        product_ids: '',
        sort_order: 0,
        active: 1,
      });
    }
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('discount_label', form.discount_label);
      formData.append('product_ids', formValueToProductIdsStr(form.product_ids));
      formData.append('sort_order', form.sort_order);
      formData.append('active', form.active ? 1 : 0);
      if (imageFile) formData.append('image', imageFile);

      if (editingOffer) {
        await offersAPI.update(editingOffer.id, formData);
        setMessage({ type: 'success', text: 'تم تحديث العرض بنجاح' });
      } else {
        await offersAPI.create(formData);
        setMessage({ type: 'success', text: 'تم إضافة العرض بنجاح' });
      }
      setDialogOpen(false);
      loadOffers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    try {
      await offersAPI.delete(id);
      setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
      loadOffers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        العروض
      </Typography>
      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        إضافة عرض
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>العنوان</TableCell>
              <TableCell>تسمية التخفيض</TableCell>
              <TableCell>معرفات المنتجات</TableCell>
              <TableCell>الترتيب</TableCell>
              <TableCell>نشط</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <ImageDisplay src={o.image} width={96} height={56} fit="cover" />
                </TableCell>
                <TableCell>{o.title || '-'}</TableCell>
                <TableCell>{o.discount_label || '-'}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap title={productIdsToFormValue(o.product_ids)}>
                    {productIdsToFormValue(o.product_ids) || '-'}
                  </Typography>
                </TableCell>
                <TableCell>{o.sort_order}</TableCell>
                <TableCell>{o.active ? 'نعم' : 'لا'}</TableCell>
                <TableCell align="left">
                  <IconButton size="small" onClick={() => handleOpenDialog(o)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(o.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <TextField
              label="عنوان العرض"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="تسمية التخفيض (مثال: خصم 30%)"
              value={form.discount_label}
              onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
              fullWidth
              placeholder="اختياري"
            />
            <TextField
              label="معرفات المنتجات"
              value={form.product_ids}
              onChange={(e) => setForm({ ...form, product_ids: e.target.value })}
              fullWidth
              placeholder="1, 2, 3 أو 1 2 3"
              helperText="أدخل معرفات المنتجات مفصولة بفاصلة أو مسافة"
            />
            <TextField
              label="الترتيب"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Switch
                checked={!!form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
              />
              <Typography>نشط</Typography>
            </Box>
            <Button variant="outlined" component="label">
              {imageFile ? imageFile.name : editingOffer?.image ? 'تغيير الصورة' : 'اختر صورة'}
              <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            </Button>
            {!editingOffer && !imageFile && (
              <Typography variant="caption" color="error">
                الصورة مطلوبة للعرض الجديد
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained" disabled={!editingOffer && !imageFile}>
                {editingOffer ? 'تحديث' : 'إضافة'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
