import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { cartAPI } from '../services/api';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows } from '../theme';

export default function CartScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCart);
    loadCart();
    return unsubscribe;
  }, [navigation, user]);

  const loadCart = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await cartAPI.get();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await cartAPI.updateItem(itemId, { quantity });
      loadCart();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      loadCart();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحذف');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!user) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon name="shopping-cart" size={64} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>سلة التسوق</Text>
        <Text style={styles.emptyText}>سجّل الدخول لعرض سلة التسوق وإتمام طلبك</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.shopBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.guestText}>تصفح كضيف</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon name="shopping-cart" size={64} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>سلة التسوق فارغة</Text>
        <Text style={styles.emptyText}>أضف منتجاتك المفضلة وابدأ التسوق</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.shopBtnText}>تسوق الآن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image
              source={{
                uri: item.variant_image
                  ? `${API_BASE}${item.variant_image}`
                  : item.product_image
                  ? `${API_BASE}${item.product_image}`
                  : 'https://via.placeholder.com/80',
              }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product_name} - {item.shade_name}
              </Text>
              <Text style={styles.itemPrice}>
                {Number(item.price).toLocaleString('ar-IQ')} د.ع
              </Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  onPress={() => handleUpdateQty(item.id, item.quantity - 1)}
                >
                  <Icon name="remove-circle-outline" size={28} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => handleUpdateQty(item.id, item.quantity + 1)}
                >
                  <Icon name="add-circle-outline" size={28} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item.id)}>
              <Icon name="delete" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>المجموع</Text>
        <Text style={styles.total}>{total.toLocaleString('ar-IQ')} د.ع</Text>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>إتمام الطلب</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.textSecondary, marginVertical: 12, textAlign: 'center', lineHeight: 22 },
  shopBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: borderRadius.lg,
    marginTop: 8,
    ...shadows.button,
  },
  shopBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  guestBtn: { marginTop: 16, padding: 12 },
  guestText: { color: colors.textSecondary, fontSize: 15 },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: borderRadius.lg,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.soft,
  },
  itemImage: { width: 88, height: 88, borderRadius: borderRadius.md },
  itemInfo: { flex: 1, marginHorizontal: 14 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 4, color: colors.text },
  itemPrice: { fontSize: 15, color: colors.primary, marginBottom: 8, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qty: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  footer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  total: { fontSize: 24, fontWeight: '800', color: colors.primary, marginVertical: 10 },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  checkoutText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
