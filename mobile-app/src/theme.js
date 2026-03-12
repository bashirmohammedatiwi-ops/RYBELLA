/**
 * Rybella - World-Class Premium Design System
 * مستوحى من أفضل تطبيقات التجميل العالمية
 */
export const colors = {
  primary: '#E85D7A',           // وردي أنيق
  primaryDark: '#C94A66',
  primaryLight: '#F08FA6',
  primarySoft: '#FFE8EC',
  primaryMuted: 'rgba(232, 93, 122, 0.12)',
  primaryDarkText: '#B86B7A',
  accent: '#D4A5A5',           // وردي رمادي فاخر
  accentLight: '#F5E6E8',
  white: '#FFFFFF',
  cream: '#FFF9FA',
  background: '#FFF9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8E8E93',
  textInverse: '#FFFFFF',
  border: '#EBEBEB',
  borderLight: '#F5F5F5',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#5AC8FA',
  pastelLavender: '#F2F0F8',
  pastelPeach: '#FFF5F0',
  pastelMint: '#E8F8F0',
  pastelBlue: '#E8F4FD',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  pill: 999,
  full: 9999,
};

/** خطوط Tajawal العربية - للاستخدام بعد تحميل الخطوط */
export const fonts = {
  black: 'Tajawal_900Black',
  extraBold: 'Tajawal_800ExtraBold',
  bold: 'Tajawal_700Bold',
  medium: 'Tajawal_500Medium',
  regular: 'Tajawal_400Regular',
};

export const typography = {
  display: { fontSize: 36, fontFamily: 'Tajawal_900Black', letterSpacing: -0.8 },
  hero: { fontSize: 32, fontFamily: 'Tajawal_800ExtraBold', letterSpacing: -0.5 },
  h1: { fontSize: 26, fontFamily: 'Tajawal_800ExtraBold', letterSpacing: -0.3 },
  h2: { fontSize: 22, fontFamily: 'Tajawal_700Bold', letterSpacing: -0.2 },
  h3: { fontSize: 18, fontFamily: 'Tajawal_700Bold' },
  h4: { fontSize: 16, fontFamily: 'Tajawal_700Bold' },
  body: { fontSize: 15, lineHeight: 24, fontFamily: 'Tajawal_400Regular' },
  bodySmall: { fontSize: 14, lineHeight: 22, fontFamily: 'Tajawal_400Regular' },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: 'Tajawal_500Medium' },
  overline: { fontSize: 11, fontFamily: 'Tajawal_700Bold', letterSpacing: 0.8 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium' },
};

export const shadows = {
  none: { shadowOpacity: 0, elevation: 0 },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  premium: {
    shadowColor: '#E85D7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    shadowColor: '#E85D7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const gradients = {
  primary: ['#E85D7A', '#F08FA6'],
  primaryDark: ['#C94A66', '#E85D7A'],
  hero: ['#FFF9FA', '#FFE8EC'],
  card: ['#FFFFFF', '#FFF9FA'],
  light: ['#FFFFFF', '#FFF9FA'],
  accent: ['#D4A5A5', '#F5E6E8'],
  overlay: ['transparent', 'rgba(0,0,0,0.4)'],
};

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: { damping: 15, stiffness: 150 },
};
