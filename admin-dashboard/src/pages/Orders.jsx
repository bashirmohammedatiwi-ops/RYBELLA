import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Avatar,
  Tooltip,
  Paper,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ShoppingBag as BagIcon,
  LocalShipping as ShipIcon,
  CheckCircle as DoneIcon,
  HourglassEmpty as PendingIcon,
  Cancel as CancelIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import ImageDisplay from '../components/ImageDisplay';
import { collectOrderProductLines } from '../utils/orderImages';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  getOrderStatusLabel,
  getOrderStatusColor,
  normalizeOrderStatus,
} from '../utils/orderStatus';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'oldest', label: 'الأقدم أولاً' },
  { value: 'amount_desc', label: 'الأعلى سعراً' },
  { value: 'amount_asc', label: 'الأقل سعراً' },
];

const STATUS_META = {
  '': { icon: BagIcon, color: '#5e35b1', bg: '#ede7f6' },
  pending: { icon: PendingIcon, color: '#ed6c02', bg: '#fff3e0' },
  preparing_shipping: { icon: ShipIcon, color: '#0288d1', bg: '#e1f5fe' },
  delivered: { icon: DoneIcon, color: '#2e7d32', bg: '#e8f5e9' },
  cancelled: { icon: CancelIcon, color: '#d32f2f', bg: '#ffebee' },
};

function formatMoney(v) {
  return `${Number(v || 0).toLocaleString('ar-IQ')} د.ع`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ar-IQ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso || '—';
  }
}

