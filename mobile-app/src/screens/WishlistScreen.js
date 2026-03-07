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
import { wishlistAPI, productsAPI } from '../services/api';

const API_BASE = 'http://localhost:5000';

export default function WishlistScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadWishlist);
    loadWishlist();
    return unsubscribe;
  }, [navigation]);

  const loadWishlist = async () => {
    try {
      const { data } = await wishlistAPI.getWishlist();
      const ids = (data?.products || data || []).map((p) => (typeof p === 'object' ? p.product_id || p.id : p));
      if (ids.length === 0) {
        setProducts([]);
        return;
      }
      const fetched = await Promise.all(ids.map((id) => productsAPI.getById(id)));
      setProducts(fetched.map((r) => r.data));
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.remove(productId);
      setProducts((p) => p.filter((x) => x.id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name="favorite-border" size={80} color="#ccc" />
        <Text style={styles.emptyText}>قائمة الأمنيات فارغة</Text>
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
      data={products}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const img = item.main_image || item.images?.[0];
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          >
            <Image
              source={{
                uri: img ? `${API_BASE}${img}` : 'https://via.placeholder.com/150',
              }}
              style={styles.image}
            />
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.price}>
              {item.min_price
                ? `${Number(item.min_price).toLocaleString('ar-IQ')} د.ع`
                : ''}
            </Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item.id)}
            >
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, color: '#666', marginVertical: 16 },
  shopBtn: { backgroundColor: '#C2185B', padding: 16, borderRadius: 12 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list: { padding: 16 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: 150, backgroundColor: '#f5f5f5' },
  name: { padding: 8, fontSize: 14, fontWeight: '600' },
  price: { padding: 8, paddingTop: 0, fontSize: 14, color: '#C2185B' },
  removeBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
