import { Platform } from 'react-native';

// الاتصال بالمخزن المحلي (قاعدة بيانات SQLite عبر Backend)
// عند التطوير: إذا لم تحدد EXPO_PUBLIC_API_URL في .env
// - ويب / آيفون: localhost:5000
// - أندرويد محاكي: 10.0.2.2:5000 (10.0.2.2 = الجهاز المضيف)
// - أندرويد جهاز حقيقي: ضع IP جهازك في .env مثل http://192.168.1.5:5000
const getDefaultApiBase = () => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:5000'
      : 'http://localhost:5000';
  }
  return 'http://187.124.23.65:4000';
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL || getDefaultApiBase();
export const API_URL = `${API_BASE}/api`;
export { API_BASE };
