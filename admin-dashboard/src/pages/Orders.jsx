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
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const statusColors = { pending: 'warning', confirmed: 'info', processing: 'primary', shipped: 'secondary', delivered: 'success', cancelled: 'error' };
const statusLabels = { pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const handleStatusChange = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const matchId = String(o.id).includes(s);
      const matchPhone = (o.customer_phone || '').toLowerCase().includes(s);
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>حالة الطلب</InputLabel>
            <Select value={statusFilter} label="حالة الطلب" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">الكل</MenuItem>
              {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>المبلغ النهائي</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>طريقة الدفع</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell>تغيير الحالة</TableCell>
              <TableCell align="center">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((order) => (
              <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order.id}`)}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{Number(order.final_price).toLocaleString('ar-IQ')} د.ع</TableCell>
                <TableCell><Chip label={statusLabels[order.status] || order.status} color={statusColors[order.status] || 'default'} size="small" /></TableCell>
                <TableCell>{order.payment_method === 'cash' ? 'الدفع عند الاستلام' : order.payment_method}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                      {Object.entries(statusLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => navigate(`/orders/${order.id}`)} title="عرض التفاصيل"><ViewIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
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
    </Box>
  );
}
