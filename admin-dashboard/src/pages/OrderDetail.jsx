import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  getOrderStatusLabel,
  getOrderStatusColor,
  normalizeOrderStatus,
} from '../utils/orderStatus';

const paymentLabels = { cash: 'الدفع عند الاستلام', card: 'بطاقة', transfer: 'تحويل' };

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await ordersAPI.getById(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const applyStatusUpdate = async (status, cancel_reason = null) => {
    setStatusError('');
    try {
      const payload = { status };
      if (status === 'cancelled') payload.cancel_reason = cancel_reason;
      await ordersAPI.updateStatus(id, payload);
      setOrder((o) => (o ? { ...o, status, cancel_reason: status === 'cancelled' ? cancel_reason : null } : null));
    } catch (err) {
      setStatusError(err.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const handleStatusChange = async (status) => {
    if (status === 'cancelled') {
      setCancelReason('');
      setCancelDialog(true);
      return;
    }
    await applyStatusUpdate(status);
  };

  const handleConfirmCancel = async () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setStatusError('يرجى إدخال سبب الإلغاء');
      return;
    }
    await applyStatusUpdate('cancelled', reason);
    setCancelDialog(false);
  };

  const format = (v) => (v ? `${Number(v).toLocaleString('ar-IQ')} د.ع` : '0 د.ع');

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (!order) return <Typography color="error">الطلب غير موجود</Typography>;

  const displayStatus = normalizeOrderStatus(order.status);
  const canChangeStatus = displayStatus !== 'cancelled' && displayStatus !== 'delivered';
  const bundles = order.bundles || [];

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon sx={{ transform: 'scaleX(-1)' }} />} onClick={() => navigate('/orders')}>
          رجوع
        </Button>
        <Typography variant="h5" fontWeight={600}>
          تفاصيل الطلب #{order.id}
        </Typography>
      </Box>

      {statusError && <Alert severity="error" sx={{ mb: 2 }}>{statusError}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {bundles.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>الباكجات الحصرية</Typography>
              {(order.bundles || []).map((bundle) => (
                <Box key={bundle.id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(232,93,122,0.06)', border: '1px solid rgba(232,93,122,0.15)' }}>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    {bundle.offer_title} × {bundle.quantity}
                    {bundle.discount_percent > 0 && ` (خصم ${bundle.discount_percent}%)`}
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {(bundle.items || []).map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.product_name} {line.shade_name && `- ${line.shade_name}`}</TableCell>
                          <TableCell align="center">{line.quantity}</TableCell>
                          <TableCell align="left">{format(line.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Typography fontWeight={600} color="primary" sx={{ mt: 1 }}>
                    إجمالي الباكج: {format(bundle.total_price)}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
          )}
          {(order.items || []).length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>منتجات منفصلة</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>المنتج / الظل</TableCell>
                    <TableCell align="center">الكمية</TableCell>
                    <TableCell align="left">السعر</TableCell>
                    <TableCell align="left">الإجمالي</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name} {item.shade_name && ` - ${item.shade_name}`}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="left">{format(item.price)}</TableCell>
                      <TableCell align="left">{format((item.price || 0) * (item.quantity || 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>معلومات الطلب</Typography>
              <Box sx={{ '& > p': { mb: 1 }, '& > div': { mb: 2 } }}>
                <Typography>
                  <strong>الحالة:</strong>{' '}
                  <Chip label={getOrderStatusLabel(order.status)} color={getOrderStatusColor(order.status)} size="small" />
                </Typography>
                {order.cancel_reason && (
                  <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
                    <strong>سبب الإلغاء:</strong> {order.cancel_reason}
                  </Alert>
                )}
                <Typography><strong>طريقة الدفع:</strong> {paymentLabels[order.payment_method] || order.payment_method}</Typography>
                <Typography><strong>تاريخ الطلب:</strong> {new Date(order.created_at).toLocaleString('ar-IQ')}</Typography>
                {order.coupon_code && <Typography><strong>كوبون:</strong> {order.coupon_code}</Typography>}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight={600}>العنوان</Typography>
              <Typography>{order.address}</Typography>
              <Typography>{order.city}</Typography>
              {order.phone && <Typography><strong>الهاتف:</strong> {order.phone}</Typography>}
              {order.notes && <Typography sx={{ mt: 1 }}><strong>ملاحظات:</strong> {order.notes}</Typography>}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight={600}>المبالغ</Typography>
              <Typography>المجموع: {format(order.total_price)}</Typography>
              <Typography>رسوم التوصيل: {format(order.delivery_fee)}</Typography>
              {(order.discount || 0) > 0 && <Typography>الخصم: -{format(order.discount)}</Typography>}
              <Typography fontWeight={700} color="primary" sx={{ mt: 1 }}>الإجمالي النهائي: {format(order.final_price)}</Typography>
              {canChangeStatus && (
                <Box sx={{ mt: 2 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={ORDER_STATUSES.includes(displayStatus) ? displayStatus : 'pending'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      {ORDER_STATUSES.map((k) => (
                        <MenuItem key={k} value={k}>{ORDER_STATUS_LABELS[k]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {order.customer_name && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>معلومات العميل</Typography>
            <Typography><strong>الاسم:</strong> {order.customer_name}</Typography>
            {order.customer_phone && <Typography><strong>الهاتف:</strong> {order.customer_phone}</Typography>}
          </CardContent>
        </Card>
      )}

      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} fullWidth maxWidth="sm">
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
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>تراجع</Button>
          <Button variant="contained" color="error" onClick={handleConfirmCancel}>تأكيد الإلغاء</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
