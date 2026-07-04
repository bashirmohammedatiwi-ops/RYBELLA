import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Percent as PercentIcon,
  ClearAll as ClearIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { manualDiscountAPI } from '../services/api';

function toLocalInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ar-IQ');
}

export default function ManualDiscounts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [discountPercent, setDiscountPercent] = useState('');
  const [until, setUntil] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatus = async () => {
    try {
      const { data } = await manualDiscountAPI.getStatus();
      setStatus(data);
      if (data?.current_discount_percent != null && !discountPercent) {
        setDiscountPercent(String(data.current_discount_percent));
      }
      if (data?.current_until && !until) {
        setUntil(toLocalInputValue(data.current_until));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل حالة الخصم اليدوي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleApplyAll = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { data } = await manualDiscountAPI.applyAll({
        discount_percent: Number(discountPercent),
        until: until ? new Date(until).toISOString() : null,
      });
      setSuccess(data?.message || 'تم تطبيق الخصم على جميع المنتجات');
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر تطبيق الخصم');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('إلغاء الخصم اليدوي عن جميع المنتجات واستعادة أسعار السيرفر؟')) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { data } = await manualDiscountAPI.clearAll();
      setSuccess(data?.message || 'تم إلغاء الخصم اليدوي');
      setDiscountPercent('');
      setUntil('');
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إلغاء الخصم');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>الخصم اليدوي</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        الخصم اليدوي منفصل عن خصم نظام المبيعات (Alhayaa). يُطبَّق على السعر الأصلي من السيرفر،
        وعند انتهاء المدة تُستعاد الأسعار التلقائية تلقائياً.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">الحالة الحالية</Typography>
              <Stack spacing={1.2} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  عناصر بخصم يدوي نشط: <strong>{status?.active_variants ?? 0}</strong>
                </Typography>
                <Typography variant="body2">
                  الخصم اليدوي الحالي: <strong>{status?.current_discount_percent != null ? `${status.current_discount_percent}%` : '—'}</strong>
                </Typography>
                <Typography variant="body2">
                  ينتهي في: <strong>{formatDateTime(status?.current_until)}</strong>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                <Typography variant="h6" fontWeight={700}>تطبيق خصم على كل المنتجات</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="نسبة الخصم %"
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      fullWidth
                      inputProps={{ min: 1, max: 100 }}
                      placeholder="مثال: 15"
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="تاريخ ووقت انتهاء الخصم"
                      type="datetime-local"
                      value={until}
                      onChange={(e) => setUntil(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Alert severity="info" icon={<ScheduleIcon />}>
                  بعد انتهاء المدة، يعود السعر تلقائياً لما يأتي من نظام المبيعات (الخصم التلقائي).
                </Alert>

                <Divider />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={<PercentIcon />}
                    onClick={handleApplyAll}
                    disabled={saving || !discountPercent || !until}
                  >
                    تطبيق على جميع المنتجات
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ClearIcon />}
                    onClick={handleClearAll}
                    disabled={saving}
                  >
                    إلغاء الخصم اليدوي للكل
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
