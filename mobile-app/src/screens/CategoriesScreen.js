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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { categoriesAPI } from '../services/api';
import { API_BASE } from '../config';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, shadows, typography } from '../theme';
import { Skeleton } from '../components/Skeleton';

const { width: screenWidth } = Dimensions.get('window');
const PAD = 18;

function CategoryCard({ item, imgUrl, index, onPress }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const opacity = anim;

  const iconName = item.icon && item.icon.trim() ? item.icon.trim() : 'tag-outline';
  const hasOverlayText = item.overlay_text && item.overlay_text.trim();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: 12 }}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardInner}>
          {imgUrl ? (
            <>
              <Image source={{ uri: imgUrl }} style={styles.cardImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
                style={styles.cardOverlay}
              />
            </>
          ) : (
            <LinearGradient
              colors={[colors.primaryLight, colors.primarySoft]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={styles.cardContent}>
            <View style={styles.topRow}>
              <View style={[styles.iconBadge, imgUrl && styles.iconBadgeLight]}>
                <Icon name={iconName} size={24} color={imgUrl ? colors.white : colors.primary} />
              </View>
              {hasOverlayText && (
                <View style={[styles.overlayTextBadge, !imgUrl && styles.overlayTextBadgeSolid]}>
                  <Text style={[styles.overlayText, !imgUrl && { color: colors.primary }]} numberOfLines={1}>
                    {item.overlay_text.trim()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.bottomRow}>
              <Text style={[styles.cardName, imgUrl && styles.cardNameLight]} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.arrowBtn}>
                <Icon name="chevron-left" size={20} color={imgUrl ? colors.white : colors.primary} />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const goToProducts = (item) =>
    navigation.navigate('Products', { categoryId: item.id });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.skeleton, styles.skeletonLight, { width: 50, height: 16 }]} />
          <View style={[styles.skeleton, styles.skeletonLight, { width: 40, height: 12, marginTop: 4 }]} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width="100%" height={140} borderRadius={16} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الفئات</Text>
        <Text style={styles.subtitle}>{categories.length} تصنيف</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <CategoryCard
            item={item}
            imgUrl={item.image ? `${API_BASE}${item.image}` : null}
            index={index}
            onPress={() => goToProducts(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="tag-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد فئات</Text>
            <Text style={styles.emptyText}>أضف فئات من لوحة التحكم</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingHorizontal: PAD,
    paddingBottom: 20,
    alignItems: 'flex-end',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadows.lg,
  },
  title: {
    ...typography.h2,
    fontSize: 22,
    color: colors.white,
    textAlign: 'right',
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
    textAlign: 'right',
  },
  listContent: {
    padding: PAD,
    paddingTop: 18,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.06)',
  },
  cardPressed: {
    opacity: 0.96,
  },
  cardInner: {
    height: 150,
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 14,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeLight: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  overlayTextBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '55%',
  },
  overlayTextBadgeSolid: {
    backgroundColor: colors.white,
  },
  overlayText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    ...typography.h4,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  cardNameLight: {
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 8,
  },
  skeleton: {
    backgroundColor: colors.border,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  skeletonLight: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  skeletonCard: { marginBottom: 12 },
});
