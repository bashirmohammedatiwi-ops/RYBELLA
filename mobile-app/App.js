import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from '@expo-google-fonts/tajawal/useFonts';
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
  Tajawal_900Black,
} from '@expo-google-fonts/tajawal';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ToastProvider } from './src/context/ToastContext';
import { RecentlyViewedProvider } from './src/context/RecentlyViewedContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

try { SplashScreen.preventAutoHideAsync?.(); } catch (_) {}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    Tajawal_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      try { await SplashScreen.hideAsync?.(); } catch (_) {}
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} onLayout={onLayoutRootView} />;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <RecentlyViewedProvider>
            <AppNavigator />
            <StatusBar style="dark" />
          </RecentlyViewedProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
    </View>
  );
}
