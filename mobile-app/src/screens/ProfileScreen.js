import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { colors, borderRadius, shadows, spacing, typography } from '../theme';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم', onPress: () => logout() },
    ]);
  };

  const handleDeleteAccountPress = () => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('خطأ', 'أدخل كلمة المرور للتأكيد');
      return;
    }
    setDeleteLoading(true);
    try {
      await authAPI.deleteAccount(deletePassword.trim());
      setDeleteModalVisible(false);
      setDeletePassword('');
      await logout();
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل حذف الحساب');
    } finally {
      setDeleteLoading(false);
    }
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
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Icon name="privacy-tip" size={18} color={colors.textMuted} />
            <Text style={styles.footerLinkText}>سياسة الخصوصية</Text>
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

        <TouchableOpacity style={[styles.menuItem, styles.deleteItem]} onPress={handleDeleteAccountPress}>
          <Icon name="delete-forever" size={24} color={colors.error} />
          <Text style={[styles.menuText, styles.deleteText]}>حذف الحساب</Text>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Icon name="privacy-tip" size={24} color={colors.primary} />
          <Text style={styles.menuText}>سياسة الخصوصية</Text>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>حذف الحساب</Text>
              <Text style={styles.modalDesc}>
                سيتم حذف حسابك وكل بياناتك نهائياً ولا يمكن التراجع. أدخل كلمة المرور للتأكيد.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="كلمة المرور"
                placeholderTextColor={colors.textMuted}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!deleteLoading}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => setDeleteModalVisible(false)}
                  disabled={deleteLoading}
                >
                  <Text style={styles.modalBtnCancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBtnDelete}
                  onPress={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalBtnDeleteText}>حذف نهائياً</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  footerLinkText: { ...typography.bodySmall, color: colors.textMuted },
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
  deleteItem: { borderBottomWidth: 0 },
  deleteText: { color: colors.error },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: { alignItems: 'center' },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: { ...typography.h4, textAlign: 'center', marginBottom: spacing.lg },
  modalDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...typography.body,
    marginBottom: spacing.xl,
    textAlign: 'right',
  },
  modalButtons: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'center' },
  modalBtnCancel: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnCancelText: { ...typography.label, color: colors.textSecondary },
  modalBtnDelete: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
  },
  modalBtnDeleteText: { ...typography.label, color: colors.textInverse },
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
