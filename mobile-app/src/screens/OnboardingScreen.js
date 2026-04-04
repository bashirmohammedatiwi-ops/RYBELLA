import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, gradients, borderRadius, typography, shadows } from '../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'lipstick',
    title: 'مستحضرات تجميل يومياً',
    subtitle: 'اكتشف أحدث منتجات التجميل والعناية بالبشرة من أفضل العلامات التجارية',
  },
  {
    id: '2',
    icon: 'lightbulb-on',
    title: 'نصائح وحيل مثيرة',
    subtitle: 'استفد من نصائحنا لتطبيق الماكياج بشكل احترافي وحماية بشرتك',
  },
  {
    id: '3',
    icon: 'tag-multiple',
    title: 'أسعار منافسة وقيمة تستحق',
    subtitle: 'استمتع بخصومات حصرية وجودة عالية بأسعار لا تضاهى',
  },
];

function LotusLogo() {
  return (
    <View style={styles.logoWrap}>
      <LinearGradient colors={gradients.primary} style={styles.logoGradient}>
        <Icon name="flower-lotus" size={48} color={colors.white} />
      </LinearGradient>
    </View>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish();
    }
  };

  const handleSkip = () => onFinish();

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <LotusLogo />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <View style={styles.heroImageWrap}>
        <LinearGradient
          colors={[colors.primarySoft, colors.accentLight]}
          style={styles.heroPlaceholder}
        >
          <Icon name={item.icon} size={80} color={colors.primary} />
        </LinearGradient>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFBF9', '#FFF5F2']} style={StyleSheet.absoluteFill} />
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>
              {currentIndex === SLIDES.length - 1 ? 'ابدأ' : 'التالي'}
            </Text>
            <Icon name="arrow-left" size={22} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: 52, left: 20, zIndex: 10 },
  skipText: { ...typography.label, color: colors.textMuted },
  slide: {
    width,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  logoWrap: { marginBottom: 28 },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  heroImageWrap: { marginTop: 32, width: '100%', alignItems: 'center' },
  heroPlaceholder: {
    width: width - 80,
    height: 180,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  nextBtn: { borderRadius: borderRadius.pill, overflow: 'hidden' },
  nextGradient: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextText: { ...typography.h3, color: colors.white },
});
