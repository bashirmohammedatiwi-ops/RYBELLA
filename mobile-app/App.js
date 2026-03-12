import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ToastProvider } from './src/context/ToastContext';
import { RecentlyViewedProvider } from './src/context/RecentlyViewedContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
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
  );
}
