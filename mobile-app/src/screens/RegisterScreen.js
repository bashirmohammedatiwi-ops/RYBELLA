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
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    if (!agreeTerms) {
      toast.error('يرجى الموافقة على الشروط والأحكام');
      return;
    }
    try {
      setLoading(true);
      await register({ name, email, phone, password });
      await mergeGuestCart();
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <LotusLogo />
        <Text style={styles.title}>مرحباً</Text>
        <Text style={styles.subtitle}>أنشئ حسابك للبدء بتجربة التسوق</Text>
      </View>
      <Animated.View style={[styles.formWrap, { opacity: fadeForm }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.input}
            placeholder="الاسم"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="رقم الهاتف"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="تأكيد كلمة المرور"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign="right"
          />
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreeTerms((v) => !v)}
          >
            <Icon
              name={agreeTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={agreeTerms ? colors.primary : colors.border}
            />
            <Text style={styles.termsText}>أوافق على الشروط والأحكام</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <View style={[styles.buttonInner, { backgroundColor: colors.primary }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>إنشاء الحساب</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>لديك حساب؟ سجل الدخول</Text>
          </TouchableOpacity>
        </ScrollView>
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
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  formWrap: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 28,
    paddingBottom: 40,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  termsText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
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
});
