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
import { API_BASE } from '../config';
import { colors, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

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
  }, [productId, user]);

  const loadProduct = async () => {
    try {
      const { data } = await productsAPI.getById(productId);
      setProduct(data);
      if (data.variants?.length) {
        setSelectedVariant(data.variants.find((v) => v.stock > 0) || data.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      if (user) {
        try {
          const { data: list } = await wishlistAPI.getWishlist();
          const ids = (list || []).map((p) => p.id);
          setInWishlist(ids.includes(parseInt(productId, 10)));
        } catch (_) { /* ignore */ }
      } else {
        setInWishlist(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (!selectedVariant) return;
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

  // تجميع كل الصور: صورة العنصر المختار + الرئيسية + الإضافية (بدون تكرار)
  const allImages = [];
  const seen = new Set();
  const addImg = (path) => {
    if (path && !seen.has(path)) {
      seen.add(path);
      allImages.push(getImageUrl(path));
    }
  };
  if (selectedVariant?.image) addImg(selectedVariant.image);
  if (product.main_image) addImg(product.main_image);
  (product.images || []).forEach(addImg);
  const mainImage = allImages[0] || null;

  const hasVariants = product.variants?.length > 0;
  const canAddToCart = hasVariants && selectedVariant && selectedVariant.stock > 0;

  const badges = [];
  if (product.is_featured) badges.push('مميز');
  if (product.is_best_seller) badges.push('أكثر مبيعاً');
  if (product.new_until && product.new_until >= new Date().toISOString().slice(0, 10)) badges.push('جديد');
  else if (product.created_at && (Date.now() - new Date(product.created_at)) / (1000 * 60 * 60 * 24) <= 30) badges.push('جديد');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-forward" size={26} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleWishlist} style={styles.headerBtn}>
          <Icon name={inWishlist ? 'favorite' : 'favorite-border'} size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {allImages.length > 0 && (
        <FlatList
          data={allImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={styles.imageSlide}>
              <Image source={{ uri: item }} style={styles.mainImage} resizeMode="contain" />
            </View>
          )}
        />
      )}

      <View style={styles.content}>
        {badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.map((b, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.brand}>{product.brand_name}</Text>
        <Text style={styles.name}>{product.name}</Text>
        {product.description && (
          <Text style={styles.description}>{product.description}</Text>
        )}

        {hasVariants && (
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

        {selectedVariant ? (
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
        ) : (
          <View style={styles.priceRow}>
            <Text style={styles.unavailableText}>سيتوفر قريباً</Text>
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

        {!hasVariants && (
          <View style={styles.noVariants}>
            <Icon name="info-outline" size={32} color={colors.textMuted} />
            <Text style={styles.noVariantsText}>سيتوفر قريباً - تواصل معنا للاستفسار</Text>
          </View>
        )}
        {canAddToCart && (
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

        {canAddToCart && (
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
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  headerBtn: { padding: 8 },
  imageSlide: { width, height: width },
  mainImage: { width, height: width, backgroundColor: colors.borderLight, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  content: { padding: 20, backgroundColor: colors.white, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  brand: { fontSize: 13, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 10, letterSpacing: 0.3 },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, color: colors.text },
  variantsRow: { marginBottom: 18 },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  variantChipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft, ...shadows.soft },
  variantOutOfStock: { opacity: 0.5 },
  colorDot: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  variantName: { fontSize: 14, maxWidth: 80 },
  outOfStock: { fontSize: 12, color: colors.error, marginRight: 4 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  noVariants: { padding: 16, backgroundColor: colors.primarySoft, borderRadius: borderRadius.md, marginBottom: 16 },
  noVariantsText: { color: colors.primaryDark, textAlign: 'right', fontSize: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  price: { fontSize: 26, fontWeight: '800', color: colors.primary },
  stock: { fontSize: 14, color: colors.success, fontWeight: '600' },
  reviewsSection: { marginBottom: 24 },
  reviewItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.borderLight },
  reviewUser: { fontWeight: 'bold', marginBottom: 4, color: colors.text },
  reviewRating: { color: colors.accent, marginBottom: 4 },
  reviewComment: { color: colors.textSecondary, fontSize: 14 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  quantityLabel: { fontSize: 16, marginRight: 16 },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { padding: 8 },
  quantity: { fontSize: 18, marginHorizontal: 16 },
  addToCartBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadows.button,
  },
  addToCartText: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
