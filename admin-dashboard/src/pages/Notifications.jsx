import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { Add, Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';
import { notificationsAPI } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await notificationsAPI.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);
    try {
      const { data } = await notificationsAPI.create(form);
      const pushInfo = data?.push_devices
        ? ` — وصل ${data.push_sent || 0} جهاز هاتف من ${data.push_devices}`
        : '';
      setSuccess((data?.message || 'تم إرسال الإشعار بنجاح') + pushInfo);
      setOpen(false);
      setForm({ title: '', message: '' });
      loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا الإشعار؟')) return;
    setError('');
    try {
      await notificationsAPI.delete(id);
      setSuccess('تم حذف الإشعار');
      loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الحذف');
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>الإشعارات</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            أرسل إشعارات للزبائن داخل المتجر وإلى الهواتف التي فعّلت الإذن
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SendIcon />} onClick={() => setOpen(true)}>
          إرسال إشعار جديد
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>العنوان</TableCell>
              <TableCell>الرسالة</TableCell>
              <TableCell>المستلمون</TableCell>
              <TableCell>مقروء</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell align="center">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>لا توجد إشعارات بعد</Typography>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell sx={{ fontWeight: 700, maxWidth: 180 }}>{n.title}</TableCell>
                  <TableCell sx={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{n.message}</TableCell>
                  <TableCell>
                    <Chip label={n.recipient_count ?? 0} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${n.read_count ?? 0} / ${n.recipient_count ?? 0}`}
                      size="small"
                      color={(n.read_count ?? 0) > 0 ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{new Date(n.created_at).toLocaleString('ar-IQ')}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="حذف">
                      <IconButton size="small" color="error" onClick={() => handleDelete(n.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => !sending && setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add fontSize="small" />
            إرسال إشعار للزبائن
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            سيصل الإشعار داخل المتجر وإلى الهواتف التي وافقت على إذن الإشعارات.
          </Typography>
            <TextField
              fullWidth
              label="عنوان الإشعار"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              inputProps={{ maxLength: 120 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="نص الإشعار"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              inputProps={{ maxLength: 500 }}
            />
          </DialogContent>
          <DialogActions sx={{ flexDirection: 'row-reverse', px: 3, pb: 2 }}>
            <Button type="submit" variant="contained" disabled={sending} startIcon={<SendIcon />}>
              {sending ? 'جاري الإرسال...' : 'إرسال للجميع'}
            </Button>
            <Button onClick={() => setOpen(false)} disabled={sending}>إلغاء</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
