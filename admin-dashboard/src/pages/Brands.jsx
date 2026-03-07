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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { brandsAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data } = await brandsAPI.getAll();
      setBrands(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تحميل العلامات التجارية' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setForm({ name: brand.name });
    } else {
      setEditingBrand(null);
      setForm({ name: '' });
    }
    setLogoFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (logoFile) formData.append('logo', logoFile);

      if (editingBrand) {
        await brandsAPI.update(editingBrand.id, formData);
        setMessage({ type: 'success', text: 'تم تحديث العلامة التجارية بنجاح' });
      } else {
        await brandsAPI.create(formData);
        setMessage({ type: 'success', text: 'تم إضافة العلامة التجارية بنجاح' });
      }
      setDialogOpen(false);
      loadBrands();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ' });
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">العلامات التجارية</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          إضافة علامة تجارية
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
              <TableCell>الشعار</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  {b.logo ? (
                    <Box component="img" src={`${API_URL.replace('/api', '')}${b.logo}`} sx={{ width: 50, height: 50, objectFit: 'contain' }} />
                  ) : (
                    <Box sx={{ width: 50, height: 50, bgcolor: 'grey.200' }} />
                  )}
                </TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell align="left">
                  <IconButton onClick={() => handleOpenDialog(b)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBrand ? 'تعديل العلامة التجارية' : 'إضافة علامة تجارية'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <TextField label="الاسم" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required fullWidth />
            <Button variant="outlined" component="label">
              {logoFile ? logoFile.name : 'اختر الشعار'}
              <input type="file" hidden accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
            </Button>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained">حفظ</Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
