import { useState, useEffect } from 'react';
import {
  Box,
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  alpha,
  Snackbar,
  Stack,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  LocalShipping as ShipIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as DoneIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Phone as PhoneIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';
import ImageLightbox from '../components/ImageLightbox';
import { getOrderLineImage } from '../utils/orderImages';
import {
  ORDER_STATUSES,
  getOrderStatusLabel,
  getOrderStatusColor,
  normalizeOrderStatus,
} from '../utils/orderStatus';

const paymentLabels = { cash: 'الدفع عند الاستلام', card: 'بطاقة', transfer: 'تحويل' };

const FLOW_STEPS = [
  { key: 'pending', label: 'قيد الانتظار', icon: PendingIcon, color: '#ed6c02' },
  { key: 'preparing_shipping', label: 'قيد التجهيز والشحن', icon: ShipIcon, color: '#0288d1' },
  { key: 'delivered', label: 'تم التسليم', icon: DoneIcon, color: '#2e7d32' },
];

function formatMoney(v) {
  return `${Number(v || 0).toLocaleString('ar-IQ')} د.ع`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ar-IQ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso || '—';
  }
}

function SectionCard({ title, icon: Icon, children, accent = '#E85D7A' }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden', mb: 2 }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(accent, 0.08), borderBottom: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1 }}>
        {Icon && <Icon sx={{ color: accent, fontSize: 22 }} />}
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
      {Icon && <Icon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.2 }} />}
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{value}</Typography>
      </Box>
    </Box>
  );
}

