import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Rybella</Text>
      <Text style={styles.subtitle}>العراق</Text>
      <ActivityIndicator size="large" color="#C2185B" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#C2185B',
  },
  subtitle: {
    fontSize: 24,
    color: '#666',
    marginTop: 4,
  },
  loader: {
    marginTop: 40,
  },
});
