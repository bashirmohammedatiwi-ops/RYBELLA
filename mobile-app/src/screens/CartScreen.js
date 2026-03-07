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

export default function CartScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCart);
    loadCart();
    return unsubscribe;
  }, [navigation]);

  const loadCart = async () => {
    try {
      const { data } = await cartAPI.get();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
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
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name="shopping-cart" size={80} color="#ccc" />
        <Text style={styles.emptyText}>سلة التسوق فارغة</Text>
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
              <Icon name="delete" size={24} color="#f44336" />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, color: '#666', marginVertical: 16 },
  shopBtn: { backgroundColor: '#C2185B', padding: 16, borderRadius: 12 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  itemImage: { width: 80, height: 80, borderRadius: 8 },
  itemInfo: { flex: 1, marginHorizontal: 12 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#C2185B', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { fontSize: 16 },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  totalLabel: { fontSize: 14, color: '#666' },
  total: { fontSize: 24, fontWeight: 'bold', color: '#C2185B', marginVertical: 8 },
  checkoutBtn: {
    backgroundColor: '#C2185B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
