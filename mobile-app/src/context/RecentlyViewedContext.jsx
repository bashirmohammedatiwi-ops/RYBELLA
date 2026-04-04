import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productsAPI } from '../services/api';

const RECENTLY_VIEWED_KEY = 'rybella_recently_viewed';
const MAX_RECENT = 12;

const RecentlyViewedContext = createContext(null);

export function RecentlyViewedProvider({ children }) {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStored = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      const ids = stored ? JSON.parse(stored) : [];
      setItems(ids);
      return ids;
    } catch {
      return [];
    }
  }, []);

  const addProduct = useCallback(async (productId) => {
    const id = parseInt(productId, 10);
    if (!id) return;
    try {
      let ids = await loadStored();
      ids = [id, ...ids.filter((x) => x !== id)].slice(0, MAX_RECENT);
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
      setItems(ids);
    } catch (_) {}
  }, [loadStored]);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      return;
    }
    setLoading(true);
    Promise.all(
      items.slice(0, 8).map((id) =>
        productsAPI.getById(id).then((r) => r.data).catch(() => null)
      )
    ).then((all) => {
      setProducts(all.filter(Boolean));
    }).finally(() => setLoading(false));
  }, [items]);

  const refresh = useCallback(async () => {
    await loadStored();
  }, [loadStored]);

  return (
    <RecentlyViewedContext.Provider value={{ products, loading, addProduct, refresh }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  return ctx || { products: [], loading: false, addProduct: () => {}, refresh: () => {} };
}
