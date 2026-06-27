import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  alpha,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Snackbar,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as DuplicateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Palette as VariantsIcon,
  Search as SearchIcon,
  Sync as SyncIcon,
  Inventory as ProductIcon,
  CheckCircle as PublishedIcon,
  Drafts as DraftIcon,
  Archive as ArchiveIcon,
  Star as FeaturedIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  ExpandMore as ExpandIcon,
  Refresh as RefreshIcon,
  FilterAltOff as ClearFilterIcon,
} from '@mui/icons-material';
import { productsAPI, brandsAPI, categoriesAPI, subcategoriesAPI, syncAPI, getImgBase } from '../services/api';
import SortableTableRow, { DragHandleCell } from '../components/SortableTableRow';
import ImageDisplay from '../components/ImageDisplay';
import ImageLightbox from '../components/ImageLightbox';
import PageHeader from '../components/PageHeader';
import { formatAdminPrice } from '../components/SyncedPricingBox';

const STATUS_LABELS = { draft: 'مسودة', published: 'منشور', archived: 'مؤرشف' };
const STATUS_COLORS = { draft: 'warning', published: 'success', archived: 'default' };

function StatCard({ label, value, sub, icon: Icon, color, bg, active, onClick }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        border: '2px solid',
        borderColor: active ? color : 'grey.200',
        bgcolor: active ? alpha(color, 0.06) : 'background.paper',
        transition: 'all 0.2s',
        '&:hover': onClick ? { borderColor: color, transform: 'translateY(-2px)', boxShadow: 2 } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color }}>{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ color, fontSize: 24 }} />
        </Box>
      </Box>
    </Paper>
  );
}

function formatListPricing(product) {
  const price = Number(product?.min_price);
  const original = Number(product?.min_original_price);
  const discount = Number(product?.max_discount_percent);
  const hasDiscount = discount > 0;
  const hasPromoPrices = hasDiscount && Number.isFinite(original) && original > price;
  return {
    before: formatAdminPrice(hasPromoPrices ? original : price),
    after: formatAdminPrice(price),
    discount: hasDiscount ? `${discount}%` : '—',
    hasDiscount,
  };
}

function isProductNew(p) {
  if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) return true;
  if (p.created_at) {
    const days = (Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24);
    return days <= 30;
  }
  return false;
}

function ProductBadges({ product }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {(product.status || 'published') !== 'published' && (
        <Chip label={STATUS_LABELS[product.status] || product.status} size="small" variant="outlined" />
      )}
      {!!product.is_featured && <Chip label="مميز" size="small" color="secondary" />}
      {!!product.is_best_seller && <Chip label="أكثر مبيعاً" size="small" color="success" />}
      {isProductNew(product) && <Chip label="جديد" size="small" color="info" />}
    </Box>
  );
}

