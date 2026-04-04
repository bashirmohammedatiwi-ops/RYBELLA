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
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'primary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'error',
};
const statusLabels = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};
const paymentLabels = { cash: 'الدفع عند الاستلام', card: 'بطاقة', transfer: 'تحويل' };

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleStatusChange = async (status) => {
    try {
      await ordersAPI.updateStatus(id, status);
      setOrder((o) => (o ? { ...o, status } : null));
    } catch (err) {
      console.error(err);
    }
  };

  const format = (v) => (v ? `${Number(v).toLocaleString('ar-IQ')} د.ع` : '0 د.ع');

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (!order) return <Typography color="error">الطلب غير موجود</Typography>;

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
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>بنود الطلب</Typography>
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
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>معلومات الطلب</Typography>
              <Box sx={{ '& > p': { mb: 1 }, '& > div': { mb: 2 } }}>
                <Typography><strong>الحالة:</strong> <Chip label={statusLabels[order.status] || order.status} color={statusColors[order.status]} size="small" /></Typography>
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
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Box sx={{ mt: 2 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={order.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      label="تغيير الحالة"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <MenuItem key={k} value={k}>{v}</MenuItem>
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
    </Box>
  );
}
