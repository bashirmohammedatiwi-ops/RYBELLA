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
import { colors, borderRadius, shadows } from '../theme';

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

  const renderProduct = ({ item }) => {
    const img = item.main_image || (item.images && item.images[0]) || (item.variants?.[0]?.image);
    const minPrice = item.min_price || item.variants?.[0]?.price;
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: img ? `${API_BASE}${img}` : 'https://via.placeholder.com/100' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{minPrice ? formatPrice(minPrice) : '-'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
        <ActivityIndicator size="large" color="#C2185B" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query.trim() && !loading ? (
              <Text style={styles.emptyText}>لا توجد نتائج</Text>
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
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  list: { padding: 16 },
  productCard: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  productImage: { width: 80, height: 80, borderRadius: borderRadius.md },
  productInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: colors.text },
  productPrice: { fontSize: 15, color: colors.primary, marginTop: 4, fontWeight: '700' },
  loader: { marginTop: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, color: colors.textMuted },
});