function ProductCard({ product, onEdit, onVariants, onDuplicate, onDelete, onImageClick, pricing }) {
  const thumb = product?.main_image || product?.images?.[0] || null;
  const variantCount = product.variants?.length || 0;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)', borderColor: alpha('#5e35b1', 0.4) },
      }}
    >
      <Box
        sx={{ position: 'relative', height: 160, bgcolor: 'grey.100', cursor: thumb ? 'pointer' : 'default' }}
        onClick={() => thumb && onImageClick(product)}
      >
        {thumb ? (
          <Box component="img" src={`${getImgBase()}${thumb}`} alt={product.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ProductIcon sx={{ fontSize: 48, color: 'grey.300' }} />
          </Box>
        )}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Chip
            label={STATUS_LABELS[product.status || 'published']}
            size="small"
            color={STATUS_COLORS[product.status || 'published']}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap title={product.name}>{product.name}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {product.brand_name} · {product.category_name}
          {product.subcategory_name ? ` · ${product.subcategory_name}` : ''}
        </Typography>
        <ProductBadges product={product} />
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1.5, mb: 1 }}>
          {pricing.hasDiscount && (
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{pricing.before}</Typography>
          )}
          <Typography variant="h6" fontWeight={800} color={pricing.hasDiscount ? 'error.main' : 'primary.main'}>{pricing.after}</Typography>
          {pricing.hasDiscount && <Chip label={pricing.discount} size="small" color="error" variant="outlined" />}
        </Box>
        <Chip
          label={`${variantCount} ظل`}
          size="small"
          variant="outlined"
          icon={<VariantsIcon />}
          onClick={() => onVariants(product)}
          sx={{ mb: 1.5 }}
        />
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="نسخ"><IconButton size="small" onClick={() => onDuplicate(product)}><DuplicateIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="الظلال"><IconButton size="small" color="primary" onClick={() => onVariants(product)}><VariantsIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="تعديل"><IconButton size="small" color="primary" onClick={() => onEdit(product)}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="حذف"><IconButton size="small" color="error" onClick={() => onDelete(product)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      </Box>
    </Paper>
  );
}

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
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  const [galleryDialog, setGalleryDialog] = useState({ open: false, product: null });
  const [lightbox, setLightbox] = useState({ open: false, src: '', title: '' });
  const [draggedKey, setDraggedKey] = useState(null);
  const [reorderSuccess, setReorderSuccess] = useState('');
  const [syncingAll, setSyncingAll] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [expandedCats, setExpandedCats] = useState({});
  const [snack, setSnack] = useState('');

  useEffect(() => {
    Promise.all([brandsAPI.getAll(), categoriesAPI.getAll()])
      .then(([bRes, cRes]) => {
        setBrands(Array.isArray(bRes?.data) ? bRes.data : []);
        setCategories(Array.isArray(cRes?.data) ? cRes.data : []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!categoryId) {
      subcategoriesAPI.getAll().then((r) => setSubcategories(Array.isArray(r?.data) ? r.data : [])).catch(() => setSubcategories([]));
    } else {
      subcategoriesAPI.getAll({ category_id: categoryId }).then((r) => setSubcategories(Array.isArray(r?.data) ? r.data : [])).catch(() => setSubcategories([]));
    }
    setSubcategoryId('');
  }, [categoryId]);

  useEffect(() => { loadProducts(); }, [search, statusFilter, featuredOnly, brandId, categoryId, subcategoryId]);

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

  const stats = useMemo(() => {
    const s = { total: products.length, published: 0, draft: 0, archived: 0, featured: 0 };
    for (const p of products) {
      const st = p.status || 'published';
      if (s[st] !== undefined) s[st] += 1;
      if (p.is_featured) s.featured += 1;
    }
    return s;
  }, [products]);

  const productGroups = useMemo(() => {
    const categoryOrder = {};
    categories.forEach((c, i) => { categoryOrder[c.id] = c.sort_order ?? i; });
    const groupsMap = new Map();
    for (const product of products) {
      const categoryKey = product.category_id || 0;
      if (!groupsMap.has(categoryKey)) {
        const category = categories.find((c) => c.id === categoryKey);
        groupsMap.set(categoryKey, {
          categoryId: categoryKey,
          categoryName: category?.name || product.category_name || 'بدون فئة',
          categorySortOrder: categoryOrder[categoryKey] ?? 999,
          products: [],
        });
      }
      groupsMap.get(categoryKey).products.push(product);
    }
    return Array.from(groupsMap.values())
      .sort((a, b) => a.categorySortOrder - b.categorySortOrder || a.categoryName.localeCompare(b.categoryName, 'ar'))
      .map((group) => ({
        ...group,
        products: [...group.products].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name || '').localeCompare(String(b.name || ''), 'ar')
        ),
      }));
  }, [products, categories]);

  const hasActiveFilters = search || statusFilter || featuredOnly || brandId || categoryId || subcategoryId;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setFeaturedOnly(false);
    setBrandId('');
    setCategoryId('');
    setSubcategoryId('');
  };

  const getProductImages = (p) => {
    const list = [];
    if (p?.main_image) list.push(p.main_image);
    if (p?.images?.length) list.push(...p.images);
    return list.length ? list : null;
  };

  const getProductThumb = (p) => p?.main_image || p?.images?.[0] || null;

  const handleImageClick = (product) => {
    const imgs = getProductImages(product);
    if (!imgs?.length) return;
    if (imgs.length === 1) {
      setLightbox({ open: true, src: imgs[0], title: product.name });
    } else {
      setGalleryDialog({ open: true, product });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;
    try {
      await productsAPI.delete(deleteDialog.product.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteDialog.product.id));
      setDeleteDialog({ open: false, product: null });
      setSnack('تم حذف المنتج');
    } catch (err) {
      setSnack(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const handleSyncAll = async () => {
    if (!window.confirm('مزامنة أسعار ومخزون جميع المنتجات من نظام Alhayaa؟ قد يستغرق ذلك بعض الوقت.')) return;
    try {
      setSyncingAll(true);
      const { data } = await syncAPI.refreshAll();
      await loadProducts();
      setSnack(`تمت المزامنة: ${data.synced ?? 0} باركود`);
    } catch (err) {
      setSnack(err.response?.data?.message || 'فشلت المزامنة');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleReorderInCategory = async (catId, fromIndex, toIndex) => {
    const group = productGroups.find((g) => g.categoryId === catId);
    if (!group) return;
    const reordered = [...group.products];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const items = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
    try {
      await productsAPI.reorder({ items, category_id: catId });
      const orderMap = Object.fromEntries(items.map((item) => [item.id, item.sort_order]));
      setProducts((prev) => prev.map((p) => (orderMap[p.id] != null ? { ...p, sort_order: orderMap[p.id] } : p)));
      setReorderSuccess('تم تحديث ترتيب المنتجات');
    } catch (err) {
      setSnack(err.response?.data?.message || 'فشل تحديث الترتيب');
    }
    setDraggedKey(null);
  };

  const handleDuplicate = async (product) => {
    try {
      const { data } = await productsAPI.duplicate(product.id);
      setSnack('تم نسخ المنتج');
      navigate(`/products/${data.id}/edit`);
    } catch (err) {
      setSnack(err.response?.data?.message || 'فشل نسخ المنتج');
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

  const isCatExpanded = (catId) => expandedCats[catId] !== false;

  return (
    <Box sx={{ direction: 'rtl' }}>
      <PageHeader
        title="المنتجات"
        subtitle={`${stats.total} منتج · ${stats.published} منشور · ${stats.featured} مميز`}
        action={(
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" size="small" startIcon={syncingAll ? <CircularProgress size={16} /> : <SyncIcon />} onClick={handleSyncAll} disabled={syncingAll}>
              مزامنة الأسعار
            </Button>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportCSV}>تصدير CSV</Button>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={loadProducts}>تحديث</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')} sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}>
              منتج جديد
            </Button>
          </Stack>
        )}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="الكل" value={stats.total} icon={ProductIcon} color="#5e35b1" bg="#ede7f6" active={!statusFilter && !featuredOnly} onClick={() => { setStatusFilter(''); setFeaturedOnly(false); }} />
        <StatCard label="منشور" value={stats.published} icon={PublishedIcon} color="#2e7d32" bg="#e8f5e9" active={statusFilter === 'published'} onClick={() => { setStatusFilter('published'); setFeaturedOnly(false); }} />
        <StatCard label="مسودة" value={stats.draft} icon={DraftIcon} color="#ed6c02" bg="#fff3e0" active={statusFilter === 'draft'} onClick={() => { setStatusFilter('draft'); setFeaturedOnly(false); }} />
        <StatCard label="مؤرشف" value={stats.archived} icon={ArchiveIcon} color="#616161" bg="#f5f5f5" active={statusFilter === 'archived'} onClick={() => { setStatusFilter('archived'); setFeaturedOnly(false); }} />
        <StatCard label="مميز" value={stats.featured} icon={FeaturedIcon} color="#E85D7A" bg="#fce4ec" active={featuredOnly} onClick={() => { setFeaturedOnly(true); setStatusFilter(''); }} />
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
            sx={{ minWidth: 200, flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>الحالة</InputLabel>
            <Select value={statusFilter} label="الحالة" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">الكل</MenuItem>
              <MenuItem value="draft">مسودة</MenuItem>
              <MenuItem value="published">منشور</MenuItem>
              <MenuItem value="archived">مؤرشف</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>العلامة</InputLabel>
            <Select value={brandId} label="العلامة" onChange={(e) => setBrandId(e.target.value)}>
              <MenuItem value="">الكل</MenuItem>
              {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>الفئة</InputLabel>
            <Select value={categoryId} label="الفئة" onChange={(e) => setCategoryId(e.target.value)}>
              <MenuItem value="">الكل</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }} disabled={!categoryId}>
            <InputLabel>الفئة الثانوية</InputLabel>
            <Select value={subcategoryId} label="الفئة الثانوية" onChange={(e) => setSubcategoryId(e.target.value)}>
              <MenuItem value="">الكل</MenuItem>
              {subcategories.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          {hasActiveFilters && (
            <Button size="small" variant="outlined" startIcon={<ClearFilterIcon />} onClick={clearFilters}>مسح</Button>
          )}
          <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} sx={{ mr: 'auto' }}>
            <ToggleButton value="grid"><GridIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="table"><ListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {reorderSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setReorderSuccess('')}>{reorderSuccess}</Alert>}

      {viewMode === 'table' && (
        <Alert severity="info" sx={{ mb: 2 }}>اسحبي المنتجات داخل كل قسم لإعادة ترتيبها — الترتيب يتبع ترتيب الأقسام من صفحة الفئات.</Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : productGroups.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'grey.300' }}>
          <ProductIcon sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
          <Typography color="text.secondary" gutterBottom>لا توجد منتجات</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')} sx={{ mt: 2 }}>إضافة منتج</Button>
        </Paper>
      ) : (
        productGroups.map((group) => (
          <Accordion
            key={group.categoryId}
            expanded={isCatExpanded(group.categoryId)}
            onChange={() => setExpandedCats((prev) => ({ ...prev, [group.categoryId]: !isCatExpanded(group.categoryId) }))}
            elevation={0}
            sx={{ mb: 2, borderRadius: '12px !important', border: '1px solid', borderColor: 'grey.200', '&:before': { display: 'none' }, overflow: 'hidden' }}
          >
            <AccordionSummary expandIcon={<ExpandIcon />} sx={{ bgcolor: alpha('#5e35b1', 0.04), px: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} color="primary.dark">{group.categoryName}</Typography>
                <Chip size="small" label={`${group.products.length} منتج`} color="primary" variant="outlined" />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: viewMode === 'grid' ? 2 : 0 }}>
              {viewMode === 'grid' ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                  {group.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      pricing={formatListPricing(product)}
                      onEdit={(p) => navigate(`/products/${p.id}/edit`)}
                      onVariants={(p) => navigate(`/products/${p.id}/variants`)}
                      onDuplicate={handleDuplicate}
                      onDelete={(p) => setDeleteDialog({ open: true, product: p })}
                      onImageClick={handleImageClick}
                    />
                  ))}
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', bgcolor: 'grey.50' } }}>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell sx={{ width: 50 }}>#</TableCell>
                      <TableCell sx={{ width: 72 }}>الصورة</TableCell>
                      <TableCell>المنتج</TableCell>
                      <TableCell>الحالة</TableCell>
                      <TableCell>العلامة</TableCell>
                      <TableCell>السعر</TableCell>
                      <TableCell>الظلال</TableCell>
                      <TableCell align="center">إجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.products.map((product, i) => {
                      const dragKey = `${group.categoryId}-${i}`;
                      const pricing = formatListPricing(product);
                      return (
                        <SortableTableRow
                          key={product.id}
                          item={product}
                          index={i}
                          isDragging={draggedKey === dragKey}
                          onDragStart={() => setDraggedKey(dragKey)}
                          onDrop={(from, to) => handleReorderInCategory(group.categoryId, from, to)}
                          onDragEnd={() => setDraggedKey(null)}
                          hover
                        >
                          <DragHandleCell />
                          <TableCell>{product.sort_order ?? i}</TableCell>
                          <TableCell>
                            <ImageDisplay src={getProductThumb(product)} size="md" onClick={() => handleImageClick(product)} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{product.name}</Typography>
                            <ProductBadges product={product} />
                          </TableCell>
                          <TableCell>
                            <Chip label={STATUS_LABELS[product.status || 'published']} size="small" color={STATUS_COLORS[product.status || 'published']} variant="outlined" />
                          </TableCell>
                          <TableCell>{product.brand_name}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{pricing.after}</Typography>
                            {pricing.hasDiscount && <Typography variant="caption" color="text.secondary">{pricing.before} · {pricing.discount}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip label={`${product.variants?.length || 0}`} size="small" icon={<VariantsIcon />} onClick={() => navigate(`/products/${product.id}/variants`)} />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="نسخ"><IconButton size="small" onClick={() => handleDuplicate(product)}><DuplicateIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="تعديل"><IconButton size="small" onClick={() => navigate(`/products/${product.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="حذف"><IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, product })}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </TableCell>
                        </SortableTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}

      <Dialog open={galleryDialog.open} onClose={() => setGalleryDialog({ open: false, product: null })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>صور: {galleryDialog.product?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2, py: 1 }}>
            {getProductImages(galleryDialog.product)?.map((img, i) => (
              <Box
                key={i}
                onClick={() => setLightbox({ open: true, src: img, title: `${galleryDialog.product?.name} — ${i + 1}` })}
                sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'grey.200', aspectRatio: '1', '&:hover': { boxShadow: 4 } }}
              >
                <Box component="img" src={`${getImgBase()}${img}`} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      <ImageLightbox open={lightbox.open} src={lightbox.src} title={lightbox.title} onClose={() => setLightbox((p) => ({ ...p, open: false }))} />

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, product: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>حذف المنتج</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>هذا الإجراء نهائي.</Alert>
          هل أنت متأكد من حذف «{deleteDialog.product?.name}»؟
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>إلغاء</Button>
          <Button onClick={handleDelete} color="error" variant="contained">حذف</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
