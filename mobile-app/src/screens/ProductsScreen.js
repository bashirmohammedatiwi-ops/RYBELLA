import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { productsAPI, categoriesAPI, brandsAPI } from '../services/api';
import { API_BASE } from '../config';

const formatPrice = (price) => `${Number(price).toLocaleString('ar-IQ')} د.ع`;

export default function ProductsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoryId, brandId } = route.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    loadProducts();
    loadFilterName();
  }, [categoryId, brandId]);

  const loadFilterName = async () => {
    if (categoryId) {
      try {
        const { data } = await categoriesAPI.getAll();
        const cat = (data || []).find((c) => c.id === categoryId);
        setFilterName(cat?.name || 'الفئة');
      } catch (_) {
        setFilterName('الفئة');
      }
    } else if (brandId) {
      try {
        const { data } = await brandsAPI.getAll();
        const brand = (data || []).find((b) => b.id === brandId);
        setFilterName(brand?.name || 'العلامة التجارية');
      } catch (_) {
        setFilterName('العلامة التجارية');
      }
    } else {
      setFilterName('جميع المنتجات');
    }
  };

  const loadProducts = async () => {
    try {
      const params = {};
      if (categoryId) params.category_id = categoryId;
      if (brandId) params.brand_id = brandId;
      const { data } = await productsAPI.getAll(params);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const getImageUrl = (product) => {
    const img = product.main_image || product.images?.[0] || product.variants?.[0]?.image;
    return img ? `${API_BASE}${img}` : null;
  };

  const getMinPrice = (product) => {
    const prices = product.variants?.map((v) => parseFloat(v.price)).filter(Boolean);
    return prices?.length ? Math.min(...prices) : product.min_price || 0;
  };

  const renderProduct = ({ item }) => {
    const imgUrl = getImageUrl(item);
    const minPrice = getMinPrice(item);
    const inStock = item.variants?.some((v) => v.stock > 0);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholder]} />
          )}
          {!inStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>نفذ</Text>
            </View>
          )}
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(minPrice)}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{filterName}</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C2185B']} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="inventory-2" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد منتجات</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 8, marginLeft: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'right' },
  list: { padding: 16, paddingBottom: 100 },
  row: { justifyContent: 'flex-end', gap: 12, marginBottom: 12 },
  productCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: { position: 'relative' },
  productImage: { width: '100%', aspectRatio: 1 },
  placeholder: { backgroundColor: '#E8E8E8' },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockText: { color: '#fff', fontSize: 12 },
  productName: { padding: 12, fontSize: 14, color: '#333', textAlign: 'right' },
  productPrice: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#C2185B',
    textAlign: 'right',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
