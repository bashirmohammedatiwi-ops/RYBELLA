import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await authAPI.getProfile();
        setName(data.name || '');
        setPhone(data.phone || '');
      } catch (err) {
        if (user) {
          setName(user.name || '');
          setPhone(user.phone || '');
        }
        if (!import.meta.env.DEV) setMsg({ type: 'error', text: 'فشل تحميل الملف الشخصي' });
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await authAPI.updateProfile({ name, phone });
      login({ ...user, name: data.name, phone: data.phone }, localStorage.getItem('token'));
      setMsg({ type: 'success', text: 'تم حفظ التغييرات بنجاح' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'فشل الحفظ' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passForm.new !== passForm.confirm) {
      setPassMsg('كلمة المرور الجديدة والتأكيد غير متطابقتين');
      return;
    }
    if (passForm.new.length < 6) {
      setPassMsg('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setPassMsg('');
    try {
      await authAPI.changePassword({ current_password: passForm.current, new_password: passForm.new });
      setPassMsg('تم تغيير كلمة المرور بنجاح');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPassMsg(err.response?.data?.message || 'فشل تغيير كلمة المرور');
    }
  };

  return (
    <Box sx={{ direction: 'rtl', maxWidth: 600 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>الملف الشخصي</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>معلومات الحساب</Typography>
          {msg.text && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}
          <TextField fullWidth label="الاسم" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="البريد الإلكتروني" value={user?.email} disabled sx={{ mb: 2 }} />
          <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}>
            حفظ التغييرات
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>تغيير كلمة المرور</Typography>
          {passMsg && <Alert severity={passMsg.includes('نجاح') ? 'success' : 'error'} sx={{ mb: 2 }}>{passMsg}</Alert>}
          <TextField fullWidth type="password" label="كلمة المرور الحالية" value={passForm.current} onChange={(e) => setPassForm((p) => ({ ...p, current: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth type="password" label="كلمة المرور الجديدة" value={passForm.new} onChange={(e) => setPassForm((p) => ({ ...p, new: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth type="password" label="تأكيد كلمة المرور الجديدة" value={passForm.confirm} onChange={(e) => setPassForm((p) => ({ ...p, confirm: e.target.value }))} sx={{ mb: 2 }} />
          <Button variant="outlined" onClick={handleChangePassword}>تغيير كلمة المرور</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
