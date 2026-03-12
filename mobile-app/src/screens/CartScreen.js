import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import * as Haptics from 'expo-haptics';
import { useToast } from '../context/ToastContext';
import { colors, borderRadius, shadows, gradients, typography } from '../theme';

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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Home')} style={styles.headerBtn}>
            <Icon name="arrow-forward" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>السلة</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView contentContainerStyle={styles.empty} style={styles.emptyScroll}>
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
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Home')} style={styles.headerBtn}>
          <Icon name="arrow-forward" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>السلة</Text>
        <View style={styles.headerRight} />
      </View>
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
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>العناصر ({items.length})</Text>
          <Text style={styles.summaryValue}>{total.toLocaleString('ar-IQ')} د.ع</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المجموع الكلي</Text>
          <Text style={styles.total}>{total.toLocaleString('ar-IQ')} د.ع</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            user ? navigation.navigate('Checkout') : navigation.navigate('Login');
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.checkoutText}>{user ? 'إتمام الطلب' : 'تسجيل الدخول لإتمام الطلب'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyScroll: { flex: 1, backgroundColor: colors.background },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { ...typography.h2, fontSize: 20, color: colors.text, marginBottom: 10 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginVertical: 12, textAlign: 'center' },
  shopBtn: {
    marginTop: 8,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.button,
  },
  shopBtnGradient: { paddingVertical: 18, paddingHorizontal: 36, alignItems: 'center' },
  shopBtnText: { ...typography.h4, color: colors.white },
  loginBtn: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loginBtnText: { ...typography.h4, color: colors.primary },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  guestBannerText: { ...typography.caption, color: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.soft,
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
  headerRight: { width: 44 },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 22,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  itemImage: { width: 92, height: 92, borderRadius: 16 },
  itemInfo: { flex: 1, marginHorizontal: 16 },
  itemName: { ...typography.label, marginBottom: 6, color: colors.text },
  itemPrice: { ...typography.h4, fontSize: 15, color: colors.primary, marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qty: { ...typography.h4, minWidth: 28, textAlign: 'center' },
  footer: {
    backgroundColor: colors.white,
    padding: 24,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { ...typography.caption, color: colors.textSecondary },
  summaryValue: { ...typography.caption, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { ...typography.h4, color: colors.text },
  total: { ...typography.hero, fontSize: 22, color: colors.primary },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    ...shadows.premium,
  },
  checkoutText: { ...typography.h3, color: colors.white },
});
