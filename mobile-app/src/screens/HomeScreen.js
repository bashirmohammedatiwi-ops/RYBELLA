import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { productsAPI, brandsAPI, bannersAPI, categoriesAPI, subcategoriesAPI } from '../services/api';
import { API_BASE } from '../config';
import * as Haptics from 'expo-haptics';
import { colors, shadows, typography } from '../theme';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useCart } from '../context/CartContext';
import { ProductCardSkeleton, BannerSkeleton } from '../components/Skeleton';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 56) / 2;
const formatPrice = (p) => `${Number(p).toLocaleString('ar-IQ')} د.ع`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'صباح الجمال', emoji: '🌷' };
  if (h < 17) return { text: 'أهلاً بكم', emoji: '✨' };
  return { text: 'مساء الأناقة', emoji: '🌙' };
};

function ProductCard({ item, index, onPress, imgUrl, minPrice, badges, inStock, wide }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 40, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, []);
  const cardW = wide ? 155 : CARD_W;
  const imgH = wide ? 155 : CARD_W;
  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
      <TouchableOpacity style={[s.pCard, { width: cardW }]} onPress={onPress} activeOpacity={0.92}>
        <View style={[s.pImgWrap, { height: imgH }]}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={s.pImg} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[colors.primarySoft, colors.accentLight]} style={s.pImg} />
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.15)']} style={s.pImgGradient} />
          {badges.length > 0 && (
            <View style={s.pBadge}>
              <Text style={s.pBadgeText}>{badges[0].label}</Text>
            </View>
          )}
          {!inStock && (
            <View style={s.pSoldOut}><Text style={s.pSoldOutText}>نفذ</Text></View>
          )}
          <TouchableOpacity style={s.pFav} activeOpacity={0.7}>
            <Icon name="heart-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={s.pInfo}>
          <Text style={s.pName} numberOfLines={2}>{item.name}</Text>
          {item.brand_name ? <Text style={s.pBrand}>{item.brand_name}</Text> : null}
          <Text style={s.pPrice}>{formatPrice(minPrice)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SectionHeader({ title, icon, onSeeAll, accent }) {
  return (
    <View style={s.secHead}>
      <View style={s.secHeadLeft}>
        {icon && (
          <LinearGradient colors={accent ? [colors.primary, colors.primaryLight] : [colors.primarySoft, colors.accentLight]} style={s.secIcon}>
            <Icon name={icon} size={22} color={accent ? colors.white : colors.primary} />
          </LinearGradient>
        )}
        <View>
          <Text style={s.secTitle}>{title}</Text>
          <View style={[s.secTitleUnderline, accent && s.secTitleUnderlineAccent]} />
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={s.seeAllBtn} activeOpacity={0.7}>
          <Text style={s.seeAllText}>الكل</Text>
          <Icon name="chevron-left" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function BannerDots({ count, active }) {
  if (count <= 1) return null;
  return (
    <View style={s.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[s.dot, i === active && s.dotActive]} />
      ))}
    </View>
  );
}

function DecorativeDots() {
  return (
    <View style={s.dotsPattern} pointerEvents="none">
      {[...Array(12)].map((_, i) => (
        <View key={i} style={[s.dotPattern, { left: (i % 4) * 22 + 8, top: Math.floor(i / 4) * 18 + 6 }]} />
      ))}
    </View>
  );
}

