import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { productsAPI, reviewsAPI, cartAPI, wishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const API_BASE = 'http://localhost:5000';

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const { data } = await productsAPI.getById(productId);
      setProduct(data);
      if (data.variants?.length) {
        setSelectedVariant(data.variants.find((v) => v.stock > 0) || data.variants[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user || !selectedVariant) return;
    try {
      await cartAPI.addItem(selectedVariant.id, quantity);
      navigation.navigate('Cart');
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الإضافة للسلة');
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    try {
      if (inWishlist) {
        await wishlistAPI.remove(productId);
        setInWishlist(false);
      } else {
        await wishlistAPI.add(productId);
        setInWishlist(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);
  const mainImage = selectedVariant?.image
    ? getImageUrl(selectedVariant.image)
    : product.main_image
    ? getImageUrl(product.main_image)
    : product.images?.[0]
    ? getImageUrl(product.images[0])
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-forward" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleWishlist}>
          <Icon name={inWishlist ? 'favorite' : 'favorite-border'} size={28} color="#C2185B" />
        </TouchableOpacity>
      </View>

      {mainImage && (
        <Image source={{ uri: mainImage }} style={styles.mainImage} resizeMode="contain" />
      )}

      <View style={styles.content}>
        <Text style={styles.brand}>{product.brand_name}</Text>
        <Text style={styles.name}>{product.name}</Text>
        {product.description && (
          <Text style={styles.description}>{product.description}</Text>
        )}

        {product.variants?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>الظلال المتاحة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.variantsRow}>
              {product.variants.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.variantChip,
                    selectedVariant?.id === v.id && styles.variantChipSelected,
                    v.stock <= 0 && styles.variantOutOfStock,
                  ]}
                  onPress={() => v.stock > 0 && setSelectedVariant(v)}
                  disabled={v.stock <= 0}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: v.color_code || '#ccc' },
                    ]}
                  />
                  <Text style={styles.variantName} numberOfLines={1}>
                    {v.shade_name}
                  </Text>
                  {v.stock <= 0 && <Text style={styles.outOfStock}>نفذ</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {selectedVariant && (
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {Number(selectedVariant.price).toLocaleString('ar-IQ')} د.ع
            </Text>
            <Text style={styles.stock}>
              {selectedVariant.stock > 0
                ? `متوفر (${selectedVariant.stock})`
                : 'غير متوفر'}
            </Text>
          </View>
        )}

        {product.reviews?.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>التقييمات</Text>
            {product.reviews.slice(0, 3).map((r) => (
              <View key={r.id} style={styles.reviewItem}>
                <Text style={styles.reviewUser}>{r.user_name}</Text>
                <Text style={styles.reviewRating}>★ {r.rating}/5</Text>
                {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              </View>
            ))}
          </View>
        )}

        {user && selectedVariant && selectedVariant.stock > 0 && (
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>الكمية</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
              >
                <Icon name="remove" size={24} />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity
                onPress={() =>
                  setQuantity((q) => Math.min(selectedVariant.stock, q + 1))
                }
                style={styles.qtyBtn}
              >
                <Icon name="add" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {user && selectedVariant && selectedVariant.stock > 0 && (
          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
            <Icon name="shopping-cart" size={24} color="#fff" />
            <Text style={styles.addToCartText}>أضف للسلة</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  mainImage: { width, height: width, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  brand: { fontSize: 14, color: '#888', marginBottom: 4 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  variantsRow: { marginBottom: 16 },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  variantChipSelected: { borderColor: '#C2185B', backgroundColor: '#FCE4EC' },
  variantOutOfStock: { opacity: 0.5 },
  colorDot: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  variantName: { fontSize: 14, maxWidth: 80 },
  outOfStock: { fontSize: 12, color: '#f44336', marginRight: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#C2185B' },
  stock: { fontSize: 14, color: '#4CAF50' },
  reviewsSection: { marginBottom: 24 },
  reviewItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#eee' },
  reviewUser: { fontWeight: 'bold', marginBottom: 4 },
  reviewRating: { color: '#FFC107', marginBottom: 4 },
  reviewComment: { color: '#666', fontSize: 14 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  quantityLabel: { fontSize: 16, marginRight: 16 },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { padding: 8 },
  quantity: { fontSize: 18, marginHorizontal: 16 },
  addToCartBtn: {
    flexDirection: 'row',
    backgroundColor: '#C2185B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
