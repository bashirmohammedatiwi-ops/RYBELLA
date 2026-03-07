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
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.empty}>
        <Icon name="receipt-long" size={80} color="#ccc" />
        <Text style={styles.emptyText}>سجّل الدخول لعرض طلباتك</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.shopBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name="receipt-long" size={80} color="#ccc" />
        <Text style={styles.emptyText}>لا توجد طلبات</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Home')}
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C2185B']} />
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
  const colors = {
    pending: '#FF9800',
    confirmed: '#2196F3',
    processing: '#9C27B0',
    shipped: '#3F51B5',
    delivered: '#4CAF50',
    cancelled: '#f44336',
  };
  return colors[status] || '#999';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, color: '#666', marginVertical: 16 },
  shopBtn: { backgroundColor: '#C2185B', padding: 16, borderRadius: 12 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12 },
  orderDate: { fontSize: 14, color: '#666', marginBottom: 4 },
  orderTotal: { fontSize: 18, fontWeight: 'bold', color: '#C2185B' },
});
