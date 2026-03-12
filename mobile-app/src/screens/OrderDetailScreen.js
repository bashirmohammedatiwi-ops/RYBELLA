import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows, typography } from '../theme';

const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export default function OrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId, user]);

  const loadOrder = async () => {
    if (!user || !orderId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await ordersAPI.getById(orderId);
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Icon name="arrow-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب #{order.id}</Text>
      </View>
      <View style={styles.content}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[order.status] || order.status}</Text>
        </View>
        <Text style={styles.label}>التاريخ</Text>
        <Text style={styles.value}>{new Date(order.created_at).toLocaleDateString('ar-IQ', { dateStyle: 'long' })}</Text>
        <Text style={styles.label}>العنوان</Text>
        <Text style={styles.value}>{order.address}</Text>
        <Text style={styles.label}>المدينة</Text>
        <Text style={styles.value}>{order.city}</Text>
        {order.phone && (
          <>
            <Text style={styles.label}>الهاتف</Text>
            <Text style={styles.value}>{order.phone}</Text>
          </>
        )}
        <Text style={styles.sectionTitle}>المنتجات</Text>
        {(order.items || []).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product_name} - {item.shade_name}</Text>
            <Text style={styles.itemQty}>×{item.quantity}</Text>
            <Text style={styles.itemPrice}>{Number(item.price).toLocaleString('ar-IQ')} د.ع</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المجموع النهائي</Text>
          <Text style={styles.totalValue}>{Number(order.final_price).toLocaleString('ar-IQ')} د.ع</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status) {
  const c = {
    pending: colors.warning,
    confirmed: colors.info,
    processing: colors.primary,
    shipped: colors.primaryLight,
    delivered: colors.success,
    cancelled: colors.error,
  };
  return c[status] || colors.textMuted;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 48,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadows.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, ...typography.h3, fontSize: 18, color: colors.white, textAlign: 'right' },
  content: {
    margin: 20,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 28,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 22,
    ...shadows.soft,
  },
  statusText: { ...typography.caption, color: colors.white },
  label: { ...typography.overline, color: colors.textMuted, marginTop: 14 },
  value: { ...typography.body, color: colors.text, marginTop: 4 },
  sectionTitle: { ...typography.h3, marginTop: 28, marginBottom: 14, color: colors.text },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemName: { flex: 1, ...typography.caption, color: colors.text },
  itemQty: { ...typography.caption, color: colors.textSecondary, marginHorizontal: 10 },
  itemPrice: { ...typography.label, color: colors.primary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.h4, color: colors.text },
  totalValue: { ...typography.hero, fontSize: 20, color: colors.primary },
});
