import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { productsAPI } from '../services/api';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows, gradients } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await productsAPI.getAll({ search: query });
      setResults(data);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `${Number(price).toLocaleString('ar-IQ')} د.ع`;
  const getImageUrl = (p) => {
    const img = p.main_image || p.images?.[0] || p.variants?.[0]?.image;
    return img ? `${API_BASE}${img}` : null;
  };
  const getMinPrice = (p) => {
    const prices = p.variants?.map((v) => parseFloat(v.price)).filter(Boolean);
    return prices?.length ? Math.min(...prices) : p.min_price || 0;
  };
  const isProductNew = (p) => {
    if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) return true;
    if (p.created_at) return (Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24) <= 30;
    return false;
  };

  const renderProduct = ({ item }) => {
    const imgUrl = getImageUrl(item);
    const minPrice = getMinPrice(item);
    const badges = [];
    if (item.is_featured) badges.push('مميز');
    if (item.is_best_seller) badges.push('أكثر مبيعاً');
    if (isProductNew(item)) badges.push('جديد');
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageWrap}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImg]} />
          )}
          {badges.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badges[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(minPrice)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primarySoft }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'} size={24} color={colors.white} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن منتج..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query.trim() && !loading ? (
              <View style={styles.emptyState}>
                <Icon name="magnify-close" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
                <Text style={styles.emptyText}>جرب كلمات مختلفة أو تصفح الفئات</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 8 },
  searchInput: {
    flex: 1,
    height: 46,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    fontSize: 16,
    marginHorizontal: 8,
  },
  list: { padding: 16, paddingBottom: 100 },
  productCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  imageWrap: { position: 'relative' },
  productImage: { width: 88, height: 88, borderRadius: borderRadius.md },
  placeholderImg: { backgroundColor: colors.borderLight },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '600' },
  productInfo: { flex: 1, marginRight: 14, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: colors.text },
  productPrice: { fontSize: 15, color: colors.primary, marginTop: 4, fontWeight: '700' },
  loader: { marginTop: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptyText: { textAlign: 'center', marginTop: 8, color: colors.textMuted, fontSize: 15 },
});
