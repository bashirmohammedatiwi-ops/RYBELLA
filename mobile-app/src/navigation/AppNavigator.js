import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import BrandsScreen from '../screens/BrandsScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const ONBOARDING_DONE_KEY = 'rybella_onboarding_done';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { totalCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Categories: 'view-grid',
            Cart: 'cart',
            Orders: 'clipboard-list',
            Profile: 'account',
          };
          if (route.name === 'Cart' && totalCount > 0) {
            return (
              <View>
                <Icon name="cart" size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalCount > 99 ? '99+' : totalCount}</Text>
                </View>
              </View>
            );
          }
          return <Icon name={icons[route.name] || 'circle'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
        ),
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'الرئيسية' }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ tabBarLabel: 'الفئات' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'السلة' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarLabel: 'طلباتي' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'حسابي' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((v) => setOnboardingDone(v === '1'));
  }, []);

  const handleOnboardingFinish = () => {
    AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
    setOnboardingDone(true);
  };

  if (loading) {
    return <SplashScreen />;
  }

  if (onboardingDone === false) {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }

  if (onboardingDone === null) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left',
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName="MainTabs"
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Brands" component={BrandsScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    left: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
