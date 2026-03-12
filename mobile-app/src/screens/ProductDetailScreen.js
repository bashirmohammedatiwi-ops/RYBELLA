import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Share,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { productsAPI, wishlistAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { API_BASE } from '../config';
import { colors, borderRadius, shadows, gradients } from '../theme';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const { addProduct: addRecentlyViewed } = useRecentlyViewed();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  useEffect(() => {
    if (product?.id) addRecentlyViewed(product.id);
  }, [product?.id]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const guestData = !user
        ? {
            product_name: product.name,
            shade_name: selectedVariant.shade_name,
            price: selectedVariant.price,
            image: selectedVariant.image || product.main_image,
          }
        : null;
      await addItem(selectedVariant.id, quantity, guestData);
      toast.show('تمت الإضافة للسلة');
      navigation.navigate('Cart');
    } catch (err) {
      toast.show(err.response?.data?.message || 'فشل الإضافة للسلة');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `شوف هذا المنتج: ${product.name} - Rybella العراق`,
        title: product.name,
      });
    } catch (_) {}
  };

  const hasReviewed = user && product?.reviews?.some((r) => Number(r.user_id) === Number(user.id));
  const canReview = user && !hasReviewed;

  const handleSubmitReview = async () => {
    if (!canReview || !product) return;
    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        product_id: parseInt(productId, 10),
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });
      toast.success('تم إضافة التقييم بنجاح');
      setShowReviewForm(false);
      setReviewComment('');
      loadProduct();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إضافة التقييم');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleWishlist = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <LinearGradient colors={gradients.light} style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-forward" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Icon name="share" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWishlist} style={styles.headerBtn}>
            <Icon name={inWishlist ? 'favorite' : 'favorite-border'} size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
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

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>التقييمات</Text>
          {product.reviews?.length > 0 ? (
            <>
              {product.reviews.slice(0, 5).map((r) => (
                <View key={r.id} style={styles.reviewItem}>
                  <Text style={styles.reviewUser}>{r.user_name}</Text>
                  <Text style={styles.reviewRating}>★ {r.rating}/5</Text>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noReviewsText}>لا توجد تقييمات بعد</Text>
          )}
          {!user && (
            <TouchableOpacity
              style={styles.addReviewBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Icon name="rate-review" size={20} color={colors.primary} />
              <Text style={styles.addReviewText}>سجّل الدخول لتقييم المنتج</Text>
            </TouchableOpacity>
          )}
          {canReview && !showReviewForm && (
            <TouchableOpacity
              style={styles.addReviewBtn}
              onPress={() => setShowReviewForm(true)}
            >
              <Icon name="rate-review" size={20} color={colors.primary} />
              <Text style={styles.addReviewText}>أضف تقييمك</Text>
            </TouchableOpacity>
          )}
          {canReview && showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormLabel}>التقييم</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setReviewRating(s)}
                    style={styles.starBtn}
                  >
                    <Icon
                      name={s <= reviewRating ? 'star' : 'star-border'}
                      size={32}
                      color={colors.accent}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.reviewFormLabel}>التعليق (اختياري)</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="شاركنا رأيك..."
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.reviewFormActions}>
                <TouchableOpacity
                  style={styles.cancelReviewBtn}
                  onPress={() => { setShowReviewForm(false); setReviewComment(''); }}
                >
                  <Text style={styles.cancelReviewText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitReviewBtn, submittingReview && styles.disabled]}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitReviewText}>إرسال</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

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
          <TouchableOpacity
            style={styles.addToCartBtn}
            onPress={handleAddToCart}
            activeOpacity={0.9}
          >
            <Icon name="shopping-cart" size={22} color="#fff" />
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
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  imageSlide: { width, height: width },
  mainImage: { width, height: width, backgroundColor: colors.borderLight, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  content: { padding: 22, backgroundColor: colors.white, marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
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
  noVariantsText: { color: colors.primaryDarkText, textAlign: 'right', fontSize: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  price: { fontSize: 26, fontWeight: '800', color: colors.primary },
  stock: { fontSize: 14, color: colors.success, fontWeight: '600' },
  reviewsSection: { marginBottom: 24 },
  reviewItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.borderLight },
  reviewUser: { fontWeight: 'bold', marginBottom: 4, color: colors.text },
  reviewRating: { color: colors.accent, marginBottom: 4 },
  reviewComment: { color: colors.textSecondary, fontSize: 14 },
  noReviewsText: { color: colors.textMuted, fontSize: 14, marginBottom: 12 },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  addReviewText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  reviewForm: { marginTop: 16, padding: 16, backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  reviewFormLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.text },
  starsRow: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  starBtn: { padding: 4 },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  reviewFormActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  cancelReviewBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelReviewText: { color: colors.textSecondary, fontSize: 16 },
  submitReviewBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: borderRadius.md,
  },
  submitReviewText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.7 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  quantityLabel: { fontSize: 16, marginRight: 16 },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  qtyBtn: { padding: 8 },
  quantity: { fontSize: 18, marginHorizontal: 16 },
  addToCartBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadows.button,
  },
  addToCartText: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
