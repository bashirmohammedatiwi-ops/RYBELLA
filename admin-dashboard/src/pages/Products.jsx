import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Palette as VariantsIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { productsAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });

  useEffect(() => {
    loadProducts();
  }, [search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await productsAPI.getAll({ search: search || undefined });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;
    try {
      await productsAPI.delete(deleteDialog.product.id);
      setProducts(products.filter((p) => p.id !== deleteDialog.product.id));
      setDeleteDialog({ open: false, product: null });
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('ar-IQ').format(price) + ' د.ع';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          المنتجات
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products/new')}
          >
            منتج جديد
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Typography>جاري التحميل...</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الصورة</TableCell>
                    <TableCell>الاسم</TableCell>
                    <TableCell>العلامة التجارية</TableCell>
                    <TableCell>الفئة</TableCell>
                    <TableCell>السعر</TableCell>
                    <TableCell>الظلال</TableCell>
                    <TableCell align="center">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Box
                          component="img"
                          src={
                            product.main_image
                              ? `${API_URL}${product.main_image}`
                              : '/placeholder.png'
                          }
                          alt={product.name}
                          sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect fill="%23ddd" width="50" height="50"/></svg>';
                          }}
                        />
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.brand_name}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell>{formatPrice(product.min_price)}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${product.variants?.length || 0} ظل`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          onClick={() => navigate(`/products/${product.id}/variants`)}
                          icon={<VariantsIcon />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/products/${product.id}/variants`)}
                          title="الظلال"
                        >
                          <VariantsIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/products/${product.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, product })}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, product: null })}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          هل أنت متأكد من حذف المنتج "{deleteDialog.product?.name}"؟
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>إلغاء</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
