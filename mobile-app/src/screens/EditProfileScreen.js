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
import { colors, borderRadius, shadows, typography } from '../theme';

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
    padding: 20,
    paddingTop: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  title: { ...typography.h2, fontSize: 20, color: colors.text, flex: 1, textAlign: 'center' },
  form: { padding: 24 },
  label: { ...typography.label, marginBottom: 10, color: colors.text },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(232,93,122,0.15)',
    borderRadius: 20,
    padding: 16,
    ...typography.body,
    color: colors.text,
    marginBottom: 22,
    textAlign: 'right',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 22,
    alignItems: 'center',
    ...shadows.premium,
  },
  saveBtnText: { ...typography.h3, color: '#fff' },
  disabled: { opacity: 0.7 },
});
