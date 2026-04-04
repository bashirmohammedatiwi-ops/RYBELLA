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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { authAPI } from '../services/api';
import { colors, borderRadius, shadows, typography } from '../theme';

function LotusLogo() {
  return (
    <View style={styles.logoWrap}>
      <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
        <Icon name="flower-lotus" size={40} color={colors.primary} />
      </View>
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      <View style={styles.header}>
        <LotusLogo />
        <Text style={styles.title}>مرحباً بعودتك!</Text>
        <Text style={styles.subtitle}>سجّل الدخول لمتابعة التسوق</Text>
      </View>
      <Animated.View style={[styles.formWrap, { opacity: fadeForm }]}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني أو رقم الهاتف"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="كلمة المرور"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
            >
              <Icon
                name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={rememberMe ? colors.primary : colors.border}
              />
              <Text style={styles.rememberText}>تذكرني</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toast.show('تواصل معنا لاستعادة كلمة المرور')}>
              <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            <View style={[styles.buttonInner, { backgroundColor: colors.primary }]}>
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
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoWrap: { marginBottom: 20 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  formWrap: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(232,93,122,0.15)',
    borderRadius: 20,
    padding: 18,
    ...typography.body,
    marginBottom: 18,
    textAlign: 'right',
    backgroundColor: colors.white,
  },
  passwordWrap: { position: 'relative', marginBottom: 12 },
  passwordInput: { paddingLeft: 48 },
  eyeBtn: { position: 'absolute', left: 14, top: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { ...typography.body, color: colors.textSecondary },
  forgotText: { ...typography.caption, color: colors.primary },
  button: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    ...shadows.premium,
  },
  buttonInner: { padding: 20, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { ...typography.h3, color: '#fff' },
  link: { marginTop: 28, alignItems: 'center' },
  linkText: { ...typography.label, color: colors.primary },
  guestBtn: {
    marginTop: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(232,93,122,0.2)',
    borderRadius: 20,
  },
  guestText: { ...typography.label, color: colors.textSecondary },
});
