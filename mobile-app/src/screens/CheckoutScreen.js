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
        <ActivityIndicator size="large" color="#C2185B" />
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
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="المدينة"
          value={city}
          onChangeText={handleCityChange}
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="رقم الهاتف"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="ملاحظات (اختياري)"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor="#999"
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
            placeholderTextColor="#999"
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
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>تأكيد الطلب</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  couponRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  applyBtn: { backgroundColor: '#C2185B', padding: 12, borderRadius: 8 },
  applyBtnText: { color: '#fff', fontWeight: 'bold' },
  couponSuccess: { color: '#4CAF50', marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#eee' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  total: { fontSize: 20, fontWeight: 'bold', color: '#C2185B' },
  discount: { color: '#4CAF50' },
  paymentNote: { fontSize: 14, color: '#666', marginTop: 8 },
  placeOrderBtn: {
    backgroundColor: '#C2185B',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabled: { opacity: 0.7 },
});