function StatusStepper({ current, onSelect, disabled, updating }) {
  const idx = FLOW_STEPS.findIndex((s) => s.key === current);

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
        {FLOW_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const done = i < idx;
          const active = i === idx;
          const clickable = !disabled && !updating && onSelect;

          return (
            <Box key={step.key} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              {i < FLOW_STEPS.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 22,
                    left: '50%',
                    width: '100%',
                    height: 3,
                    bgcolor: done || active ? step.color : 'grey.200',
                    opacity: done ? 1 : active ? 0.5 : 0.4,
                    transition: 'background 0.3s',
                  }}
                />
              )}
              <Box
                onClick={() => clickable && onSelect(step.key)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: active ? step.color : done ? alpha(step.color, 0.15) : 'grey.100',
                  color: active ? 'white' : done ? step.color : 'grey.500',
                  border: '3px solid',
                  borderColor: active ? step.color : done ? alpha(step.color, 0.4) : 'grey.300',
                  cursor: clickable ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  '&:hover': clickable ? { transform: 'scale(1.08)', boxShadow: 3 } : {},
                }}
              >
                {updating && active ? (
                  <CircularProgress size={22} sx={{ color: 'white' }} />
                ) : (
                  <StepIcon sx={{ fontSize: 22 }} />
                )}
              </Box>
              <Typography
                variant="caption"
                align="center"
                sx={{
                  mt: 1,
                  fontWeight: active ? 700 : 500,
                  color: active ? step.color : 'text.secondary',
                  maxWidth: 100,
                  lineHeight: 1.3,
                }}
              >
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ProductImage({ line, onZoom }) {
  const src = getOrderLineImage(line);
  const label = [line.product_name, line.shade_name].filter(Boolean).join(' — ');
  return (
    <ImageDisplay
      src={src}
      size="sm"
      width={52}
      height={52}
      alt={label}
      onClick={src ? () => onZoom({ open: true, src, alt: label, title: label }) : undefined}
    />
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lightbox, setLightbox] = useState({ open: false, src: '', alt: '', title: '' });

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
    setStatusUpdating(true);
    try {
      const payload = { status };
      if (status === 'cancelled') payload.cancel_reason = cancel_reason;
      const { data } = await ordersAPI.updateStatus(id, payload);
      setOrder((o) => (o ? {
        ...o,
        status: data.status || status,
        cancel_reason: status === 'cancelled' ? cancel_reason : null,
      } : null));
      setSuccessMsg(`تم تحديث الحالة إلى: ${getOrderStatusLabel(status)}`);
    } catch (err) {
      setStatusError(err.response?.data?.message || 'فشل تحديث الحالة');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (status === normalizeOrderStatus(order?.status)) return;
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

  const handleDelete = async () => {
    setStatusError('');
    try {
      await ordersAPI.delete(id);
      navigate('/orders');
    } catch (err) {
      setStatusError(err.response?.data?.message || 'فشل حذف الطلب');
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Alert severity="error">الطلب غير موجود</Alert>
    );
  }

  const displayStatus = normalizeOrderStatus(order.status);
  const canChangeStatus = displayStatus !== 'cancelled' && displayStatus !== 'delivered';
  const bundles = order.bundles || [];
  const items = order.items || [];
  const isCancelled = displayStatus === 'cancelled';

  return (
    <Box sx={{ direction: 'rtl' }}>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon sx={{ transform: 'scaleX(-1)' }} />}
            onClick={() => navigate('/orders')}
            sx={{ borderRadius: 2 }}
          >
            رجوع للطلبات
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800}>طلب #{order.id}</Typography>
            <Typography variant="body2" color="text.secondary">{formatDate(order.created_at)}</Typography>
          </Box>
          <Chip
            label={getOrderStatusLabel(order.status)}
            color={getOrderStatusColor(order.status)}
            sx={{ fontWeight: 600, px: 1 }}
          />
        </Box>
        <Button
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          حذف الطلب
        </Button>
      </Box>

      {statusError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setStatusError('')}>{statusError}</Alert>}

      {/* شريط الحالات */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>مسار الطلب</Typography>
        {isCancelled ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, px: 2, borderRadius: 2, bgcolor: alpha('#d32f2f', 0.08), border: '1px solid', borderColor: alpha('#d32f2f', 0.3) }}>
            <CancelIcon sx={{ color: 'error.main' }} />
            <Box>
              <Typography fontWeight={700} color="error.main">تم إلغاء الطلب</Typography>
              {order.cancel_reason && (
                <Typography variant="body2" color="text.secondary">{order.cancel_reason}</Typography>
              )}
            </Box>
          </Box>
        ) : (
          <>
            <StatusStepper
              current={ORDER_STATUSES.includes(displayStatus) ? displayStatus : 'pending'}
              onSelect={canChangeStatus ? handleStatusChange : undefined}
              disabled={!canChangeStatus}
              updating={statusUpdating}
            />
            {canChangeStatus && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={statusUpdating}
                  sx={{ borderRadius: 2 }}
                >
                  إلغاء الطلب
                </Button>
              </Stack>
            )}
          </>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* المنتجات */}
        <Grid item xs={12} lg={8}>
          {bundles.length > 0 && (
            <SectionCard title="الباكجات الحصرية" accent="#E85D7A">
              {bundles.map((bundle) => (
                <Box
                  key={bundle.id}
                  sx={{
                    mb: 2,
                    '&:last-child': { mb: 0 },
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#E85D7A', 0.04),
                    border: '1px solid',
                    borderColor: alpha('#E85D7A', 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Typography fontWeight={700}>
                      {bundle.offer_title} × {bundle.quantity}
                    </Typography>
                    {bundle.discount_percent > 0 && (
                      <Chip size="small" label={`خصم ${bundle.discount_percent}%`} color="primary" />
                    )}
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width={64} />
                        <TableCell>المنتج / الظل</TableCell>
                        <TableCell align="center">الكمية</TableCell>
                        <TableCell align="left">السعر</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(bundle.items || []).map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <ProductImage line={line} onZoom={setLightbox} />
                          </TableCell>
                          <TableCell>{line.product_name} {line.shade_name && `- ${line.shade_name}`}</TableCell>
                          <TableCell align="center">{line.quantity}</TableCell>
                          <TableCell align="left">{formatMoney(line.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Typography fontWeight={700} color="primary" sx={{ mt: 1.5 }}>
                    إجمالي الباكج: {formatMoney(bundle.total_price)}
                  </Typography>
                </Box>
              ))}
            </SectionCard>
          )}

          {items.length > 0 && (
            <SectionCard title="المنتجات" accent="#5e35b1">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary' } }}>
                    <TableCell width={64} />
                    <TableCell>المنتج / الظل</TableCell>
                    <TableCell align="center">الكمية</TableCell>
                    <TableCell align="left">السعر</TableCell>
                    <TableCell align="left">الإجمالي</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <ProductImage line={item} onZoom={setLightbox} />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{item.product_name}</Typography>
                        {item.shade_name && (
                          <Typography variant="caption" color="text.secondary">{item.shade_name}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="left">{formatMoney(item.price)}</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 600 }}>{formatMoney((item.price || 0) * (item.quantity || 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {bundles.length === 0 && items.length === 0 && (
            <Alert severity="info">لا توجد منتجات في هذا الطلب</Alert>
          )}
        </Grid>

        {/* الشريط الجانبي */}
        <Grid item xs={12} lg={4}>
          <SectionCard title="ملخص المبالغ" icon={ReceiptIcon} accent="#5e35b1">
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">المجموع</Typography>
                <Typography fontWeight={600}>{formatMoney(order.total_price)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">رسوم التوصيل</Typography>
                <Typography fontWeight={600}>{formatMoney(order.delivery_fee)}</Typography>
              </Box>
              {(order.discount || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">الخصم</Typography>
                  <Typography fontWeight={600} color="success.main">-{formatMoney(order.discount)}</Typography>
                </Box>
              )}
              {order.coupon_code && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">كوبون</Typography>
                  <Chip size="small" label={order.coupon_code} />
                </Box>
              )}
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700}>الإجمالي النهائي</Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">{formatMoney(order.final_price)}</Typography>
              </Box>
            </Stack>
          </SectionCard>

          <SectionCard title="معلومات التوصيل" icon={LocationIcon}>
            <InfoRow icon={LocationIcon} label="العنوان" value={order.address} />
            <InfoRow icon={LocationIcon} label="المحافظة / المدينة" value={order.city} />
            <InfoRow icon={PhoneIcon} label="هاتف التوصيل" value={order.phone} />
            {order.notes && <InfoRow icon={NotesIcon} label="ملاحظات" value={order.notes} />}
          </SectionCard>

          <SectionCard title="الدفع" icon={PaymentIcon}>
            <InfoRow label="طريقة الدفع" value={paymentLabels[order.payment_method] || order.payment_method} />
          </SectionCard>

          {(order.customer_name || order.customer_phone) && (
            <SectionCard title="العميل" icon={PersonIcon}>
              <InfoRow icon={PersonIcon} label="الاسم" value={order.customer_name} />
              <InfoRow icon={PhoneIcon} label="الهاتف" value={order.customer_phone} />
            </SectionCard>
          )}
        </Grid>
      </Grid>

      <ImageLightbox
        open={lightbox.open}
        src={lightbox.src}
        alt={lightbox.alt}
        title={lightbox.title}
        onClose={() => setLightbox((p) => ({ ...p, open: false }))}
      />

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
          <Button variant="contained" color="error" onClick={handleConfirmCancel} disabled={statusUpdating}>
            تأكيد الإلغاء
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: 'error.main' }}>حذف الطلب #{order.id}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>هذا الإجراء نهائي ولا يمكن التراجع عنه.</Alert>
          <Typography variant="body2" color="text.secondary">
            {['pending', 'preparing_shipping'].includes(displayStatus)
              ? 'سيتم إرجاع الكميات للمخزون تلقائياً.'
              : 'لن يتم تعديل المخزون (الطلب مُسلّم أو ملغي).'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>تراجع</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>حذف نهائياً</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
