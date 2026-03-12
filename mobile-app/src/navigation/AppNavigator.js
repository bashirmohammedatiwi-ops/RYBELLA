import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme';

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

const TAB_ICONS = {
  Home: { out: 'home-outline', in: 'home' },
  Categories: { out: 'view-grid-outline', in: 'view-grid' },
  Cart: { out: 'cart-outline', in: 'cart' },
  Orders: { out: 'clipboard-list-outline', in: 'clipboard-list' },
  Profile: { out: 'account-outline', in: 'account' },
};

function MainTabs() {
  const { totalCount } = useCart();
  const insets = useSafeAreaInsets();

  const tabBarBg = () => (
    <View style={styles.tabBarBgWrap}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tabBarShine} />
    </View>
  );

  const bottomPad = Platform.OS === 'ios' ? insets.bottom : 10;
  const barHeight = 58 + bottomPad;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const isCart = route.name === 'Cart';
        return {
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name] || { out: 'circle', in: 'circle' };
            const name = focused ? icons.in : icons.out;
            const iconColor = isCart && focused ? colors.white : color;
            const iconSize = isCart ? 26 : 24;
            if (isCart && totalCount > 0) {
              return (
                <View>
                  <Icon name={name} size={iconSize} color={iconColor} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalCount > 99 ? '99+' : totalCount}</Text>
                  </View>
                </View>
              );
            }
            return <Icon name={name} size={iconSize} color={iconColor} />;
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
          tabBarBackground: tabBarBg,
          tabBarStyle: {
            position: 'absolute',
            height: barHeight,
            paddingTop: 10,
            paddingBottom: bottomPad,
            borderTopWidth: 0,
            marginHorizontal: 20,
            marginBottom: Platform.OS === 'web' ? 12 : bottomPad,
            borderRadius: 24,
            overflow: 'hidden',
            elevation: 12,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
          },
          tabBarLabelStyle: { ...typography.overline, fontSize: 11 },
          tabBarItemStyle: { paddingVertical: 6 },
        };
      }}
      sceneContainerStyle={{ paddingBottom: barHeight + 20 }}
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

  if (loading) return <SplashScreen />;
  if (onboardingDone === false) return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  if (onboardingDone === null) return <SplashScreen />;

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
  tabBarBgWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tabBarShine: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...typography.overline, color: '#fff' },
});
