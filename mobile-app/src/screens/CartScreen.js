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
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import * as Haptics from 'expo-haptics';
import { useToast } from '../context/ToastContext';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, gradients } from '../theme';

export default function CartScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { items, loading, updateItem, removeItem, loadCart } = useCart();
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCart);
    loadCart();
    return unsubscribe;
  }, [navigation, user]);

  const handleUpdateQty = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      toast.show(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId);
      toast.show('تم حذف المنتج من السلة');
    } catch (err) {
      toast.show(err.response?.data?.message || 'فشل الحذف');
    }
  };

  const getItemImage = (item) => {
    const uri = item.variant_image || item.product_image || item.image;
    return uri ? `${API_BASE}${uri}` : 'https://via.placeholder.com/80';
  };

  const getItemId = (item) => item.id || item.variant_id;

  if (loading && user) {
    return (
      <LinearGradient colors={gradients.light} style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    );
  }

  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon name="shopping-cart" size={64} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>سلة التسوق فارغة</Text>
        <Text style={styles.emptyText}>
          {user ? 'أضف منتجاتك المفضلة وابدأ التسوق' : 'سجّل الدخول لعرض سلة التسوق أو تصفح وأضف منتجات'}
        </Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <View style={[styles.shopBtnGradient, { backgroundColor: colors.primary }]}>
            <Text style={styles.shopBtnText}>تسوق الآن</Text>
          </View>
        </TouchableOpacity>
        {!user && (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!user && (
        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.9}>
          <View style={[styles.guestBanner, { backgroundColor: colors.primary }]}>
            <Icon name="info" size={20} color="#fff" />
            <Text style={styles.guestBannerText}>سجّل الدخول لإتمام الطلب</Text>
          </View>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => String(getItemId(item))}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: getItemImage(item) }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {(item.product_name || item.name) + (item.shade_name ? ` - ${item.shade_name}` : '')}
              </Text>
              <Text style={styles.itemPrice}>
                {Number(item.price || 0).toLocaleString('ar-IQ')} د.ع
              </Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => handleUpdateQty(getItemId(item), (item.quantity || 1) - 1)}>
                  <Icon name="remove-circle-outline" size={28} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => handleUpdateQty(getItemId(item), (item.quantity || 1) + 1)}>
                  <Icon name="add-circle-outline" size={28} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleRemove(getItemId(item))}>
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
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            user ? navigation.navigate('Checkout') : navigation.navigate('Login');
          }}
          activeOpacity={0.9}
        >
          <View style={[styles.checkoutGradient, { backgroundColor: colors.primary }]}>
            <Text style={styles.checkoutText}>{user ? 'إتمام الطلب' : 'تسجيل الدخول لإتمام الطلب'}</Text>
          </View>
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
    marginTop: 8,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.button,
  },
  shopBtnGradient: { paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center' },
  shopBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  loginBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loginBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  guestBannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
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
  checkoutBtn: { borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.button },
  checkoutGradient: { paddingVertical: 16, alignItems: 'center' },
  checkoutText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
