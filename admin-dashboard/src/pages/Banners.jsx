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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { bannersAPI } from '../services/api';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

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
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBanners();
  }, []);

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
      });
    } else {
      setEditingBanner(null);
      setForm({
        title: '',
        link_type: 'none',
        link_value: '',
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
      formData.append('link_type', form.link_type);
      formData.append('link_value', form.link_value);
      formData.append('sort_order', form.sort_order);
      formData.append('active', form.active ? 1 : 0);
      if (imageFile) formData.append('image', imageFile);

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
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
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
                  {b.image ? (
                    <Box
                      component="img"
                      src={`${API_BASE}${b.image}`}
                      sx={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 1 }}
                    />
                  ) : (
                    <Box sx={{ width: 80, height: 50, bgcolor: 'grey.200', borderRadius: 1 }} />
                  )}
                </TableCell>
                <TableCell>{b.title || '-'}</TableCell>
                <TableCell>
                  {b.link_type === 'product' && `منتج #${b.link_value}`}
                  {b.link_type === 'category' && `فئة #${b.link_value}`}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <TextField
              label="العنوان"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>نوع الرابط</InputLabel>
              <Select
                value={form.link_type}
                label="نوع الرابط"
                onChange={(e) => setForm({ ...form, link_type: e.target.value })}
              >
                <MenuItem value="none">بدون رابط</MenuItem>
                <MenuItem value="product">منتج</MenuItem>
                <MenuItem value="category">فئة</MenuItem>
                <MenuItem value="url">رابط خارجي</MenuItem>
              </Select>
            </FormControl>
            {(form.link_type === 'product' || form.link_type === 'category') && (
              <TextField
                label={form.link_type === 'product' ? 'معرف المنتج' : 'معرف الفئة'}
                type="number"
                value={form.link_value}
                onChange={(e) => setForm({ ...form, link_value: e.target.value })}
                fullWidth
              />
            )}
            {form.link_type === 'url' && (
              <TextField
                label="الرابط"
                value={form.link_value}
                onChange={(e) => setForm({ ...form, link_value: e.target.value })}
                fullWidth
              />
            )}
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
              {imageFile ? imageFile.name : editingBanner?.image ? 'تغيير الصورة' : 'اختر صورة'}
              <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            </Button>
            {!editingBanner && !imageFile && (
              <Typography variant="caption" color="error">الصورة مطلوبة للبانر الجديد</Typography>
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
