import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { backupAPI } from '../services/api';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ar-IQ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await backupAPI.list();
      setBackups(res.data?.backups || []);
    } catch (e) {
      setError(e.response?.data?.message || 'تعذّر تحميل قائمة النسخ الاحتياطية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    setMsg('');
    try {
      const res = await backupAPI.create();
      setMsg(res.data?.message || 'تم إنشاء النسخة الاحتياطية');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename) => {
    setDownloading(filename);
    setError('');
    setMsg('');
    try {
      const res = await backupAPI.getDownloadLink(filename);
      const url = res.data?.url;
      if (!url) throw new Error('no url');
      setMsg(`بدء تحميل ${filename} — راقبي شريط التحميل في المتصفح (قد يستغرق دقائق للملفات الكبيرة)`);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError(e.response?.data?.message || 'تعذّر بدء التحميل');
    } finally {
      window.setTimeout(() => setDownloading(''), 2000);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`حذف النسخة "${filename}"؟`)) return;
    setError('');
    try {
      await backupAPI.delete(filename);
      setMsg('تم حذف النسخة الاحتياطية');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'تعذّر حذف النسخة');
    }
  };

  return (
    <Box sx={{ direction: 'rtl', maxWidth: 960 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          النسخ الاحتياطية
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading || creating}>
            تحديث
          </Button>
          <Button
            variant="contained"
            startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <BackupIcon />}
            onClick={handleCreate}
            disabled={creating || loading}
            sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}
          >
            {creating ? 'جاري الإنشاء...' : 'نسخة احتياطية جديدة'}
          </Button>
        </Box>
      </Box>

      {msg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            ما الذي تتضمنه النسخة؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
            كل نسخة احتياطية ملف ZIP يحتوي على:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="قاعدة البيانات (rybella.db)" color="primary" variant="outlined" />
            <Chip label="صور المنتجات والبانرات (uploads/)" color="primary" variant="outlined" />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            يُحفظ تلقائياً آخر 15 نسخة. ننصح بتحميل نسخة دورياً وحفظها خارج السيرفر.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            النسخ المحفوظة
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : backups.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              لا توجد نسخ احتياطية بعد. اضغط «نسخة احتياطية جديدة» للبدء.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>اسم الملف</TableCell>
                    <TableCell>الحجم</TableCell>
                    <TableCell align="left">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((b) => (
                    <TableRow key={b.filename} hover>
                      <TableCell>{formatDate(b.createdAt)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{b.filename}</TableCell>
                      <TableCell>{b.sizeLabel}</TableCell>
                      <TableCell align="left">
                        <IconButton
                          color="primary"
                          title="تحميل"
                          onClick={() => handleDownload(b.filename)}
                          disabled={downloading === b.filename}
                        >
                          {downloading === b.filename ? <CircularProgress size={22} /> : <DownloadIcon />}
                        </IconButton>
                        <IconButton color="error" title="حذف" onClick={() => handleDelete(b.filename)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
