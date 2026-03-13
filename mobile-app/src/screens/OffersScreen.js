import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { offersAPI } from '../services/api';
import { API_BASE } from '../config';
import * as Haptics from 'expo-haptics';
import { colors, typography, shadows } from '../theme';
import { Skeleton } from '../components/Skeleton';

const { width: screenWidth } = Dimensions.get('window');
const PAD = 18;
const CARD_GAP = 14;
const NUM_COLS = 2;
const CARD_WIDTH = (screenWidth - PAD * 2 - CARD_GAP) / NUM_COLS;

function OfferCard({ item, imgUrl, index, onPress }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, delay: index * 35, useNativeDriver: true }).start();
  }, []);
  const opacity = anim;
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  return (
    <Animated.View style={[styles.cardWrap, { opacity, transform: [{ scale }] }]}>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <View style={styles.cardImgWrap}>
          {imgUrl ? (
            <>
              <Image source={{ uri: imgUrl }} style={styles.cardImage} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.cardOverlay} />
            </>
          ) : (
            <LinearGradient colors={[colors.primaryLight, colors.primarySoft]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          )}
          {item.discount_label ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{item.discount_label}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function OffersScreen() {
  const navigation = useNavigation();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOffers = async () => {
    try {
      const { data } = await offersAPI.getAll();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOffers(); }, []);

  const onRefresh = () => { setRefreshing(true); loadOffers(); };

  const handleOfferPress = (offer) => {
    let productIds = [];
    try {
      const parsed = typeof offer.product_ids === 'string' ? JSON.parse(offer.product_ids || '[]') : offer.product_ids || [];
      productIds = Array.isArray(parsed) ? parsed : [];
    } catch (_) {}
    const productIdsStr = productIds.filter((id) => id).join(',');
    navigation.navigate('Products', { productIds: productIdsStr, offerTitle: offer.title });
  };

  const renderItem = ({ item, index }) => {
    const imgUrl = item.image ? `${API_BASE}${item.image}` : null;
    return <OfferCard item={item} imgUrl={imgUrl} index={index} onPress={() => handleOfferPress(item)} />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.skeleton, styles.skeletonLight, { width: 50, height: 16 }]} />
          <View style={[styles.skeleton, styles.skeletonLight, { width: 40, height: 12, marginTop: 4 }]} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.skeletonCard}><Skeleton width="100%" height={160} borderRadius={18} /></View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Icon name="arrow-forward" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>العروض الحصرية</Text>
          <Text style={styles.subtitle}>{offers.length} عرض</Text>
        </View>
      </View>
      <FlatList
        data={offers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={NUM_COLS}
        key="offers-grid"
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Icon name="percent-outline" size={48} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>لا توجد عروض حالياً</Text>
            <Text style={styles.emptyText}>تأكدي من مراجعة التطبيق لاحقاً للاطلاع على أحدث العروض</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingHorizontal: PAD,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadows.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  headerTextWrap: { flex: 1, alignItems: 'flex-end' },
  title: { ...typography.h2, fontSize: 22, color: colors.white, textAlign: 'right' },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.92)', marginTop: 4, textAlign: 'right' },
  listContent: { padding: PAD, paddingTop: 18, paddingBottom: 120 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: CARD_GAP, marginBottom: CARD_GAP },
  cardWrap: { width: CARD_WIDTH },
  card: {
    borderRadius: 22, overflow: 'hidden', backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(232,93,122,0.08)',
    ...shadows.md,
  },
  cardPressed: { opacity: 0.96 },
  cardImgWrap: { height: 140, position: 'relative', backgroundColor: colors.primarySoft },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  discountBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  discountBadgeText: { ...typography.overline, color: colors.white, fontSize: 11 },
  cardTitle: { padding: 14, ...typography.label, fontSize: 14, color: colors.text, textAlign: 'right' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { ...typography.h3, color: colors.text, textAlign: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textMuted, marginTop: 10, textAlign: 'center', paddingHorizontal: 24 },
  skeleton: { backgroundColor: colors.border, borderRadius: 6, alignSelf: 'flex-end' },
  skeletonLight: { backgroundColor: 'rgba(255,255,255,0.4)' },
  skeletonCard: { marginBottom: CARD_GAP },
});
