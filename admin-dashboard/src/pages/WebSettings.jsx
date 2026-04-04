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
import { webSettingsAPI } from '../services/api';

export default function WebSettings() {
  const [settings, setSettings] = useState({
    hero_title: '',
    hero_subtitle: '',
    site_title: '',
    primary_color: '#e07c4c',
  });
  const [showBanners, setShowBanners] = useState(true);
  const [showOffers, setShowOffers] = useState(true);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    webSettingsAPI
      .get()
      .then((r) => {
        const d = r?.data || {};
        setSettings({
          hero_title: d.hero_title || 'تسوق التجميل بفرح',
          hero_subtitle: d.hero_subtitle || 'اكتشفي تشكيلة واسعة من مستحضرات التجميل الأصلية',
          site_title: d.site_title || 'Rybella Iraq',
          primary_color: d.primary_color || '#e07c4c',
        });
        setShowBanners(d.show_banners !== '0');
        setShowOffers(d.show_offers !== '0');
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMsg('');
    try {
      await webSettingsAPI.update({
        ...settings,
        show_banners: showBanners ? '1' : '0',
        show_offers: showOffers ? '1' : '0',
      });
      setMsg('تم حفظ إعدادات الويب بنجاح');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ direction: 'rtl', maxWidth: 640 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        إعدادات الويب
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        إعدادات خاصة بالمتجر الإلكتروني (storefront-premium) وعرض المحتوى
      </Typography>
      {msg && (
        <Alert severity={msg.includes('خطأ') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {msg}
        </Alert>
      )}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            نص الصفحة الرئيسية
          </Typography>
          <TextField
            fullWidth
            label="عنوان البانر (Hero)"
            value={settings.hero_title}
            onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="نص فرعي (Subtitle)"
            value={settings.hero_subtitle}
            onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="اسم الموقع"
            value={settings.site_title}
            onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="اللون الأساسي (Hex)"
            value={settings.primary_color}
            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
            placeholder="#e07c4c"
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
            عرض الأقسام
          </Typography>
          <FormControlLabel
            control={<Switch checked={showBanners} onChange={(e) => setShowBanners(e.target.checked)} />}
            label="عرض البانرات"
          />
          <br />
          <FormControlLabel
            control={<Switch checked={showOffers} onChange={(e) => setShowOffers(e.target.checked)} />}
            label="عرض العروض"
          />
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الويب'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
