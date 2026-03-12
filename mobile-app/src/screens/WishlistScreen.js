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
import { wishlistAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function WishlistScreen() {
  const navigation = useNavigation();
  const toast = useToast();
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
      setProducts(Array.isArray(data) ? data : []);
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
      toast.show('تم الإزالة من قائمة الأمنيات');
    } catch (err) {
      console.error(err);
      toast.error('فشل الإزالة');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon name="favorite-border" size={56} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>قائمة الأمنيات فارغة</Text>
        <Text style={styles.emptySubtext}>أضف المنتجات المفضلة لديك هنا</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
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
        const img = item.main_image || item.images?.[0] || item.variants?.[0]?.image;
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          >
            <Image
              source={{ uri: img ? `${API_BASE}${img}` : null }}
              style={styles.image}
            />
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.price}>
              {item.min_price ? `${Number(item.min_price).toLocaleString('ar-IQ')} د.ع` : ''}
            </Text>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
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
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { ...typography.h2, fontSize: 20, color: colors.text, marginBottom: 10 },
  emptySubtext: { ...typography.body, color: colors.textSecondary, marginBottom: 28 },
  shopBtn: { backgroundColor: colors.primary, padding: 18, borderRadius: 20, ...shadows.premium },
  shopBtnText: { ...typography.h4, color: colors.white },
  list: { padding: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 18 },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  image: { width: '100%', height: 155, backgroundColor: colors.primarySoft },
  name: { padding: 12, ...typography.label, color: colors.text },
  price: { padding: 12, paddingTop: 0, ...typography.h4, fontSize: 14, color: colors.primary },
  removeBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