function WaveDivider() {
  return (
    <View style={s.waveWrap}>
      <View style={s.waveCurve} />
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { products: recentlyViewed } = useRecentlyViewed();
  const { totalCount } = useCart();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [error, setError] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setError(null);
    try {
      const [pR, fR, bR, bnR, cR, scR, offersR] = await Promise.all([
        productsAPI.getAll(),
        productsAPI.getAll({ featured: '1' }),
        brandsAPI.getAll(),
        bannersAPI.getAll().catch(() => ({ data: [] })),
        categoriesAPI.getAll().catch(() => ({ data: [] })),
        subcategoriesAPI.getAll().catch(() => ({ data: [] })),
        offersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      const toArr = (d) => (Array.isArray(d) ? d : d?.data && Array.isArray(d.data) ? d.data : []);
      setProducts(toArr(pR.data));
      setFeaturedProducts(toArr(fR.data));
      setBrands(toArr(bR.data));
      setBanners(toArr(bnR.data));
      setCategories(toArr(cR.data));
      setSubcategories(toArr(scR.data));
      setOffers(toArr(offersR.data));
    } catch (err) {
      setError(err.message || 'تعذر الاتصال');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const imgOf = useCallback((p) => {
    const i = p.main_image || p.images?.[0] || p.variants?.[0]?.image;
    return i ? `${API_BASE}${i}` : null;
  }, []);
  const minPriceOf = useCallback((p) => {
    const pr = p.variants?.map((v) => parseFloat(v.price)).filter(Boolean);
    return pr?.length ? Math.min(...pr) : 0;
  }, []);
  const isNew = useCallback((p) => {
    if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) return true;
    if (p.created_at) return (Date.now() - new Date(p.created_at)) / 864e5 <= 30;
    return false;
  }, []);
  const badgesOf = useCallback((item) => {
    const b = [];
    if (item.is_featured) b.push({ label: 'مميز' });
    if (item.is_best_seller) b.push({ label: 'الأكثر مبيعاً' });
    if (isNew(item)) b.push({ label: 'جديد' });
    return b;
  }, [isNew]);

  const goProduct = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProductDetail', { productId: id });
  };

  const featured = featuredProducts.length ? featuredProducts.slice(0, 10) : products.slice(0, 10);
  const newArrivals = [...products].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10);
  const bestSellers = products.filter((p) => p.is_best_seller).slice(0, 10);

  const renderHProduct = ({ item, index }) => (
    <ProductCard
      item={item}
      index={index}
      onPress={() => goProduct(item.id)}
      imgUrl={imgOf(item)}
      minPrice={minPriceOf(item)}
      badges={badgesOf(item)}
      inStock={item.variants?.some((v) => v.stock > 0)}
      wide
    />
  );

  if (error && !loading) {
    return (
      <View style={s.container}>
        <View style={s.errorWrap}>
          <Icon name="wifi-off" size={56} color={colors.border} />
          <Text style={s.errorTitle}>لا يوجد اتصال</Text>
          <Text style={s.errorMsg}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadData}><Text style={s.retryText}>إعادة المحاولة</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.topBar}><View style={{ width: 44 }} /><Text style={s.logoText}>RYBELLA</Text><View style={{ width: 44 }} /></View>
        <View style={{ padding: 20 }}>
          <BannerSkeleton />
          <View style={{ marginTop: 32 }}><ScrollView horizontal showsHorizontalScrollIndicator={false}>{[1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}</ScrollView></View>
        </View>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      scrollEventThrottle={16}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* ─── HEADER ─── */}
      <LinearGradient colors={['#FFE0E6', '#FFE9ED', '#FFF2F4', '#FFF9FA']} style={s.heroGradient}>
        <View style={s.headerDecor} />
        <View style={s.headerDecor2} />
        <View style={s.headerDecor3} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.topBtn} onPress={() => navigation.navigate('Categories')} activeOpacity={0.8}>
            <Icon name="view-grid-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={s.logoWrap}>
            <View style={s.logoAccent} />
            <Text style={s.greetingText}>{getGreeting().emoji} {getGreeting().text}</Text>
            <Text style={s.logoText}>RYBELLA</Text>
            <Text style={s.logoSub}>الجمال الذي تستحقينه</Text>
          </View>
          <TouchableOpacity style={s.topBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.8}>
            <Icon name="shopping-outline" size={24} color={colors.text} />
            {totalCount > 0 && <View style={s.cartDot}><Text style={s.cartDotText}>{totalCount > 9 ? '9+' : totalCount}</Text></View>}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity style={s.search} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(232,93,122,0.08)', 'rgba(232,93,122,0.04)']} style={s.searchIconWrap}>
            <Icon name="magnify" size={24} color={colors.primary} />
          </LinearGradient>
          <Text style={s.searchText}>ابحثي عن منتج، ماركة...</Text>
        </TouchableOpacity>
      </LinearGradient>

      <WaveDivider />

      <View style={s.body}>
        {/* ─── BANNERS ─── */}
        {banners.length > 0 && (
          <View style={s.bannerWrap}>
            <View style={s.bannerLabelWrap}>
              <View style={s.sectionLabel}>
                <View style={s.sectionLabelLine} />
                <Text style={s.sectionLabelText}>عروض حصرية</Text>
              </View>
            </View>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 40)))}
            >
              {banners.map((b) => (
                <TouchableOpacity key={b.id} activeOpacity={1} style={s.bannerSlide}
                  onPress={() => {
                    if (b.link_type === 'product' && b.link_value) goProduct(parseInt(b.link_value));
                    else if (b.link_type === 'category' && b.link_value) navigation.navigate('Products', { categoryId: parseInt(b.link_value) });
                  }}>
                  <Image source={{ uri: b.image ? `${API_BASE}${b.image}` : null }} style={s.bannerImg} resizeMode="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)']} style={s.bannerOverlay} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <BannerDots count={banners.length} active={bannerIdx} />
          </View>
        )}

        {/* ─── CATEGORIES (circles) ─── */}
        {categories.length > 0 && (
          <View style={[s.section, s.sectionBg, s.sectionWithDots]}>
            <DecorativeDots />
            <SectionHeader title="تصفحي الفئات" icon="circle-outline" onSeeAll={() => navigation.navigate('Categories')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
              {categories.map((c) => {
                const img = c.image ? `${API_BASE}${c.image}` : null;
                return (
                  <TouchableOpacity key={c.id} style={s.catItem} activeOpacity={0.85}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Products', { categoryId: c.id }); }}>
                    <View style={s.catCircle}>
                      <View style={s.catCircleInner}>
                        {img ? <Image source={{ uri: img }} style={s.catImg} resizeMode="cover" /> :
                          <LinearGradient colors={[colors.primarySoft, colors.accentLight]} style={s.catImg} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── SUBCATEGORIES ─── */}
        {subcategories.length > 0 && (
          <View style={[s.section, s.sectionAlt]}>
            <SectionHeader title="تسوقي حسب النوع" icon="tag-heart-outline" accent />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.subRow}>
              {subcategories.slice(0, 12).map((sc) => {
                const img = sc.image ? `${API_BASE}${sc.image}` : null;
                return (
                  <TouchableOpacity key={sc.id} style={s.subCard} activeOpacity={0.88}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Products', { subcategoryId: sc.id }); }}>
                    <View style={s.subImgWrap}>
                      {img ? <Image source={{ uri: img }} style={s.subImg} resizeMode="cover" /> :
                        <LinearGradient colors={[colors.primarySoft, colors.pastelPeach]} style={s.subImg} />}
                    </View>
                    <Text style={s.subName} numberOfLines={1}>{sc.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── OFFERS ─── */}
        {offers.length > 0 && (
          <View style={[s.section, s.sectionOffers]}>
            <SectionHeader title="العروض الحصرية" icon="percent-outline" accent />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.offersRow}>
              {offers.map((offer) => {
                const img = offer.image ? `${API_BASE}${offer.image}` : null;
                let productIds = [];
                try {
                  const parsed = typeof offer.product_ids === 'string' ? JSON.parse(offer.product_ids || '[]') : offer.product_ids || [];
                  productIds = Array.isArray(parsed) ? parsed : [];
                } catch (_) {}
                const productIdsStr = productIds.filter((id) => id).join(',');
                return (
                  <TouchableOpacity
                    key={offer.id}
                    style={s.offerCard}
                    activeOpacity={0.88}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate('Products', { productIds: productIdsStr, offerTitle: offer.title });
                    }}
                  >
                    <View style={s.offerImgWrap}>
                      {img ? (
                        <Image source={{ uri: img }} style={s.offerImg} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={[colors.primarySoft, colors.accentLight]} style={s.offerImg} />
                      )}
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={s.offerOverlay} />
                      {offer.discount_label ? (
                        <View style={s.offerBadge}>
                          <Text style={s.offerBadgeText}>{offer.discount_label}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={s.offerTitle} numberOfLines={1}>{offer.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── FLASH SALE ─── */}
        {featured.length > 0 && (
          <View style={[s.section, s.sectionBg, { position: 'relative' }]}>
            <View style={s.flashRibbon}>
              <Text style={s.flashRibbonText}>عرض محدود</Text>
            </View>
            <LinearGradient colors={['rgba(232,93,122,0.14)', 'rgba(232,93,122,0.05)']} style={s.flashHead}>
              <View style={s.flashLeft}>
                <Icon name="lightning-bolt" size={20} color={colors.primary} />
                <Text style={s.flashTitle}>عرض خاص</Text>
              </View>
              <TouchableOpacity style={s.flashSeeAll} onPress={() => navigation.navigate('Products')} activeOpacity={0.85}>
                <Text style={s.flashSeeAllText}>عرض الكل</Text>
                <Icon name="chevron-left" size={16} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>
            <FlatList data={featured} renderItem={renderHProduct} keyExtractor={(i) => `f-${i.id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList} />
          </View>
        )}

        {/* ─── RECENTLY VIEWED ─── */}
        {recentlyViewed.length > 0 && (
          <View style={[s.section, s.sectionBg]}>
            <SectionHeader title="شاهدتِ مؤخراً" icon="history" />
            <FlatList data={recentlyViewed} renderItem={renderHProduct} keyExtractor={(i) => `rv-${i.id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList} />
          </View>
        )}

        {/* ─── BEST SELLERS ─── */}
        {bestSellers.length > 0 && (
          <View style={[s.section, s.sectionBg]}>
            <SectionHeader title="الأكثر مبيعاً" icon="fire" onSeeAll={() => navigation.navigate('Products')} />
            <FlatList data={bestSellers} renderItem={renderHProduct} keyExtractor={(i) => `bs-${i.id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList} />
          </View>
        )}

        {/* ─── NEW ARRIVALS ─── */}
        {newArrivals.length > 0 && (
          <View style={[s.section, s.sectionBg]}>
            <SectionHeader title="وصل حديثاً" icon="star-four-points-outline" onSeeAll={() => navigation.navigate('Products')} />
            <FlatList data={newArrivals} renderItem={renderHProduct} keyExtractor={(i) => `na-${i.id}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList} />
          </View>
        )}

        {/* ─── BRANDS ─── */}
        {brands.length > 0 && (
          <View style={[s.section, s.sectionBg]}>
            <SectionHeader title="الماركات" icon="diamond-stone" onSeeAll={() => navigation.navigate('Brands')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.brandRow}>
              {brands.slice(0, 12).map((b) => (
                <TouchableOpacity key={b.id} style={s.brandChip} activeOpacity={0.88}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Products', { brandId: b.id }); }}>
                  {b.logo ? <Image source={{ uri: `${API_BASE}${b.logo}` }} style={s.brandLogo} resizeMode="contain" /> :
                    <View style={[s.brandLogo, { backgroundColor: colors.borderLight }]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── ALL PRODUCTS GRID ─── */}
        <View style={[s.section, s.sectionLast, s.sectionWithDots]}>
          <DecorativeDots />
          <SectionHeader title="اكتشفي المزيد" icon="sparkles" onSeeAll={() => navigation.navigate('Products')} accent />
          <View style={s.gridWrap}>
            {products.slice(0, 6).map((item, idx) => (
              <ProductCard
                key={item.id}
                item={item}
                index={idx + 20}
                onPress={() => goProduct(item.id)}
                imgUrl={imgOf(item)}
                minPrice={minPriceOf(item)}
                badges={badgesOf(item)}
                inStock={item.variants?.some((v) => v.stock > 0)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </View>
    </Animated.ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  /* ── Hero / Header ── */
  heroGradient: { paddingBottom: 16, overflow: 'hidden' },
  headerDecor: {
    position: 'absolute', top: -80, left: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(232, 93, 122, 0.06)',
  },
  headerDecor2: {
    position: 'absolute', top: 120, right: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(232, 93, 122, 0.05)',
  },
  headerDecor3: {
    position: 'absolute', bottom: 40, left: -20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(232, 93, 122, 0.04)',
  },
  greetingText: {
    ...typography.overline,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
  },
  topBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
    ...shadows.md, borderWidth: 1, borderColor: 'rgba(232,93,122,0.08)',
  },
  logoWrap: { alignItems: 'center', flex: 1 },
  logoAccent: {
    position: 'absolute', top: -4, width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary,
  },
  logoText: {
    ...typography.h3, fontSize: 20, color: colors.primary, letterSpacing: 4,
  },
  logoSub: {
    ...typography.caption, fontSize: 10, color: colors.textMuted, marginTop: 2, letterSpacing: 0.5,
  },
  cartDot: {
    position: 'absolute', top: -3, right: -3,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  cartDotText: { color: colors.white, fontSize: 9, fontWeight: '800' },

  /* ── Search ── */
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: colors.white, borderRadius: 24, padding: 18,
    ...shadows.lg, borderWidth: 1.5, borderColor: 'rgba(232,93,122,0.1)',
  },
  searchIconWrap: {
    width: 44, height: 44, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  searchText: { flex: 1, textAlign: 'right', ...typography.bodySmall, color: colors.textMuted },

  /* ── Body ── */
  body: { paddingHorizontal: 20, paddingTop: 4 },
  section: { marginTop: 36 },
  sectionBg: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 28,
    marginTop: 28,
  },
  sectionLast: { paddingBottom: 8 },
  sectionAlt: {
    backgroundColor: 'rgba(232,93,122,0.04)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderRadius: 32,
    marginTop: 24,
  },
  sectionWithDots: { position: 'relative', overflow: 'hidden' },
  dotsPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 60,
    opacity: 0.4,
  },
  dotPattern: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  waveWrap: {
    height: 28,
    marginTop: -2,
    backgroundColor: 'transparent',
  },
  waveCurve: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    ...shadows.soft,
  },
  sectionLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 12,
  },
  sectionLabelLine: {
    width: 4, height: 18, borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionLabelText: {
    ...typography.overline,
    color: colors.primary,
    letterSpacing: 1,
  },
  bannerLabelWrap: { marginBottom: 14 },

  /* ── Banners ── */
  bannerWrap: { marginTop: 8 },
  bannerSlide: {
    width: SCREEN_W - 40, height: 200, borderRadius: 28, overflow: 'hidden',
    marginRight: 14, ...shadows.lg, borderWidth: 1, borderColor: 'rgba(232,93,122,0.08)',
  },
  bannerImg: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 28 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(232,93,122,0.25)' },
  dotActive: { width: 26, backgroundColor: colors.primary, borderRadius: 4, ...shadows.premium },

  /* ── Section Header ── */
  secHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  secHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  secTitle: { ...typography.h2, fontSize: 18, color: colors.text },
  secTitleUnderline: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(232,93,122,0.25)',
    marginTop: 6,
  },
  secTitleUnderlineAccent: {
    backgroundColor: colors.primary,
    width: 44,
  },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: 'rgba(232,93,122,0.2)',
  },
  seeAllText: { ...typography.caption, fontSize: 13, color: colors.primary },

  /* ── Categories (circles, images only) ── */
  catRow: { gap: 22, paddingRight: 4, paddingVertical: 6 },
  catItem: { alignItems: 'center', justifyContent: 'center' },
  catCircle: {
    width: 72, height: 72, borderRadius: 36,
    padding: 2.5,
    backgroundColor: colors.white,
    ...shadows.md,
    borderWidth: 2, borderColor: 'rgba(232,93,122,0.18)',
  },
  catCircleInner: {
    width: '100%', height: '100%', borderRadius: 33.5, overflow: 'hidden',
  },
  catImg: { width: '100%', height: '100%' },

  /* ── Subcategories ── */
  subRow: { gap: 18, paddingRight: 4 },
  subCard: {
    width: 100, backgroundColor: colors.white, borderRadius: 24, overflow: 'hidden',
    padding: 10, alignItems: 'center', ...shadows.md,
    borderWidth: 1.5, borderColor: 'rgba(232,93,122,0.1)',
  },
  subImgWrap: {
    width: 78, height: 78, borderRadius: 20, overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    ...shadows.soft,
  },
  subName: { ...typography.caption, fontSize: 11, color: colors.text, textAlign: 'center', marginTop: 10 },
  subImg: { width: '100%', height: '100%' },

  /* ── Offers ── */
  sectionOffers: {
    backgroundColor: 'rgba(255,249,250,0.98)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderRadius: 32,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.08)',
  },
  offersRow: { gap: 18, paddingRight: 4 },
  offerCard: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(232,93,122,0.12)',
  },
  offerImgWrap: {
    position: 'relative',
    height: 140,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  offerImg: { width: '100%', height: '100%' },
  offerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    ...shadows.premium,
  },
  offerBadgeText: { ...typography.overline, color: colors.white, fontSize: 11 },
  offerTitle: {
    padding: 16,
    ...typography.label,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },

  /* ── Flash sale ── */
  flashRibbon: {
    position: 'absolute',
    top: -4,
    left: 24,
    zIndex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    ...shadows.premium,
  },
  flashRibbonText: {
    ...typography.overline,
    color: colors.white,
    fontSize: 10,
  },
  flashHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 22, padding: 18, marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(232,93,122,0.12)',
    overflow: 'hidden',
  },
  flashLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flashTitle: { ...typography.h2, fontSize: 18, color: colors.primary },
  flashSeeAll: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16,
    backgroundColor: colors.primary, ...shadows.premium,
  },
  flashSeeAllText: { ...typography.caption, color: colors.white, fontSize: 13 },

  /* ── Brands ── */
  brandRow: { gap: 16, paddingRight: 4 },
  brandChip: {
    width: 80, height: 80, borderRadius: 22, backgroundColor: colors.white,
    padding: 14, alignItems: 'center', justifyContent: 'center',
    ...shadows.md, borderWidth: 1.5, borderColor: 'rgba(232,93,122,0.08)',
  },
  brandLogo: { width: '100%', height: '100%', borderRadius: 14 },

  /* ── Horizontal list ── */
  hList: { gap: 18, paddingRight: 4 },

  /* ── Product Card ── */
  pCard: {
    backgroundColor: colors.white, borderRadius: 24, overflow: 'hidden',
    ...shadows.lg, borderWidth: 1, borderColor: 'rgba(232,93,122,0.06)',
  },
  pImgWrap: { position: 'relative', backgroundColor: colors.primarySoft },
  pImg: { width: '100%', height: '100%' },
  pImgGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%',
  },
  pBadge: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: colors.primary, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
    ...shadows.premium,
  },
  pBadgeText: { ...typography.overline, color: colors.white, fontSize: 10 },
  pSoldOut: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pSoldOutText: { ...typography.caption, color: colors.white, fontSize: 10 },
  pFav: {
    position: 'absolute', top: 12, left: 12,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  pInfo: { padding: 16 },
  pName: { ...typography.label, color: colors.text, textAlign: 'right', lineHeight: 21 },
  pBrand: { ...typography.caption, fontSize: 11, color: colors.textMuted, marginTop: 6, textAlign: 'right' },
  pPrice: { ...typography.h4, fontSize: 17, color: colors.primary, marginTop: 10, textAlign: 'right' },

  /* ── Grid ── */
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18 },

  /* ── Error ── */
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { ...typography.h2, color: colors.text, marginTop: 16 },
  errorMsg: { ...typography.bodySmall, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 28, backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16,
    borderRadius: 18, ...shadows.premium,
  },
  retryText: { ...typography.h4, color: colors.white },
});
