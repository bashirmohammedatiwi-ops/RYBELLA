import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated, Dimensions } from 'react-native';
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
import * as Haptics from 'expo-haptics';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import BrandsScreen from '../screens/BrandsScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import OffersScreen from '../screens/OffersScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const ONBOARDING_DONE_KEY = 'rybella_onboarding_done';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const { width: SCREEN_W } = Dimensions.get('window');
const CART_BTN_SIZE = 56;
const CART_LIFT = 20;

const TABS = [
  { name: 'Home', label: 'الرئيسية', icon: 'home-outline', iconActive: 'home' },
  { name: 'Categories', label: 'الفئات', icon: 'view-grid-outline', iconActive: 'view-grid' },
  { name: 'Cart', label: 'السلة', icon: 'cart-outline', iconActive: 'cart' },
  { name: 'Orders', label: 'طلباتي', icon: 'clipboard-list-outline', iconActive: 'clipboard-list' },
  { name: 'Profile', label: 'حسابي', icon: 'account-outline', iconActive: 'account' },
];

function TabItem({ item, focused, totalCount, onPress, scaleAnim }) {
  const isCart = item.name === 'Cart';
  const iconName = focused ? item.iconActive : item.icon;
  const iconColor = focused ? colors.primary : colors.textMuted;

  return (
    <TouchableOpacity style={s.tabItem} onPress={onPress} activeOpacity={1}>
      <Animated.View style={[s.tabItemInner, { transform: [{ scale: scaleAnim }] }]}>
        <View style={s.iconWrap}>
          <Icon name={iconName} size={24} color={iconColor} />
          {isCart && totalCount > 0 && !focused && (
            <View style={s.badge}><Text style={s.badgeText}>{totalCount > 99 ? '99+' : totalCount}</Text></View>
          )}
        </View>
        <Text style={[s.label, focused && s.labelActive]}>{item.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function RybellaTabBar({ state, descriptors, navigation }) {
  const { totalCount } = useCart();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 20;

  const activeIndex = state.index;
  const scaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;

  const handlePress = (route, index) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.spring(scaleAnims[index], { toValue: 0.85, useNativeDriver: true, friction: 8, tension: 300 }),
        Animated.spring(scaleAnims[index], { toValue: 1, useNativeDriver: true, friction: 8, tension: 200 }),
      ]).start();
      navigation.navigate(route.name);
    }
  };

  const isCartActive = activeIndex === 2;

  return (
    <View style={[s.wrapper, { paddingBottom: bottomPad }]}>
      <View style={s.bar}>
        <View style={s.barBg}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF8F9', '#FFEEF2', '#FFF8F9']}
            locations={[0, 0.3, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={s.tabsRow}>
          {state.routes.map((route, i) => {
            if (i === 2) {
              return (
                <View key={route.key} style={s.cartSlot}>
                  <TouchableOpacity
                    style={[s.cartBtn, isCartActive && s.cartBtnActive]}
                    onPress={() => handlePress(route, i)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={isCartActive ? [colors.primary, colors.primaryLight] : ['#FFFFFF', '#FFF5F7']}
                      style={s.cartBtnGradient}
                    >
                      <Icon name="cart" size={28} color={isCartActive ? colors.white : colors.primary} />
                      {totalCount > 0 && (
                        <View style={[s.cartBadge, isCartActive && s.cartBadgeActive]}>
                          <Text style={[s.cartBadgeText, isCartActive && s.cartBadgeTextActive]}>
                            {totalCount > 99 ? '99+' : totalCount}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={[s.cartLabel, isCartActive && s.labelActive]}>السلة</Text>
                </View>
              );
            }
            return (
              <TabItem
                key={route.key}
                item={TABS[i]}
                focused={i === activeIndex}
                totalCount={totalCount}
                onPress={() => handlePress(route, i)}
                scaleAnim={scaleAnims[i]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  const bottomPad = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 20;
  const barHeight = 90 + bottomPad;

  return (
    <Tab.Navigator
      tabBar={(props) => <RybellaTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
      }}
      sceneContainerStyle={{ paddingBottom: barHeight + 28 }}
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
        <Stack.Screen name="Offers" component={OffersScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'web' ? 16 : 0,
  },
  bar: {
    height: 70,
    borderRadius: 36,
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,93,122,0.08)',
    elevation: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
  },
  barBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    overflow: 'hidden',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#FFF8F9',
  },
  badgeText: {
    ...typography.overline,
    fontSize: 9,
    color: colors.white,
  },
  cartSlot: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -CART_LIFT,
  },
  cartLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 4,
  },
  cartBtn: {
    width: CART_BTN_SIZE,
    height: CART_BTN_SIZE,
    borderRadius: CART_BTN_SIZE / 2,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  cartBtnActive: {
    elevation: 16,
    shadowOpacity: 0.35,
  },
  cartBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CART_BTN_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF8F9',
  },
  cartBadgeActive: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
  },
  cartBadgeText: {
    ...typography.overline,
    fontSize: 10,
    color: colors.white,
    fontWeight: '800',
  },
  cartBadgeTextActive: {
    color: colors.primary,
  },
});