function countOrderLines(order) {
  const items = order.items?.length || 0;
  const bundleLines = (order.bundles || []).reduce((s, b) => s + (b.items?.length || 0), 0);
  return items + bundleLines;
}

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
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color, fontSize: 24 }} />
        </Box>
      </Box>
    </Paper>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cancelDialog, setCancelDialog] = useState({ open: false, orderId: null, reason: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, order: null });
  const [statusError, setStatusError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await ordersAPI.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setStatusError('تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const counts = { total: orders.length, revenue: 0 };
    for (const k of ORDER_STATUSES) counts[k] = 0;
    for (const o of orders) {
      const st = normalizeOrderStatus(o.status);
      if (counts[st] !== undefined) counts[st] += 1;
      if (st !== 'cancelled') counts.revenue += Number(o.final_price) || 0;
    }
    return counts;
  }, [orders]);

  const applyStatusUpdate = async (orderId, status, cancel_reason = null) => {
    setStatusError('');
    try {
      const payload = { status };
      if (status === 'cancelled') payload.cancel_reason = cancel_reason;
      await ordersAPI.updateStatus(orderId, payload);
      setOrders((prev) => prev.map((o) => (
        o.id === orderId
          ? { ...o, status, cancel_reason: status === 'cancelled' ? cancel_reason : null }
          : o
      )));
      setActionMsg('تم تحديث حالة الطلب');
    } catch (err) {
      setStatusError(err.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    if (status === 'cancelled') {
      setCancelDialog({ open: true, orderId, reason: '' });
      return;
    }
    await applyStatusUpdate(orderId, status);
  };

  const handleConfirmCancel = async () => {
    const reason = cancelDialog.reason.trim();
    if (!reason) {
      setStatusError('يرجى إدخال سبب الإلغاء');
      return;
    }
    await applyStatusUpdate(cancelDialog.orderId, 'cancelled', reason);
    setCancelDialog({ open: false, orderId: null, reason: '' });
  };

  const handleDelete = async () => {
    if (!deleteDialog.order) return;
    setStatusError('');
    try {
      await ordersAPI.delete(deleteDialog.order.id);
      setOrders((prev) => prev.filter((o) => o.id !== deleteDialog.order.id));
      setActionMsg(`تم حذف الطلب #${deleteDialog.order.id}`);
      setDeleteDialog({ open: false, order: null });
    } catch (err) {
      setStatusError(err.response?.data?.message || 'فشل حذف الطلب');
    }
  };

  const filtered = useMemo(() => {
    let list = orders.filter((o) => {
      if (statusFilter && normalizeOrderStatus(o.status) !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          String(o.id).includes(s)
          || (o.customer_phone || o.phone || '').toLowerCase().includes(s)
          || (o.customer_name || '').toLowerCase().includes(s)
          || (o.city || '').toLowerCase().includes(s)
        );
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'amount_desc') return (b.final_price || 0) - (a.final_price || 0);
      if (sortBy === 'amount_asc') return (a.final_price || 0) - (b.final_price || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return list;
  }, [orders, statusFilter, search, sortBy]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={360}>
        <CircularProgress sx={{ color: '#E85D7A' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ direction: 'rtl' }}>
      <PageHeader
        title="الطلبات"
        subtitle={`${stats.total} طلب — ${formatMoney(stats.revenue)} إجمالي المبيعات (غير الملغاة)`}
        action={(
          <Button startIcon={<RefreshIcon />} onClick={load} variant="outlined">
            تحديث
          </Button>
        )}
      />

      {actionMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionMsg('')}>{actionMsg}</Alert>}
      {statusError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setStatusError('')}>{statusError}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label="كل الطلبات"
          value={stats.total}
          icon={BagIcon}
          color={STATUS_META[''].color}
          bg={STATUS_META[''].bg}
          active={!statusFilter}
          onClick={() => { setStatusFilter(''); setPage(0); }}
        />
        {ORDER_STATUSES.map((k) => {
          const meta = STATUS_META[k];
          return (
            <StatCard
              key={k}
              label={ORDER_STATUS_LABELS[k]}
              value={stats[k] || 0}
              icon={meta.icon}
              color={meta.color}
              bg={meta.bg}
              active={statusFilter === k}
              onClick={() => { setStatusFilter(statusFilter === k ? '' : k); setPage(0); }}
            />
          );
        })}
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="بحث: رقم الطلب، الاسم، الهاتف، المدينة..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 240 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel><SortIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} /> ترتيب</InputLabel>
            <Select value={sortBy} label="ترتيب" onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} نتيجة
          </Typography>
        </Box>
      </Paper>

      {filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'grey.300' }}>
          <BagIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">لا توجد طلبات مطابقة للبحث</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {paginated.map((order) => {
            const displayStatus = normalizeOrderStatus(order.status);
            const productLines = collectOrderProductLines(order);
            const visibleLines = productLines.slice(0, 5);
            const extraCount = productLines.length - visibleLines.length;
            const customerName = order.customer_name || 'زبون';
            const customerPhone = order.customer_phone || order.phone || '—';
            const lineCount = countOrderLines(order);
            const meta = STATUS_META[displayStatus] || STATUS_META.pending;

            return (
              <Paper
                key={order.id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 3, borderColor: alpha('#E85D7A', 0.35) },
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto auto auto' },
                    gap: 2,
                    alignItems: 'center',
                    p: 2,
                  }}
                >
                  {/* رقم الطلب + التاريخ */}
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      #{order.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDate(order.created_at)}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${lineCount} منتج`}
                      sx={{ mt: 0.75, height: 22, fontSize: 11 }}
                    />
                  </Box>

                  {/* العميل + المدينة */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Avatar sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, width: 42, height: 42 }}>
                      {customerName.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>{customerName}</Typography>
                      <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: 'right' }}>
                        {customerPhone}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{order.city || '—'}</Typography>
                    </Box>
                  </Box>

                  {/* صور المنتجات */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    {visibleLines.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    ) : (
                      visibleLines.map((line) => (
                        <Tooltip key={line.key} title={[line.name, line.shade].filter(Boolean).join(' — ')}>
                          <Box>
                            <ImageDisplay
                              src={line.image}
                              size="sm"
                              width={40}
                              height={40}
                              alt={line.name || 'منتج'}
                              sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'grey.200' }}
                            />
                          </Box>
                        </Tooltip>
                      ))
                    )}
                    {extraCount > 0 && (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'text.secondary',
                        }}
                      >
                        +{extraCount}
                      </Box>
                    )}
                  </Box>

                  {/* المبلغ + الحالة */}
                  <Box sx={{ textAlign: { xs: 'left', md: 'center' }, minWidth: 130 }}>
                    <Typography variant="h6" fontWeight={800}>
                      {formatMoney(order.final_price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {order.payment_method === 'cash' ? 'عند الاستلام' : order.payment_method}
                    </Typography>
                    <Chip
                      label={getOrderStatusLabel(order.status)}
                      color={getOrderStatusColor(order.status)}
                      size="small"
                      sx={{ mt: 0.5, fontWeight: 600 }}
                    />
                  </Box>

                  {/* إجراءات */}
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FormControl size="small" sx={{ minWidth: 150, display: { xs: 'none', lg: 'block' } }}>
                      <Select
                        value={ORDER_STATUSES.includes(displayStatus) ? displayStatus : 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        sx={{ fontSize: 13 }}
                      >
                        {ORDER_STATUSES.map((k) => <MenuItem key={k} value={k}>{ORDER_STATUS_LABELS[k]}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Tooltip title="عرض التفاصيل">
                      <IconButton color="primary" onClick={() => navigate(`/orders/${order.id}`)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف الطلب">
                      <IconButton color="error" onClick={() => setDeleteDialog({ open: true, order })}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* شريط الحالة على الموبايل */}
                <Box sx={{ display: { xs: 'block', lg: 'none' }, px: 2, pb: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>تغيير الحالة</InputLabel>
                    <Select
                      label="تغيير الحالة"
                      value={ORDER_STATUSES.includes(displayStatus) ? displayStatus : 'pending'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {ORDER_STATUSES.map((k) => <MenuItem key={k} value={k}>{ORDER_STATUS_LABELS[k]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Paper>
            );
          })}

          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              labelRowsPerPage="طلبات لكل صفحة"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            />
          </Paper>
        </Box>
      )}

      {/* إلغاء الطلب */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, orderId: null, reason: '' })} fullWidth maxWidth="sm">
        <DialogTitle>إلغاء الطلب</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            يرجى ذكر سبب الإلغاء — سيظهر للزبون في الموقع.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="سبب الإلغاء"
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog((d) => ({ ...d, reason: e.target.value }))}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, orderId: null, reason: '' })}>تراجع</Button>
          <Button variant="contained" color="error" onClick={handleConfirmCancel}>تأكيد الإلغاء</Button>
        </DialogActions>
      </Dialog>

      {/* حذف الطلب */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, order: null })} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: 'error.main' }}>حذف الطلب #{deleteDialog.order?.id}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            هذا الإجراء نهائي ولا يمكن التراجع عنه.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            سيتم حذف الطلب وجميع منتجاته من السجل.
            {deleteDialog.order && ['pending', 'preparing_shipping'].includes(normalizeOrderStatus(deleteDialog.order.status)) && (
              <> كما سيتم <strong>إرجاع الكميات للمخزون</strong> تلقائياً.</>
            )}
          </Typography>
          {deleteDialog.order && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography fontWeight={600}>{deleteDialog.order.customer_name || 'زبون'}</Typography>
              <Typography variant="body2">{formatMoney(deleteDialog.order.final_price)} — {getOrderStatusLabel(deleteDialog.order.status)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, order: null })}>تراجع</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>حذف نهائياً</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
