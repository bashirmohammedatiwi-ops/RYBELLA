import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { cartAPI, deliveryZonesAPI, couponsAPI, ordersAPI } from '../services/api';
import { colors, borderRadius, shadows } from '../theme';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const [cart, setCart] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cartRes, zonesRes] = await Promise.all([
        cartAPI.get(),
        deliveryZonesAPI.getAll(),
      ]);
      setCart(Array.isArray(cartRes.data) ? cartRes.data : []);
      setZones(zonesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);
    if (!couponCode.trim() || !cartItems.length) return;
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    try {
      const { data } = await couponsAPI.apply({ code: couponCode.trim(), total_price: total });
      setCouponApplied(data);
    } catch (err) {
      alert(err.response?.data?.message || 'كود غير صالح');
    }
  };

  const handleCityChange = (c) => {
    setCity(c);
    const zone = zones.find((z) => z.city === c);
    setDeliveryFee(zone ? Number(zone.delivery_fee) : 0);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !city.trim() || !phone.trim()) {
      alert('يرجى إدخال العنوان والمدينة ورقم الهاتف');
      return;
    }
    setSubmitting(true);
    try {
      const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);
      const items = cartItems.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
      }));
      await ordersAPI.create({
        items,
        address,
        city,
        phone,
        notes,
        payment_method: 'cash',
        coupon_code: couponApplied ? couponCode.trim() : null,
      });
      Alert.alert('نجاح', 'تم تقديم الطلب بنجاح', [
        { text: 'حسناً', onPress: () => navigation.navigate('MainTabs', { screen: 'Orders' }) },
      ]);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || cart === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const items = Array.isArray(cart) ? cart : (cart?.items || []);
  if (items.length === 0) {
    return (
      <View style={[styles.centered, { padding: 24 }]}>
        <Text style={styles.emptyText}>سلة التسوق فارغة</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.shopBtnText}>العودة للسلة</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = couponApplied?.discount_amount || 0;
  const finalTotal = subtotal - discount + deliveryFee;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>عنوان التوصيل</Text>
        <TextInput
          style={styles.input}
          placeholder="العنوان الكامل"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="المدينة"
          value={city}
          onChangeText={handleCityChange}
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="رقم الهاتف"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholder="ملاحظات (اختياري)"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>كود الخصم</Text>
        <View style={styles.couponRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="أدخل الكود"
            value={couponCode}
            onChangeText={setCouponCode}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApplyCoupon}
          >
            <Text style={styles.applyBtnText}>تطبيق</Text>
          </TouchableOpacity>
        </View>
        {couponApplied && (
          <Text style={styles.couponSuccess}>
            خصم {couponApplied.discount_percent}% = {couponApplied.discount_amount?.toLocaleString('ar-IQ')} د.ع
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ملخص الطلب</Text>
        <View style={styles.summaryRow}>
          <Text>المجموع الفرعي</Text>
          <Text>{subtotal.toLocaleString('ar-IQ')} د.ع</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>رسوم التوصيل</Text>
          <Text>{deliveryFee.toLocaleString('ar-IQ')} د.ع</Text>
        </View>
        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text>الخصم</Text>
            <Text style={styles.discount}>-{discount.toLocaleString('ar-IQ')} د.ع</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.total}>{finalTotal.toLocaleString('ar-IQ')} د.ع</Text>
        </View>
        <Text style={styles.paymentNote}>الدفع عند الاستلام</Text>
      </View>

      <TouchableOpacity
        style={[styles.placeOrderBtn, submitting && styles.disabled]}
        onPress={handlePlaceOrder}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.placeOrderText}>تأكيد الطلب</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { backgroundColor: colors.surface, padding: 20, marginBottom: 12, borderRadius: borderRadius.lg, marginHorizontal: 16, ...shadows.soft },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, color: colors.text, textAlign: 'right' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    textAlign: 'right',
    color: colors.text,
  },
  couponRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  applyBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: borderRadius.md, ...shadows.soft },
  applyBtnText: { color: colors.white, fontWeight: '700' },
  couponSuccess: { color: colors.success, marginTop: 10, fontSize: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.borderLight },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  total: { fontSize: 22, fontWeight: '800', color: colors.primary },
  discount: { color: colors.success },
  paymentNote: { fontSize: 14, color: colors.textSecondary, marginTop: 10, textAlign: 'right' },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 16 },
  shopBtn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: borderRadius.lg },
  shopBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  placeOrderBtn: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 18,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  placeOrderText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
