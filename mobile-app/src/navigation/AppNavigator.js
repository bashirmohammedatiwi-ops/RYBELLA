import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
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
          return <Icon name={icons[route.name] || 'circle'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
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
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainTabs">
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Brands" component={BrandsScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
