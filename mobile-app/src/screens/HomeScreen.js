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
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { productsAPI, brandsAPI, bannersAPI } from '../services/api';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');
const formatPrice = (price) => `${Number(price).toLocaleString('ar-IQ')} د.ع`;

function BannerDots({ count, activeIndex }) {
  if (count <= 1) return null;
  return (
    <View style={styles.bannerDots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.bannerDot,
            i === activeIndex && styles.bannerDotActive,
          ]}
        />
      ))}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [search, setSearch] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, featuredRes, brandsRes, bannersRes] = await Promise.all([
        productsAPI.getAll(),
        productsAPI.getAll({ featured: '1' }),
        brandsAPI.getAll(),
        bannersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setProducts(productsRes.data || []);
      setFeaturedProducts(featuredRes.data || []);
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

  const isProductNew = (p) => {
    if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) return true;
    if (p.created_at) {
      const days = (Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24);
      return days <= 30;
    }
    return false;
  };

  const renderProduct = ({ item }) => {
    const imgUrl = getImageUrl(item);
    const minPrice = getMinPrice(item);
    const inStock = item.variants?.some((v) => v.stock > 0);
    const badges = [];
    if (item.is_featured) badges.push({ label: 'مميز', style: styles.badgeFeatured });
    if (item.is_best_seller) badges.push({ label: 'أكثر مبيعاً', style: styles.badgeBestSeller });
    if (isProductNew(item)) badges.push({ label: 'جديد', style: styles.badgeNew });

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
          <View style={styles.badgesRow}>
            {badges.slice(0, 2).map((b, i) => (
              <View key={i} style={[styles.badge, b.style]}>
                <Text style={styles.badgeText}>{b.label}</Text>
              </View>
            ))}
          </View>
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

  const bestSelling = products.filter((p) => p.is_best_seller).slice(0, 8);
  const displayBestSelling = bestSelling.length > 0 ? bestSelling : products.slice(0, 8);
  const newArrivals = [...products].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8);
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts.slice(0, 8) : displayBestSelling;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>Rybella</Text>
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header بتصميم Fashion Store - وردي مع نص أبيض */}
      <View style={styles.header}>
        <Text style={styles.title}>ريبيلا العراق</Text>
        <Text style={styles.subtitle}>مستحضرات تجميل أصلية</Text>
        <Text style={styles.tagline}>اجعل أسلوبك أكثر إتقاناً ✨</Text>
        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.9}
        >
          <Icon name="search" size={22} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>ابحث عن منتجات...</Text>
        </TouchableOpacity>
      </View>

      {/* منطقة المحتوى البيضاء */}
      <View style={styles.contentArea}>
        {banners.length > 0 && (
          <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScroll}
            contentContainerStyle={styles.bannerContent}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 28));
              setBannerIndex(Math.min(idx, banners.length - 1));
            }}
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
          <BannerDots count={banners.length} activeIndex={bannerIndex} />
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المنتجات المميزة</Text>
          <FlatList
            data={displayFeatured}
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

      {brands.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>العلامات التجارية</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Brands')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandsRow}>
            {brands.slice(0, 8).map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.brandCard}
                onPress={() => navigation.navigate('Products', { brandId: b.id })}
              >
                {b.logo ? (
                  <Image source={{ uri: `${API_BASE}${b.logo}` }} style={styles.brandLogo} resizeMode="contain" />
                ) : (
                  <View style={[styles.brandLogo, styles.placeholderImage]} />
                )}
                <Text style={styles.brandName} numberOfLines={1}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingLogo: { marginBottom: 24 },
  loadingLogoText: { fontSize: 32, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  loader: { marginVertical: 8 },
  loadingText: { fontSize: 14, color: colors.textMuted, marginTop: 12 },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadows.soft,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.white, textAlign: 'right', letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.92)', marginTop: 6, textAlign: 'right' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'right' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingLogo: { alignItems: 'center', marginBottom: 24 },
  loadingTitle: { fontSize: 32, fontWeight: '800', color: colors.primary },
  loadingSubtitle: { fontSize: 18, color: colors.textSecondary, marginTop: 4 },
  loader: { marginTop: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    gap: 10,
    ...shadows.soft,
  },
  searchPlaceholder: { flex: 1, color: colors.textMuted, fontSize: 15, textAlign: 'right' },
  contentArea: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  bannerScroll: { maxHeight: 170 },
  bannerContent: { paddingHorizontal: 4 },
  bannerSlide: {
    width: width - 40,
    height: 155,
    marginHorizontal: 6,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
    ...shadows.card,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  bannerDotActive: { width: 18, borderRadius: 3, backgroundColor: colors.primary },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 14, textAlign: 'right' },
  seeAll: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  horizontalList: { paddingRight: 4, gap: 12 },
  row: { justifyContent: 'flex-end', gap: 12, marginBottom: 12 },
  productCard: {
    width: 165,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 165 },
  placeholderImage: { backgroundColor: colors.borderLight },
  badgesRow: { position: 'absolute', top: 8, right: 8, flexDirection: 'column', gap: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  badgeFeatured: { backgroundColor: '#9C27B0' },
  badgeBestSeller: { backgroundColor: '#2E7D32' },
  badgeNew: { backgroundColor: '#2196F3' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  outOfStockText: { color: colors.white, fontSize: 12 },
  productName: { padding: 12, fontSize: 14, color: colors.text, textAlign: 'right' },
  productPrice: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  brandsRow: { paddingRight: 4, gap: 12 },
  brandCard: {
    width: 80,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  brandLogo: { width: 56, height: 56, borderRadius: 8 },
  brandName: { fontSize: 12, marginTop: 6, color: colors.text, fontWeight: '600', textAlign: 'center' },
});
