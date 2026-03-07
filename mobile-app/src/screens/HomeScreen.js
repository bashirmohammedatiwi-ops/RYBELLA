import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { productsAPI, brandsAPI, bannersAPI } from '../services/api';
import { API_BASE } from '../config';

const formatPrice = (price) => `${Number(price).toLocaleString('ar-IQ')} د.ع`;

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, brandsRes, bannersRes] = await Promise.all([
        productsAPI.getAll(),
        brandsAPI.getAll(),
        bannersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setProducts(productsRes.data || []);
      setBrands(brandsRes.data || []);
      setBanners(bannersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getImageUrl = (product) => {
    const img = product.main_image || product.images?.[0] || product.variants?.[0]?.image;
    return img ? `${API_BASE}${img}` : null;
  };

  const getMinPrice = (product) => {
    const prices = product.variants?.map((v) => parseFloat(v.price)).filter(Boolean);
    return prices?.length ? Math.min(...prices) : 0;
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
        <View style={styles.productImageContainer}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]} />
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

  const bestSelling = products.slice(0, 8);
  const newArrivals = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C2185B']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>ريبيلا العراق</Text>
        <Text style={styles.subtitle}>مستحضرات تجميل أصلية</Text>
      </View>

      <TouchableOpacity
        style={styles.searchBox}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.searchPlaceholder}>ابحث عن منتجات...</Text>
      </TouchableOpacity>

      {banners.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerScroll}
          contentContainerStyle={styles.bannerContent}
        >
          {banners.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.bannerSlide}
              onPress={() => {
                if (b.link_type === 'product' && b.link_value) {
                  navigation.navigate('ProductDetail', { productId: parseInt(b.link_value, 10) });
                } else if (b.link_type === 'category' && b.link_value) {
                  navigation.navigate('Products', { categoryId: parseInt(b.link_value, 10) });
                }
              }}
              activeOpacity={1}
            >
              <Image
                source={{ uri: b.image ? `${API_BASE}${b.image}` : null }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الأكثر مبيعاً</Text>
        <FlatList
          data={bestSelling}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>وصل حديثاً</Text>
        <FlatList
          data={newArrivals}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>جميع المنتجات</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={products.slice(0, 6)}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'right' },
  searchBox: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchPlaceholder: { color: '#999', fontSize: 15, textAlign: 'right' },
  bannerScroll: { marginTop: 16, maxHeight: 180 },
  bannerContent: { paddingHorizontal: 16 },
  bannerSlide: { width: 340, height: 160, marginHorizontal: 4, borderRadius: 16, overflow: 'hidden', backgroundColor: '#eee' },
  bannerImage: { width: '100%', height: '100%' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 12, textAlign: 'right' },
  seeAll: { color: '#C2185B', fontSize: 14 },
  horizontalList: { paddingRight: 8, gap: 12 },
  row: { justifyContent: 'flex-end', gap: 12, marginBottom: 12 },
  productCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 160 },
  placeholderImage: { backgroundColor: '#eee' },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: { color: '#fff', fontSize: 12 },
  productName: { padding: 10, fontSize: 14, color: '#333', textAlign: 'right' },
  productPrice: { paddingHorizontal: 10, paddingBottom: 10, fontSize: 15, fontWeight: '600', color: '#C2185B', textAlign: 'right' },
});
