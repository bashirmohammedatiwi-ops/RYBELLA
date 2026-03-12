import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { deliveryZonesAPI, couponsAPI, ordersAPI } from '../services/api';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { items: cartItems, loadCart } = useCart();
  const toast = useToast();
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
      const zonesRes = await deliveryZonesAPI.getAll();
      setZones(zonesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    if (!couponCode.trim() || !items.length) return;
    const total = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
    try {
      const { data } = await couponsAPI.apply({ code: couponCode.trim(), total_price: total });
      setCouponApplied(data);
      toast.success('تم تطبيق الكود بنجاح');
    } catch (err) {
      toast.error(err.response?.data?.message || 'كود غير صالح');
    }
  };

  const handleCityChange = (c) => {
    setCity(c);
    const zone = zones.find((z) => z.city === c);
    setDeliveryFee(zone ? Number(zone.delivery_fee) : 0);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !city.trim() || !phone.trim()) {
      toast.error('يرجى إدخال العنوان والمدينة ورقم الهاتف');
      return;
    }
    const items = Array.isArray(cartItems) ? cartItems : [];
    if (!items.length) {
      toast.error('سلة التسوق فارغة');
      return;
    }
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity || 1,
      }));
      await ordersAPI.create({
        items: orderItems,
        address,
        city,
        phone,
        notes,
        payment_method: 'cash',
        coupon_code: couponApplied ? couponCode.trim() : null,
      });
      toast.success('تم تقديم الطلب بنجاح');
      loadCart();
      navigation.navigate('MainTabs', { screen: 'Orders' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const items = Array.isArray(cartItems) ? cartItems : [];
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
  section: {
    backgroundColor: colors.surface,
    padding: 24,
    marginBottom: 16,
    borderRadius: 24,
    marginHorizontal: 20,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  sectionTitle: { ...typography.h3, marginBottom: 16, color: colors.text, textAlign: 'right' },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(232,93,122,0.12)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    ...typography.body,
    textAlign: 'right',
    color: colors.text,
  },
  couponRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  applyBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 18, ...shadows.premium },
  applyBtnText: { ...typography.h4, color: colors.white },
  couponSuccess: { ...typography.caption, color: colors.success, marginTop: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  totalRow: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: colors.borderLight },
  totalLabel: { ...typography.h3, color: colors.text },
  total: { ...typography.hero, fontSize: 22, color: colors.primary },
  discount: { ...typography.caption, color: colors.success },
  paymentNote: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 12, textAlign: 'right' },
  emptyText: { ...typography.body, color: colors.textSecondary, marginBottom: 20 },
  shopBtn: { backgroundColor: colors.primary, paddingVertical: 18, paddingHorizontal: 36, borderRadius: 20, ...shadows.premium },
  shopBtnText: { ...typography.h4, color: colors.white },
  placeOrderBtn: {
    backgroundColor: colors.primary,
    margin: 24,
    padding: 22,
    borderRadius: 22,
    alignItems: 'center',
    ...shadows.premium,
  },
  placeOrderText: { ...typography.h3, color: colors.white },
  disabled: { opacity: 0.7 },
});
