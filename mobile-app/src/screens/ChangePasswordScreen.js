import React, { useState } from 'react';
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
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChange = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast.error('كلمة المرور الحالية والجديدة مطلوبة');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('تم تغيير كلمة المرور بنجاح');
      navigation.goBack();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-forward" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>تغيير كلمة المرور</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>كلمة المرور الحالية</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="أدخل كلمة المرور الحالية"
            secureTextEntry={!showCurrent}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowCurrent((s) => !s)}
          >
            <Icon name={showCurrent ? 'visibility-off' : 'visibility'} size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>كلمة المرور الجديدة</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="6 أحرف على الأقل"
            secureTextEntry={!showNew}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowNew((s) => !s)}
          >
            <Icon name={showNew ? 'visibility-off' : 'visibility'} size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>تأكيد كلمة المرور الجديدة</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="أعد إدخال كلمة المرور الجديدة"
          secureTextEntry
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.saveBtn, submitting && styles.disabled]}
          onPress={handleChange}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>تغيير كلمة المرور</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  inputWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, position: 'relative' },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(232,93,122,0.15)',
    borderRadius: 20,
    padding: 16,
    paddingRight: 48,
    ...typography.body,
    color: colors.text,
    textAlign: 'right',
  },
  eyeBtn: { position: 'absolute', left: 12, padding: 8 },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 12,
    ...shadows.premium,
  },
  saveBtnText: { ...typography.h3, color: '#fff' },
  disabled: { opacity: 0.7 },
});
