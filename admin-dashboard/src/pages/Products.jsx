import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  TablePagination,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as DuplicateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Palette as VariantsIcon,
  Search as SearchIcon,
  ZoomIn as ZoomIcon,
} from '@mui/icons-material';
import { productsAPI, brandsAPI, categoriesAPI, subcategoriesAPI, IMG_BASE } from '../services/api';
import SortableTableRow, { DragHandleCell } from '../components/SortableTableRow';
import ImageDisplay from '../components/ImageDisplay';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  const [imageDialog, setImageDialog] = useState({ open: false, product: null });
  const [draggedIndex, setDraggedIndex] = useState(-1);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, cRes] = await Promise.all([brandsAPI.getAll(), categoriesAPI.getAll()]);
        setBrands(Array.isArray(bRes?.data) ? bRes.data : []);
        setCategories(Array.isArray(cRes?.data) ? cRes.data : []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      subcategoriesAPI.getAll().then((r) => setSubcategories(Array.isArray(r?.data) ? r.data : [])).catch(() => setSubcategories([]));
    } else {
      subcategoriesAPI.getAll({ category_id: categoryId }).then((r) => setSubcategories(Array.isArray(r?.data) ? r.data : [])).catch(() => setSubcategories([]));
    }
    setSubcategoryId('');
  }, [categoryId]);

  useEffect(() => {
    setPage(0);
    loadProducts();
  }, [search, statusFilter, featuredOnly, brandId, categoryId, subcategoryId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (featuredOnly) params.featured = '1';
      if (brandId) params.brand_id = brandId;
      if (categoryId) params.category_id = categoryId;
      if (subcategoryId) params.subcategory_id = subcategoryId;
      const { data } = await productsAPI.getAll(params);
      setProducts(Array.isArray(data) ? data : []);
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

  const getProductImages = (p) => {
    const list = [];
    if (p?.main_image) list.push(p.main_image);
    if (p?.images?.length) list.push(...p.images);
    return list.length ? list : null;
  };

  const getProductThumb = (p) => p?.main_image || p?.images?.[0] || null;

  const paginated = products.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setFeaturedOnly(false);
    setBrandId('');
    setCategoryId('');
    setSubcategoryId('');
    setPage(0);
  };

  const hasActiveFilters = search || statusFilter || featuredOnly || brandId || categoryId || subcategoryId;

  const isProductNew = (p) => {
    if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) return true;
    if (p.created_at) {
      const created = new Date(p.created_at);
      const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
      return days <= 30;
    }
    return false;
  };

  const handleReorder = async (fromIndex, toIndex) => {
    const fromGlobal = page * rowsPerPage + fromIndex;
    const toGlobal = page * rowsPerPage + toIndex;
    const reordered = [...products];
    const [removed] = reordered.splice(fromGlobal, 1);
    reordered.splice(toGlobal, 0, removed);
    const items = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
    try {
      await productsAPI.reorder(items);
      setProducts(reordered.map((p, i) => ({ ...p, sort_order: i })));
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تحديث الترتيب');
    }
    setDraggedIndex(-1);
  };

  const handleDuplicate = async (product) => {
    try {
      const { data } = await productsAPI.duplicate(product.id);
      loadProducts();
      navigate(`/products/${data.id}/edit`);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل نسخ المنتج');
    }
  };

  const handleExportCSV = () => {
    const headers = ['id', 'name', 'brand_name', 'category_name', 'subcategory_name', 'status', 'min_price', 'is_featured', 'is_best_seller'];
    const rows = products.map((p) => headers.map((h) => JSON.stringify(p[h] ?? '')).join(','));
    const csv = ['\ufeff' + headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statusLabels = { draft: 'مسودة', published: 'منشور', archived: 'مؤرشف' };

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1a1a2e">
          المنتجات
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
            تصدير CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products/new')}
            sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}
          >
            منتج جديد
          </Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FilterIcon fontSize="small" /> فلترة العرض
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="بحث بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 180 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>الحالة</InputLabel>
              <Select value={statusFilter} label="الحالة" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="draft">مسودة</MenuItem>
                <MenuItem value="published">منشور</MenuItem>
                <MenuItem value="archived">مؤرشف</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>مميز</InputLabel>
              <Select value={featuredOnly ? '1' : ''} label="مميز" onChange={(e) => setFeaturedOnly(e.target.value === '1')}>
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="1">مميز فقط</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>العلامة التجارية</InputLabel>
              <Select
                value={brandId}
                label="العلامة التجارية"
                onChange={(e) => setBrandId(e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                {brands.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>الفئة</InputLabel>
              <Select
                value={categoryId}
                label="الفئة"
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }} disabled={!categoryId}>
              <InputLabel>الفئة الثانوية</InputLabel>
              <Select
                value={subcategoryId}
                label="الفئة الثانوية"
                onChange={(e) => setSubcategoryId(e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                {subcategories.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {hasActiveFilters && (
              <Button size="small" variant="outlined" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <CardContent>
          {loading ? (
            <Typography>جاري التحميل...</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }}></TableCell>
                    <TableCell sx={{ width: 60 }}>التسلسل</TableCell>
                    <TableCell>الصورة</TableCell>
                    <TableCell>الاسم / الشارات</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell>العلامة التجارية</TableCell>
                    <TableCell>الفئة</TableCell>
                    <TableCell>الفئة الثانوية</TableCell>
                    <TableCell>السعر</TableCell>
                    <TableCell>الظلال</TableCell>
                    <TableCell align="center">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((product, i) => (
                    <SortableTableRow
                      key={product.id}
                      item={product}
                      index={i}
                      isDragging={draggedIndex === i}
                      onDragStart={setDraggedIndex}
                      onDrop={handleReorder}
                      onDragEnd={() => setDraggedIndex(-1)}
                      hover
                    >
                      <DragHandleCell />
                      <TableCell>{product.sort_order ?? '-'}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                          onClick={() => setImageDialog({ open: true, product })}
                          role="button"
                        >
                          <ImageDisplay
                            src={getProductThumb(product)}
                            size="md"
                            fit="cover"
                            onClick={() => setImageDialog({ open: true, product })}
                          />
                          {(getProductImages(product)?.length || 0) > 1 && (
                            <ZoomIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={500}>{product.name}</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(product.status || 'published') !== 'published' && (
                              <Chip label={statusLabels[product.status] || product.status} size="small" color="default" variant="outlined" />
                            )}
                            {!!product.is_featured && <Chip label="مميز" size="small" color="secondary" />}
                            {!!product.is_best_seller && <Chip label="أكثر مبيعاً" size="small" color="success" />}
                            {isProductNew(product) && <Chip label="جديد" size="small" color="info" />}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={statusLabels[product.status || 'published'] || product.status} size="small" color={product.status === 'published' ? 'success' : product.status === 'draft' ? 'warning' : 'default'} variant="outlined" />
                      </TableCell>
                      <TableCell>{product.brand_name}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell>{product.subcategory_name || '-'}</TableCell>
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
                        <IconButton size="small" onClick={() => handleDuplicate(product)} title="نسخ">
                          <DuplicateIcon />
                        </IconButton>
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
                    </SortableTableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={products.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="صفوف لكل صفحة"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
              />
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={imageDialog.open}
        onClose={() => setImageDialog({ open: false, product: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.200', pb: 2 }}>
          صور المنتج: {imageDialog.product?.name}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 2.5,
              justifyItems: 'center',
            }}
          >
            {getProductImages(imageDialog.product)?.map((img, i) => (
              <Box
                key={i}
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Box
                  component="img"
                  src={`${IMG_BASE}${img}`}
                  alt={`صورة ${i + 1}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </Box>
            ))}
            {(!getProductImages(imageDialog.product) || getProductImages(imageDialog.product).length === 0) && (
              <Typography color="text.secondary" sx={{ gridColumn: '1 / -1', py: 4 }}>
                لا توجد صور لهذا المنتج
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>

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
