import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';

const GUEST_CART_KEY = 'rybella_guest_cart';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    if (!user) {
      try {
        const stored = await AsyncStorage.getItem(GUEST_CART_KEY);
        setItems(stored ? JSON.parse(stored) : []);
      } catch {
        setItems([]);
      }
      return;
    }
    setLoading(true);
    try {
      const { data } = await cartAPI.get();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  const saveGuestCart = async (newItems) => {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(newItems));
    setItems(newItems);
  };

  const addItem = async (variantId, quantity = 1, guestItemData = null) => {
    if (!user) {
      const stored = JSON.parse((await AsyncStorage.getItem(GUEST_CART_KEY)) || '[]');
      const existing = stored.find((i) => i.variant_id === variantId);
      const newItem = guestItemData
        ? { variant_id: variantId, quantity, ...guestItemData }
        : { variant_id: variantId, quantity };
      const next = existing
        ? stored.map((i) =>
            i.variant_id === variantId ? { ...i, quantity: (i.quantity || 0) + quantity } : i
          )
        : [...stored, newItem];
      await saveGuestCart(next);
      return;
    }
    try {
      await cartAPI.addItem(variantId, quantity);
      loadCart();
    } catch (e) {
      throw e;
    }
  };

  const updateItem = async (itemId, quantity) => {
    if (!user) {
      const stored = JSON.parse((await AsyncStorage.getItem(GUEST_CART_KEY)) || '[]');
      const next = stored
        .map((i) => (String(i.variant_id) === String(itemId) ? { ...i, quantity } : i))
        .filter((i) => (i.quantity || 0) > 0);
      await saveGuestCart(next);
      return;
    }
    await cartAPI.updateItem(itemId, { quantity });
    loadCart();
  };

  const removeItem = async (itemId) => {
    if (!user) {
      const stored = JSON.parse((await AsyncStorage.getItem(GUEST_CART_KEY)) || '[]');
      const next = stored.filter((i) => String(i.variant_id) !== String(itemId) && String(i.id) !== String(itemId));
      await saveGuestCart(next);
      return;
    }
    await cartAPI.removeItem(itemId);
    loadCart();
  };

  const mergeGuestCart = async () => {
    const stored = JSON.parse((await AsyncStorage.getItem(GUEST_CART_KEY)) || '[]');
    if (stored.length === 0) return;
    for (const i of stored) {
      try {
        await cartAPI.addItem(i.variant_id, i.quantity || 1);
      } catch (_) {}
    }
    await AsyncStorage.removeItem(GUEST_CART_KEY);
    loadCart();
  };

  const totalCount = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  return (
    <CartContext.Provider value={{ items, loading, addItem, updateItem, removeItem, loadCart, mergeGuestCart, totalCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
