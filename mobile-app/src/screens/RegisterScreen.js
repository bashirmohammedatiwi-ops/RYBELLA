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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { colors, borderRadius, shadows, gradients } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
      <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
        <Text style={styles.headerTitle}>ريبيلا العراق</Text>
        <Text style={styles.headerSubtitle}>إنشاء حساب جديد</Text>
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <View style={[styles.buttonGradient, { backgroundColor: colors.primary }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>تسجيل</Text>
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
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 8,
  },
  formWrap: { flex: 1, marginTop: -20, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 28,
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
  buttonGradient: { padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
