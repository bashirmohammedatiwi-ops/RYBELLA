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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { productsAPI } from '../services/api';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows, typography } from '../theme';

const RECENT_SEARCH_KEY = 'rybella_recent_searches';
const MAX_RECENT = 10;
const POPULAR_TERMS = ['ماسكرا', 'أحمر شفاه', 'كريم أساس', 'بودرة', 'ظلال عيون', 'بلاشر'];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    loadRecentSearches();
    loadPopularProducts();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => searchProducts(), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCH_KEY);
      setRecentSearches(stored ? JSON.parse(stored) : []);
    } catch (_) {
      setRecentSearches([]);
    }
  };

  const addToRecent = async (term) => {
    if (!term?.trim()) return;
    const normalized = term.trim();
    let list = [normalized, ...recentSearches.filter((s) => s !== normalized)].slice(0, MAX_RECENT);
    setRecentSearches(list);
    await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(list));
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCH_KEY);
  };

  const loadPopularProducts = async () => {
    try {
      const { data } = await productsAPI.getAll({ featured: '1' });
      setPopularProducts(Array.isArray(data) ? data.slice(0, 6) : []);
    } catch (_) {
      setPopularProducts([]);
    }
  };

  const searchProducts = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const { data } = await productsAPI.getAll({ search: query });
      setResults(Array.isArray(data) ? data : []);
      await addToRecent(query);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onSearchTerm = (term) => {
    setQuery(term);
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

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrap}>
        {getImageUrl(item) ? (
          <Image source={{ uri: getImageUrl(item) }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.placeholderImg]} />
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(getMinPrice(item))}</Text>
      </View>
    </TouchableOpacity>
  );

  const showSuggestions = !query.trim() && !loading;
  const showEmpty = query.trim() && !loading && results.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-right" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <Icon name="magnify" size={22} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث واعثر لك"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            textAlign="right"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : showSuggestions ? (
        <ScrollView style={styles.suggestions} contentContainerStyle={styles.suggestionsContent} showsVerticalScrollIndicator={false}>
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>حديثاً</Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={styles.clearText}>مسح</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsRow}>
                {recentSearches.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.chip}
                    onPress={() => onSearchTerm(s)}
                  >
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>شائع</Text>
            <View style={styles.chipsRow}>
              {POPULAR_TERMS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.chip}
                  onPress={() => onSearchTerm(t)}
                >
                  <Text style={styles.chipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {popularProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>منتجات مقترحة</Text>
              <View style={styles.popularGrid}>
                {popularProducts.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.popularCard}
                    onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                  >
                    {getImageUrl(p) ? (
                      <Image source={{ uri: getImageUrl(p) }} style={styles.popularImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.popularImage, styles.placeholderImg]} />
                    )}
                    <Text style={styles.popularName} numberOfLines={2}>{p.name}</Text>
                    <Text style={styles.popularPrice}>{formatPrice(getMinPrice(p))}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : showEmpty ? (
        <View style={styles.emptyState}>
          <Icon name="magnify-close" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
          <Text style={styles.emptyText}>جرب كلمات مختلفة أو تصفح الفئات</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
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
    padding: 20,
    paddingTop: 52,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.soft,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.1)',
  },
  searchInput: {
    flex: 1,
    height: 48,
    ...typography.body,
    textAlign: 'right',
  },
  searchIcon: { marginLeft: 8 },
  list: { padding: 20, paddingBottom: 100 },
  productCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderRadius: 22,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.05)',
  },
  imageWrap: { position: 'relative' },
  productImage: { width: 92, height: 92, borderRadius: 18 },
  placeholderImg: { backgroundColor: colors.primarySoft },
  productInfo: { flex: 1, marginRight: 16, justifyContent: 'center' },
  productName: { ...typography.label, color: colors.text },
  productPrice: { ...typography.h4, fontSize: 15, color: colors.primary, marginTop: 6 },
  loader: { marginTop: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { ...typography.h3, color: colors.text, marginTop: 18 },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: 10, color: colors.textMuted },
  suggestions: { flex: 1 },
  suggestionsContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { ...typography.h3, color: colors.text },
  clearText: { ...typography.caption, color: colors.primary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.15)',
    ...shadows.soft,
  },
  chipText: { ...typography.caption, color: colors.text },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  popularCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  popularImage: { width: '100%', height: 120, backgroundColor: colors.primarySoft },
  popularName: { padding: 12, ...typography.caption, color: colors.text, textAlign: 'right' },
  popularPrice: { paddingHorizontal: 12, paddingBottom: 12, ...typography.h4, fontSize: 14, color: colors.primary, textAlign: 'right' },
});
