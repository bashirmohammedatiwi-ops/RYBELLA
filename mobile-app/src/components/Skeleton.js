import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

export function Skeleton({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width ?? '100%',
          height: height ?? 20,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={165} borderRadius={18} />
      <View style={styles.cardContent}>
        <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={18} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

export function BannerSkeleton() {
  return (
    <Skeleton
      width={screenWidth - 40}
      height={155}
      borderRadius={18}
      style={{ marginHorizontal: 6 }}
    />
  );
}

export function ProductGridSkeleton() {
  return (
    <View style={styles.gridCard}>
      <Skeleton width="100%" height={140} borderRadius={14} />
      <View style={styles.cardContent}>
        <Skeleton width="90%" height={12} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={12} />
        <Skeleton width="35%" height={16} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

export function CategoryCardSkeleton() {
  return (
    <View style={styles.categoryCard}>
      <Skeleton width="100%" height="100%" borderRadius={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  card: {
    width: 165,
    marginLeft: 12,
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardContent: { padding: 12 },
  gridCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    maxWidth: '48%',
    height: 150,
    borderRadius: 18,
    overflow: 'hidden',
  },
});
