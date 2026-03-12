import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows, spacing, typography } from '../theme';

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
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
            <View style={[styles.loginBtnGradient, { backgroundColor: colors.primary }]}>
              <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
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
          <Icon name="receipt-long" size={24} color={colors.primary} />
          <Text style={styles.menuText}>طلباتي</Text>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <Icon name="favorite" size={24} color={colors.primary} />
          <Text style={styles.menuText}>قائمة الأمنيات</Text>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon name="edit" size={24} color={colors.primary} />
          <Text style={styles.menuText}>تعديل الملف الشخصي</Text>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Icon name="lock" size={24} color={colors.primary} />
          <Text style={styles.menuText}>تغيير كلمة المرور</Text>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="logout" size={24} color={colors.error} />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  guestCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginTop: spacing.xxl,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    ...shadows.md,
  },
  guestText: { ...typography.body, textAlign: 'center', color: colors.textSecondary, marginTop: spacing.lg },
  loginBtn: { marginTop: spacing.xxl, borderRadius: 20, overflow: 'hidden', ...shadows.premium },
  loginBtnGradient: { paddingVertical: 18, paddingHorizontal: 36, alignItems: 'center' },
  loginBtnText: { ...typography.h4, color: colors.textInverse },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.section,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.primarySoft,
    ...shadows.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textInverse, fontSize: 40, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', marginTop: spacing.lg, color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  menu: {
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.lg,
  },
  menuText: { flex: 1, ...typography.body, color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  logoutText: { ...typography.label, color: colors.error },
});
