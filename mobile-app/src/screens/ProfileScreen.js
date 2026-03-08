import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows } from '../theme';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم', onPress: () => logout() },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestCard}>
          <Icon name="person-outline" size={64} color={colors.textMuted} />
          <Text style={styles.guestText}>سجّل الدخول للوصول لطلباتك وقائمة الأمنيات</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Orders')}
        >
          <Icon name="receipt-long" size={24} color="#333" />
          <Text style={styles.menuText}>طلباتي</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <Icon name="favorite" size={24} color="#333" />
          <Text style={styles.menuText}>قائمة الأمنيات</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#f44336" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  guestCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: borderRadius.xl,
    padding: 32,
    ...shadows.card,
  },
  guestText: { fontSize: 16, textAlign: 'center', color: colors.textSecondary, marginTop: 16, lineHeight: 24 },
  loginBtn: {
    backgroundColor: colors.primary,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: borderRadius.lg,
  },
  loginBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: 16,
    ...shadows.card,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 14, color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    gap: 14,
  },
  menuText: { flex: 1, fontSize: 16, color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 16,
    gap: 8,
  },
  logoutText: { fontSize: 16, color: colors.error, fontWeight: '600' },
});
