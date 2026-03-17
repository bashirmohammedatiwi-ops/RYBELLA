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
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { webSettingsAPI } from '../services/api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function WebStoreSettings() {
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState({
    hero_title: '',
    hero_subtitle: '',
    site_title: '',
    primary_color: '#E85D7A',
    show_banners: '1',
    show_offers: '1',
    announcement_bar: '',
    announcement_bar_enabled: '0',
    newsletter_enabled: '1',
    free_shipping_threshold: '50000',
    show_recently_viewed: '1',
    quick_view_enabled: '1',
    whatsapp_number: '',
    show_back_to_top: '1',
    show_contact_float: '1',
    show_bottom_nav: '1',
    footer_about: '',
    footer_phone: '',
    footer_email: '',
  });
  const [trustBadges, setTrustBadges] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    webSettingsAPI
      .get()
      .then((r) => {
        const d = r?.data || {};
        setSettings({
          hero_title: d.hero_title || '',
          hero_subtitle: d.hero_subtitle || '',
          site_title: d.site_title || 'Rybella Iraq',
          primary_color: d.primary_color || '#E85D7A',
          show_banners: d.show_banners !== '0' ? '1' : '0',
          show_offers: d.show_offers !== '0' ? '1' : '0',
          announcement_bar: d.announcement_bar || '',
          announcement_bar_enabled: d.announcement_bar_enabled === '1' ? '1' : '0',
          newsletter_enabled: d.newsletter_enabled !== '0' ? '1' : '0',
          free_shipping_threshold: d.free_shipping_threshold || '50000',
          show_recently_viewed: d.show_recently_viewed !== '0' ? '1' : '0',
          quick_view_enabled: d.quick_view_enabled !== '0' ? '1' : '0',
          whatsapp_number: d.whatsapp_number || '',
          show_back_to_top: d.show_back_to_top !== '0' ? '1' : '0',
          show_contact_float: d.show_contact_float !== '0' ? '1' : '0',
          show_bottom_nav: d.show_bottom_nav !== '0' ? '1' : '0',
          footer_about: d.footer_about || '',
          footer_phone: d.footer_phone || '',
          footer_email: d.footer_email || '',
        });
        setTrustBadges(Array.isArray(d.trust_badges) ? d.trust_badges : [
          { icon: 'truck', text: 'توصيل سريع' },
          { icon: 'shield', text: 'دفع آمن' },
          { icon: 'gift', text: 'هدية مع كل طلب' },
          { icon: 'refresh', text: 'استرجاع سهل' },
        ]);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMsg('');
    try {
      await webSettingsAPI.update({
        ...settings,
        trust_badges: trustBadges,
      });
      setMsg('تم حفظ إعدادات متجر الويب بنجاح');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const updateBadge = (i, field, val) => {
    const next = [...trustBadges];
    next[i] = { ...(next[i] || {}), [field]: val };
    setTrustBadges(next);
  };

  return (
    <Box sx={{ direction: 'rtl', maxWidth: 720 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        إعدادات متجر الويب
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        إعدادات خاصة بالمتجر الإلكتروني فقط — لا تؤثر على تطبيق الهاتف
      </Typography>
      {msg && (
        <Alert severity={msg.includes('خطأ') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {msg}
        </Alert>
      )}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="الصفحة الرئيسية" />
          <Tab label="خصائص المتجر" />
          <Tab label="التذييل والثقة" />
        </Tabs>
        <CardContent>
          <TabPanel value={tab} index={0}>
            <TextField
              fullWidth label="عنوان البانر"
              value={settings.hero_title}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="النص الفرعي"
              value={settings.hero_subtitle}
              onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
              multiline rows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="اسم الموقع"
              value={settings.site_title}
              onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="اللون الأساسي (Hex)"
              value={settings.primary_color}
              onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Switch checked={settings.show_banners === '1'} onChange={(e) => setSettings({ ...settings, show_banners: e.target.checked ? '1' : '0' })} />}
              label="عرض البانرات"
            />
            <br />
            <FormControlLabel
              control={<Switch checked={settings.show_offers === '1'} onChange={(e) => setSettings({ ...settings, show_offers: e.target.checked ? '1' : '0' })} />}
              label="عرض العروض"
            />
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              شريط الإعلانات (أعلى الصفحة)
            </Typography>
            <FormControlLabel
              control={<Switch checked={settings.announcement_bar_enabled === '1'} onChange={(e) => setSettings({ ...settings, announcement_bar_enabled: e.target.checked ? '1' : '0' })} />}
              label="تفعيل شريط الإعلانات"
            />
            <TextField
              fullWidth
              label="نص الشريط (مثال: توصيل مجاني للطلبات فوق 50,000 د.ع)"
              value={settings.announcement_bar}
              onChange={(e) => setSettings({ ...settings, announcement_bar: e.target.value })}
              sx={{ mt: 1, mb: 2 }}
            />
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={<Switch checked={settings.newsletter_enabled === '1'} onChange={(e) => setSettings({ ...settings, newsletter_enabled: e.target.checked ? '1' : '0' })} />}
              label="عرض نموذج الاشتراك في النشرة البريدية"
            />
            <br />
            <TextField
              fullWidth
              type="number"
              label="حد التوصيل المجاني (د.ع)"
              value={settings.free_shipping_threshold}
              onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
              sx={{ mt: 1, mb: 2 }}
            />
            <FormControlLabel
              control={<Switch checked={Boolean(settings.show_recently_viewed === '1')} onChange={(e) => setSettings({ ...settings, show_recently_viewed: e.target.checked ? '1' : '0' })} />}
              label="عرض قسم «شاهدته مؤخراً»"
            />
            <br />
            <FormControlLabel
              control={<Switch checked={Boolean(settings.quick_view_enabled === '1')} onChange={(e) => setSettings({ ...settings, quick_view_enabled: e.target.checked ? '1' : '0' })} />}
              label="تفعيل المعاينة السريعة (عند مرور المؤشر على المنتج)"
            />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>خصائص الجوال والويب</Typography>
            <FormControlLabel
              control={<Switch checked={settings.show_bottom_nav !== '0'} onChange={(e) => setSettings({ ...settings, show_bottom_nav: e.target.checked ? '1' : '0' })} />}
              label="شريط تنقل سفلي على الهاتف"
            />
            <br />
            <FormControlLabel
              control={<Switch checked={settings.show_back_to_top !== '0'} onChange={(e) => setSettings({ ...settings, show_back_to_top: e.target.checked ? '1' : '0' })} />}
              label="زر العودة للأعلى عند التمرير"
            />
            <br />
            <FormControlLabel
              control={<Switch checked={settings.show_contact_float !== '0'} onChange={(e) => setSettings({ ...settings, show_contact_float: e.target.checked ? '1' : '0' })} />}
              label="زر واتساب عائم للتواصل"
            />
            <TextField
              fullWidth
              label="رقم واتساب (مثال: 9647712345678)"
              value={settings.whatsapp_number}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              placeholder="9647712345678"
              sx={{ mt: 1, mb: 2 }}
            />
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>بيانات التذييل</Typography>
            <TextField
              fullWidth label="نبذة عن المتجر"
              value={settings.footer_about}
              onChange={(e) => setSettings({ ...settings, footer_about: e.target.value })}
              multiline rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="رقم الهاتف"
              value={settings.footer_phone}
              onChange={(e) => setSettings({ ...settings, footer_phone: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="البريد الإلكتروني"
              value={settings.footer_email}
              onChange={(e) => setSettings({ ...settings, footer_email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>شارات الثقة (تظهر أسفل الصفحة)</Typography>
            {trustBadges.map((b, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField size="small" label="أيقونة" value={b.icon || ''} onChange={(e) => updateBadge(i, 'icon', e.target.value)} placeholder="truck" sx={{ width: 120 }} />
                <TextField size="small" label="النص" value={b.text || ''} onChange={(e) => updateBadge(i, 'text', e.target.value)} sx={{ flex: 1 }} />
              </Box>
            ))}
          </TabPanel>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: '#E85D7A', '&:hover': { bgcolor: '#C94A66' } }}>
              {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
