import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

export default function OrdersScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const { data } = await ordersAPI.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon name="receipt-long" size={56} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>طلباتك</Text>
        <Text style={styles.emptyText}>سجّل الدخول لعرض طلباتك ومتابعتها</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.shopBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon name="receipt-long" size={56} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
        <Text style={styles.emptyText}>عندما تطلب سنعرض طلباتك هنا</Text>
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
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>طلب #{item.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString('ar-IQ')}
          </Text>
          <Text style={styles.orderTotal}>
            {Number(item.final_price).toLocaleString('ar-IQ')} د.ع
          </Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.list}
    />
  );
}

function getStatusColor(status) {
  const statusColors = {
    pending: colors.warning,
    confirmed: colors.info,
    processing: colors.primary,
    shipped: '#3F51B5',
    delivered: colors.success,
    cancelled: colors.error,
  };
  return statusColors[status] || colors.textMuted;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginVertical: 12, textAlign: 'center' },
  shopBtn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: borderRadius.lg, ...shadows.button },
  shopBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 100 },
  orderCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
    ...shadows.card,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 17, fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm },
  statusText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  orderDate: { fontSize: 14, color: colors.textSecondary, marginBottom: 6, textAlign: 'right' },
  orderTotal: { fontSize: 18, fontWeight: '800', color: colors.primary, textAlign: 'right' },
});
