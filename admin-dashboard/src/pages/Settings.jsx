import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';

const STORAGE_KEYS = {
  storeName: 'rybella_settings_store_name',
  storePhone: 'rybella_settings_store_phone',
  storeEmail: 'rybella_settings_store_email',
  storeAddress: 'rybella_settings_store_address',
  darkMode: 'rybella_settings_dark_mode',
};

export default function Settings() {
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setStoreName(localStorage.getItem(STORAGE_KEYS.storeName) || 'Rybella Iraq');
    setStorePhone(localStorage.getItem(STORAGE_KEYS.storePhone) || '');
    setStoreEmail(localStorage.getItem(STORAGE_KEYS.storeEmail) || '');
    setStoreAddress(localStorage.getItem(STORAGE_KEYS.storeAddress) || '');
    setDarkMode(localStorage.getItem(STORAGE_KEYS.darkMode) === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEYS.storeName, storeName);
    localStorage.setItem(STORAGE_KEYS.storePhone, storePhone);
    localStorage.setItem(STORAGE_KEYS.storeEmail, storeEmail);
    localStorage.setItem(STORAGE_KEYS.storeAddress, storeAddress);
    localStorage.setItem(STORAGE_KEYS.darkMode, String(darkMode));
    setMsg('تم حفظ الإعدادات بنجاح');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <Box sx={{ direction: 'rtl', maxWidth: 600 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>إعدادات المتجر</Typography>
      {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>معلومات المتجر</Typography>
          <TextField fullWidth label="اسم المتجر" value={storeName} onChange={(e) => setStoreName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="رقم الهاتف" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="البريد الإلكتروني" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="العنوان" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} multiline rows={2} sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />} label="الوضع الداكن (قريباً)" sx={{ mb: 2 }} />
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}>
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
