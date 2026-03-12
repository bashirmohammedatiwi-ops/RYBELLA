import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { colors, borderRadius, shadows } from '../theme';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await authAPI.getProfile();
      setName(data.name || '');
      setPhone(data.phone || '');
    } catch (err) {
      toast.error('فشل تحميل الملف الشخصي');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await authAPI.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      if (updateUser) updateUser(data);
      toast.success('تم تحديث الملف الشخصي');
      navigation.goBack();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحديث');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-forward" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>تعديل الملف الشخصي</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>الاسم</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="الاسم الكامل"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="07X XXX XXXX"
          keyboardType="phone-pad"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.saveBtn, submitting && styles.disabled]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'right',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
