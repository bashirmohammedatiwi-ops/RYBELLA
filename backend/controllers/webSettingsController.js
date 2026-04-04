const db = require('../config/database');

const DEFAULTS = {
  hero_title: 'تسوق التجميل بفرح',
  hero_subtitle: 'اكتشفي تشكيلة واسعة من مستحضرات التجميل الأصلية',
  site_title: 'Rybella Iraq',
  primary_color: '#E85D7A',
  show_banners: '1',
  show_offers: '1',
  announcement_bar: '',
  announcement_bar_enabled: '0',
  newsletter_enabled: '1',
  free_shipping_threshold: '50000',
  show_recently_viewed: '1',
  quick_view_enabled: '1',
  trust_badges: JSON.stringify([
    { icon: 'truck', text: 'توصيل سريع' },
    { icon: 'shield', text: 'دفع آمن' },
    { icon: 'gift', text: 'هدية مع كل طلب' },
    { icon: 'refresh', text: 'استرجاع سهل' },
  ]),
  footer_about: 'Rybella - الجمال الذي تستحقينه. مستحضرات تجميل أصلية من أفضل العلامات العالمية.',
  footer_phone: '',
  footer_email: '',
  promo_countdown_text: '',
  whatsapp_number: '',
  show_back_to_top: '1',
  show_contact_float: '1',
  show_bottom_nav: '1',
};

exports.get = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM web_settings');
    const settings = { ...DEFAULTS };
    (rows || []).forEach((r) => {
      let v = r.setting_value;
      if (r.setting_key === 'trust_badges' && v) {
        try { v = JSON.parse(v); } catch { /* keep string */ }
      }
      settings[r.setting_key] = v;
    });
    if (typeof settings.trust_badges === 'string') {
      try { settings.trust_badges = JSON.parse(settings.trust_badges); } catch { settings.trust_badges = []; }
    }
    res.json(settings);
  } catch (error) {
    console.error('Get web settings error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

const ALL_KEYS = [
  'hero_title', 'hero_subtitle', 'site_title', 'primary_color',
  'show_banners', 'show_offers', 'announcement_bar', 'announcement_bar_enabled',
  'newsletter_enabled', 'free_shipping_threshold', 'show_recently_viewed',
  'quick_view_enabled', 'trust_badges', 'footer_about', 'footer_phone',
  'footer_email', 'promo_countdown_text',
  'whatsapp_number', 'show_back_to_top', 'show_contact_float', 'show_bottom_nav',
];

exports.update = async (req, res) => {
  try {
    const pairs = ALL_KEYS
      .filter((k) => req.body[k] !== undefined)
      .map((k) => [k, typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : String(req.body[k])]);

    for (const [key, value] of pairs) {
      await db.query(
        'INSERT INTO web_settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = datetime("now")',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error) {
    console.error('Update web settings error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
