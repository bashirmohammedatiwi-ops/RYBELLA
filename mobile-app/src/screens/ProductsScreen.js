import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { productsAPI, categoriesAPI, brandsAPI, subcategoriesAPI } from '../services/api';
import { API_BASE } from '../config';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, gradients, typography } from '../theme';
import { ProductGridSkeleton } from '../components/Skeleton';

const formatPrice = (price) => `${Number(price).toLocaleString('ar-IQ')} د.ع`;

const SORT_OPTIONS = [
  { id: 'default', label: 'الافتراضي' },
  { id: 'newest', label: 'الأحدث' },
  { id: 'price_asc', label: 'السعر: من الأقل للأعلى' },
  { id: 'price_desc', label: 'السعر: من الأعلى للأقل' },
  { id: 'name', label: 'الاسم (أ-ي)' },
];

export default function ProductsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoryId, brandId, subcategoryId, productIds, offerTitle } = route.params || {};
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [selectedSubId, setSelectedSubId] = useState(subcategoryId || null);
  const [sortBy, setSortBy] = useState('default');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    loadProducts();
    loadFilterName();
    if (categoryId) {
      subcategoriesAPI.getAll({ category_id: categoryId }).then((r) => setSubcategories(r?.data || [])).catch(() => []);
    } else {
      setSubcategories([]);
    }
  }, [categoryId, brandId, selectedSubId, productIds]);

  const loadFilterName = async () => {
    if (offerTitle) {
      setFilterName(offerTitle);
    } else if (categoryId) {
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
      if (productIds) params.product_ids = productIds;
      else {
        if (categoryId) params.category_id = categoryId;
        if (brandId) params.brand_id = brandId;
        if (selectedSubId) params.subcategory_id = selectedSubId;
      }
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

  const getSortedProducts = () => {
    const list = [...products];
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      case 'price_asc':
        return list.sort((a, b) => {
          const pa = Math.min(...(a.variants || []).map((v) => parseFloat(v.price) || 0).filter(Boolean)) || 0;
          const pb = Math.min(...(b.variants || []).map((v) => parseFloat(v.price) || 0).filter(Boolean)) || 0;
          return pa - pb;
        });
      case 'price_desc':
        return list.sort((a, b) => {
          const pa = Math.max(...(a.variants || []).map((v) => parseFloat(v.price) || 0).filter(Boolean)) || 0;
          const pb = Math.max(...(b.variants || []).map((v) => parseFloat(v.price) || 0).filter(Boolean)) || 0;
          return pb - pa;
        });
      case 'name':
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
      default:
        return list;
    }
  };

  const getImageUrl = (product) => {
    const img = product.main_image || product.images?.[0] || product.variants?.[0]?.image;
    return img ? `${API_BASE}${img}` : null;
  };

  const getMinPrice = (product) => {
    const prices = product.variants?.map((v) => parseFloat(v.price)).filter(Boolean);
    return prices?.length ? Math.min(...prices) : product.min_price || 0;
  };

  const isProductNew = (p) => {
    if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) return true;
    if (p.created_at) return (Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24) <= 30;
    return false;
  };

  const handleProductPress = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProductDetail', { productId: id });
  };

  const renderProduct = ({ item }) => {
    const imgUrl = getImageUrl(item);
    const minPrice = getMinPrice(item);
    const inStock = item.variants?.some((v) => v.stock > 0);
    const badges = [];
    if (item.is_featured) badges.push('مميز');
    if (item.is_best_seller) badges.push('أكثر مبيعاً');
    if (isProductNew(item)) badges.push('جديد');

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.imageContainer}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholder]} />
          )}
          {badges.length > 0 && (
            <View style={styles.badgesRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{badges[0]}</Text></View>
            </View>
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
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-forward" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{filterName}</Text>
        </View>
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductGridSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  const sortedProducts = getSortedProducts();
  const currentSortLabel = SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'الافتراضي';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-forward" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{filterName}</Text>
      </View>

      <View style={styles.toolbar}>
        {subcategories.length > 0 && !productIds && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subcatScroll} contentContainerStyle={styles.subcatRow}>
            <TouchableOpacity style={[styles.subcatChip, !selectedSubId && styles.subcatChipActive]} onPress={() => setSelectedSubId(null)}>
              <Text style={[styles.subcatText, !selectedSubId && styles.subcatTextActive]}>الكل</Text>
            </TouchableOpacity>
            {subcategories.map((s) => (
              <TouchableOpacity key={s.id} style={[styles.subcatChip, selectedSubId === s.id && styles.subcatChipActive]} onPress={() => setSelectedSubId(s.id)}>
                <Text style={[styles.subcatText, selectedSubId === s.id && styles.subcatTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <TouchableOpacity style={styles.sortBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSortModal(true); }}>
          <Icon name="sort" size={20} color={colors.primary} />
          <Text style={styles.sortBtnText}>{currentSortLabel}</Text>
          <Icon name="expand-more" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="inventory-2" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد منتجات</Text>
          </View>
        }
      />

      <Modal visible={showSortModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ترتيب حسب</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sortOption, sortBy === opt.id && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy(opt.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === opt.id && styles.sortOptionTextActive]}>{opt.label}</Text>
                {sortBy === opt.id && <Icon name="check" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 48,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadows.soft,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  title: { flex: 1, ...typography.h2, fontSize: 20, color: colors.text, textAlign: 'right' },
  toolbar: { backgroundColor: colors.surface, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.borderLight },
  subcatScroll: { maxHeight: 48 },
  subcatRow: { paddingHorizontal: 20, paddingVertical: 6, gap: 10, flexDirection: 'row' },
  subcatChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.borderLight },
  subcatChipActive: { backgroundColor: colors.primary, ...shadows.premium },
  subcatText: { ...typography.caption, color: colors.textSecondary },
  subcatTextActive: { color: colors.white },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sortBtnText: { ...typography.caption, fontSize: 14, color: colors.text },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, justifyContent: 'space-between' },
  list: { padding: 20, paddingBottom: 100 },
  row: { justifyContent: 'flex-end', gap: 14, marginBottom: 14 },
  productCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.05)',
  },
  imageContainer: { position: 'relative' },
  productImage: { width: '100%', aspectRatio: 1 },
  placeholder: { backgroundColor: colors.borderLight },
  badgesRow: { position: 'absolute', top: 8, right: 8 },
  badge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', ...shadows.premium },
  badgeText: { ...typography.overline, color: colors.white, fontSize: 10 },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockText: { ...typography.caption, color: '#fff' },
  productName: { padding: 14, ...typography.label, color: colors.text, textAlign: 'right' },
  productPrice: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    ...typography.h4,
    fontSize: 16,
    color: colors.primary,
    textAlign: 'right',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: 24, textAlign: 'right' },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  sortOptionActive: { backgroundColor: colors.primarySoft },
  sortOptionText: { ...typography.body, color: colors.text },
  sortOptionTextActive: { ...typography.h4, color: colors.primary },
});
