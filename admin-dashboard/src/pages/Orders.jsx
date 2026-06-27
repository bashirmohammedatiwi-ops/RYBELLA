import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
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

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cancelDialog, setCancelDialog] = useState({ open: false, orderId: null, reason: '' });
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await ordersAPI.getAll();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  const filtered = orders.filter((o) => {
    if (statusFilter && normalizeOrderStatus(o.status) !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const matchId = String(o.id).includes(s);
      const matchPhone = (o.customer_phone || o.phone || '').toLowerCase().includes(s);
      const matchName = (o.customer_name || '').toLowerCase().includes(s);
      return matchId || matchPhone || matchName;
    }
    return true;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>الطلبات</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="بحث برقم الطلب أو الهاتف أو الاسم..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ minWidth: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>حالة الطلب</InputLabel>
            <Select value={statusFilter} label="حالة الطلب" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">الكل</MenuItem>
              {ORDER_STATUSES.map((k) => <MenuItem key={k} value={k}>{ORDER_STATUS_LABELS[k]}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {statusError && <Typography color="error" sx={{ mb: 2 }}>{statusError}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>المنتجات</TableCell>
              <TableCell>المبلغ النهائي</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>طريقة الدفع</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell>تغيير الحالة</TableCell>
              <TableCell align="center">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((order) => {
              const displayStatus = normalizeOrderStatus(order.status);
              const productLines = collectOrderProductLines(order);
              const visibleLines = productLines.slice(0, 4);
              const extraCount = productLines.length - visibleLines.length;
              return (
                <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {productLines.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', maxWidth: 220 }}>
                        {visibleLines.map((line) => (
                          <ImageDisplay
                            key={line.key}
                            src={line.image}
                            size="sm"
                            width={44}
                            height={44}
                            alt={line.name || 'منتج'}
                            sx={{ borderRadius: 1.5 }}
                          />
                        ))}
                        {extraCount > 0 && (
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 1.5,
                              bgcolor: 'grey.100',
                              border: '1px solid',
                              borderColor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'text.secondary',
                            }}
                          >
                            +{extraCount}
                          </Box>
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{Number(order.final_price).toLocaleString('ar-IQ')} د.ع</TableCell>
                  <TableCell>
                    <Chip
                      label={getOrderStatusLabel(order.status)}
                      color={getOrderStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{order.payment_method === 'cash' ? 'الدفع عند الاستلام' : order.payment_method}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <Select
                        value={ORDER_STATUSES.includes(displayStatus) ? displayStatus : 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        {ORDER_STATUSES.map((k) => <MenuItem key={k} value={k}>{ORDER_STATUS_LABELS[k]}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => navigate(`/orders/${order.id}`)} title="عرض التفاصيل"><ViewIcon /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          labelRowsPerPage="صفوف لكل صفحة"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
        />
      </TableContainer>

      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, orderId: null, reason: '' })} fullWidth maxWidth="sm">
        <DialogTitle>إلغاء الطلب</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            يرجى ذكر سبب إلغاء الطلب — سيظهر للزبون في الموقع.
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
    </Box>
  );
}
