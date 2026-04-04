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
import { colors, borderRadius, shadows, typography } from '../theme';

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
  emptyTitle: { ...typography.h2, fontSize: 20, color: colors.text, marginBottom: 10 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginVertical: 14, textAlign: 'center' },
  shopBtn: { backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 20, ...shadows.premium },
  shopBtnText: { ...typography.h4, color: colors.white },
  list: { padding: 20, paddingBottom: 100 },
  orderCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 22,
    marginBottom: 14,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { ...typography.h3, fontSize: 17, color: colors.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, ...shadows.soft },
  statusText: { ...typography.overline, color: colors.white },
  orderDate: { ...typography.caption, color: colors.textSecondary, marginBottom: 8, textAlign: 'right' },
  orderTotal: { ...typography.h3, fontSize: 18, color: colors.primary, textAlign: 'right' },
});
