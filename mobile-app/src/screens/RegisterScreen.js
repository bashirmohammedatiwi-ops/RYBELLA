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
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('خطأ', 'يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    try {
      setLoading(true);
      await register({ name, email, phone, password });
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل إنشاء الحساب');
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
        <Text style={styles.headerTitle}>ريبيلا العراق</Text>
        <Text style={styles.headerSubtitle}>إنشاء حساب جديد</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
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
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="right"
        />
        <TextInput
          style={styles.input}
          placeholder="رقم الهاتف"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          textAlign="right"
        />
        <TextInput
          style={styles.input}
          placeholder="كلمة المرور"
          placeholderTextColor="#999"
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
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>تسجيل</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>لديك حساب؟ سجل الدخول</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 6,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 28,
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
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
