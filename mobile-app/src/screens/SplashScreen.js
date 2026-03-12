import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

export default function SplashScreen() {
  const fadeLogo = useRef(new Animated.Value(0)).current;
  const scaleLogo = useRef(new Animated.Value(0.8)).current;
  const fadeSub = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeLogo, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleLogo, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeSub, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.primarySoft }]}>
      <View style={styles.logoBox}>
        <Animated.Text
          style={[
            styles.logo,
            {
              opacity: fadeLogo,
              transform: [{ scale: scaleLogo }],
            },
          ]}
        >
          Rybella
        </Animated.Text>
        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: fadeSub },
          ]}
        >
          العراق
        </Animated.Text>
      </View>
      <Animated.Text style={[styles.tagline, { opacity: fadeSub }]}>
        مستحضرات تجميل أصلية ✨
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: { alignItems: 'center' },
  logo: {
    fontSize: 46,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 24,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 28,
    fontWeight: '500',
  },
});
