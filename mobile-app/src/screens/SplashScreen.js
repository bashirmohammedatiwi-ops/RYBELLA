import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>Rybella</Text>
        <Text style={styles.subtitle}>العراق</Text>
      </View>
      <Text style={styles.tagline}>مستحضرات تجميل أصلية</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  logoBox: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 44,
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 24,
  },
  loader: {
    marginTop: 48,
  },
});
