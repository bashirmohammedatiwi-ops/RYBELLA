/**
 * Rybella Iraq - ثيم مميز لمتجر التجميل
 */
export const colors = {
  primary: '#6B4FA3',
  primaryDark: '#4A3575',
  primaryLight: '#8B6BB8',
  primarySoft: '#EDE7F6',
  accent: '#E8A87C',
  white: '#FFFFFF',
  background: '#F8F7FC',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#5C5C6D',
  textMuted: '#9E9EAB',
  border: '#E8E6F0',
  borderLight: '#F0EEF5',
  success: '#2E7D32',
  error: '#C62828',
  warning: '#EF6C00',
  info: '#2196F3',
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

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: '#6B4FA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    shadowColor: '#6B4FA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
};
