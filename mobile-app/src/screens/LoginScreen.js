import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { authAPI } from '../services/api';
import { colors, borderRadius, shadows, gradients } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { mergeGuestCart } = useCart();
  const toast = useToast();
  const fadeForm = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeForm, {
      toValue: 1,
      duration: 500,
      delay: 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    try {
      setLoading(true);
      const { data } = await authAPI.login({ email, password });
      await login(data.user, data.token);
      await mergeGuestCart();
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الدخول');
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
      <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
        <Text style={styles.title}>ريبيلا العراق</Text>
        <Text style={styles.subtitle}>مستحضرات تجميل على هاتفك</Text>
      </View>
      <Animated.View style={[styles.formWrap, { opacity: fadeForm }]}>
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
            <View style={[styles.buttonGradient, { backgroundColor: colors.primary }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>تسجيل الدخول</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>ليس لديك حساب؟ سجل الآن</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGuest} style={styles.guestBtn}>
            <Text style={styles.guestText}>الدخول كضيف</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 8,
  },
  formWrap: { flex: 1, marginTop: -20, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.background },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
    backgroundColor: colors.surface,
  },
  button: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: 8,
    ...shadows.button,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  guestBtn: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
  },
  guestText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
