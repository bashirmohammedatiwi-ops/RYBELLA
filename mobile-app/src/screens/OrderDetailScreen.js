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
import { colors, borderRadius, shadows } from '../theme';

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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
    padding: 16,
    paddingTop: 48,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.white, textAlign: 'right' },
  content: {
    margin: 16,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.card,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginBottom: 20,
  },
  statusText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 12 },
  value: { fontSize: 15, color: colors.text, marginTop: 2, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 12, color: colors.text },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemName: { flex: 1, fontSize: 14, color: colors.text },
  itemQty: { fontSize: 14, color: colors.textSecondary, marginHorizontal: 8 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: colors.primary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
});
