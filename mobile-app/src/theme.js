/**
 * Rybella - مستوحى من التصاميم الناعمة
 * وردي باستيل، أبيض، أشكال دائرية
 */
export const colors = {
  // لوحة ناعمة - وردي باستيل كالصور
  primary: '#EB8BA1',        // وردي ناعم
  primaryDark: '#D97A8F',
  primaryDarkText: '#B86B7A',
  primaryLight: '#F5B5C4',
  primarySoft: '#FDDDD9',    // خلفية وردية فاتحة جداً
  accent: '#E8B4A8',         // خوخي/وردي دافئ
  accentLight: '#F5E6E3',
  white: '#FFFFFF',
  cream: '#FFFBF9',
  background: '#FFFFFF',     // أبيض نظيف
  surface: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#5C5C5C',
  textMuted: '#9A9A9A',
  border: '#F0E8E6',
  borderLight: '#F8F4F2',
  success: '#7D9B76',
  error: '#C97B7B',
  warning: '#D4A574',
  info: '#8BA3B8',
  // ألوان باستيل للبطاقات (كما في COSME)
  pastelLavender: '#F5F0F8',
  pastelPeach: '#FFF5F0',
  pastelMint: '#F0F8F5',
  pastelBlue: '#F0F5FA',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// أشكال دائرية جداً - كما في الصور
export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 30,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.2 },
  h2: { fontSize: 20, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
};

// ظلال ناعمة جداً - minimal
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#EB8BA1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  button: {
    shadowColor: '#EB8BA1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const gradients = {
  primary: ['#EB8BA1', '#F5B5C4'],
  header: ['#FDDDD9', '#F5E6E3'],
  light: ['#FFFFFF', '#FFFBF9'],
  accent: ['#E8B4A8', '#F5E6E3'],
  card: ['#FFFFFF', '#FFFBF9'],
};
