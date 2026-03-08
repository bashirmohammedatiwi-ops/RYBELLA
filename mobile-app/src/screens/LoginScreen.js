import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { colors, borderRadius, shadows } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    try {
      setLoading(true);
      const { data } = await authAPI.login({ email, password });
      await login(data.user, data.token);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>ريبيلا العراق</Text>
        <Text style={styles.subtitle}>مستحضرات تجميل على هاتفك</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.formTitle}>تسجيل الدخول</Text>
        <TextInput
          style={styles.input}
          placeholder="البريد الإلكتروني"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="كلمة المرور"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>ليس لديك حساب؟ سجل الآن</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGuest} style={styles.guestBtn}>
          <Text style={styles.guestText}>الدخول كضيف</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 6,
  },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 28,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'right',
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.button,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  guestBtn: {
    marginTop: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
  },
  guestText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
