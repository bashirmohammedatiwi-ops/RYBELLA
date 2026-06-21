import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext'
import { cartAPI } from '../services/api'
import { roundDisplayPrice } from '../utils/pricing'

const CART_KEY = 'rybella_guest_cart'
const SERVER_SYNC_MS = 500
const CartContext = createContext(null)

function parseGuestCart(raw) {
  if (!raw) return { items: [], bundles: [] }
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { items: parsed, bundles: [] }
    return { items: parsed.items || [], bundles: parsed.bundles || [] }
  } catch {
    return { items: [], bundles: [] }
  }
}

function saveGuestCart(items, bundles) {
  localStorage.setItem(CART_KEY, JSON.stringify({ items, bundles }))
}

function matchesCartItem(item, itemId) {
  return String(item.id) === String(itemId) || String(item.variant_id) === String(itemId)
}

function matchesBundle(bundle, bundleId) {
  return String(bundle.id) === String(bundleId)
    || String(bundle.bundle_key) === String(bundleId)
    || String(bundle.offer_id) === String(bundleId)
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return { items: action.items, bundles: action.bundles }

    case 'SET_ITEM_QTY':
      return {
        ...state,
        items: state.items
          .map((item) => (
            matchesCartItem(item, action.itemId)
              ? { ...item, quantity: action.quantity }
              : item
          ))
          .filter((item) => (item.quantity || 0) > 0),
      }

    case 'SET_BUNDLE_QTY':
      return {
        ...state,
        bundles: state.bundles
          .map((bundle) => (
            matchesBundle(bundle, action.bundleId)
              ? {
                ...bundle,
                quantity: action.quantity,
                total_price: (bundle.unit_price || 0) * action.quantity,
              }
              : bundle
          ))
          .filter((bundle) => (bundle.quantity || 0) > 0),
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => !matchesCartItem(item, action.itemId)),
      }

    case 'REMOVE_BUNDLE':
      return {
        ...state,
        bundles: state.bundles.filter((bundle) => !matchesBundle(bundle, action.bundleId)),
      }

    default:
      return state
  }
}

function normalizeServerCart(data) {
  if (Array.isArray(data)) {
    return { items: data, bundles: [] }
  }
  return {
    items: data?.items || [],
    bundles: data?.bundles || [],
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [{ items, bundles }, dispatch] = useReducer(cartReducer, { items: [], bundles: [] })
  const [loading, setLoading] = useState(false)

  const itemsRef = useRef(items)
  const bundlesRef = useRef(bundles)
  const itemSyncRef = useRef(new Map())
  const bundleSyncRef = useRef(new Map())
  const syncTimerRef = useRef(null)
  const syncRunningRef = useRef(false)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    bundlesRef.current = bundles
  }, [bundles])

  useEffect(() => () => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
  }, [])

  const findItem = useCallback((itemId) => (
    itemsRef.current.find((item) => matchesCartItem(item, itemId))
  ), [])

  const findBundle = useCallback((bundleId) => (
    bundlesRef.current.find((bundle) => matchesBundle(bundle, bundleId))
  ), [])

  const mergeServerCart = useCallback((serverItems, serverBundles) => {
    const mergedItems = serverItems.map((item) => {
      const pending = item.id != null ? itemSyncRef.current.get(String(item.id)) : undefined
      return pending == null ? item : { ...item, quantity: pending }
    })

    const mergedBundles = serverBundles.map((bundle) => {
      const pending = bundle.id != null ? bundleSyncRef.current.get(String(bundle.id)) : undefined
      if (pending == null) return bundle
      return {
        ...bundle,
        quantity: pending,
        total_price: (bundle.unit_price || 0) * pending,
      }
    })

    dispatch({ type: 'SET_CART', items: mergedItems, bundles: mergedBundles })
  }, [])

  const fetchServerCart = useCallback(async () => {
    const { data } = await cartAPI.get()
    const { items: serverItems, bundles: serverBundles } = normalizeServerCart(data)
    mergeServerCart(serverItems, serverBundles)
  }, [mergeServerCart])

  const loadGuestCart = useCallback(() => {
    const guest = parseGuestCart(localStorage.getItem(CART_KEY))
    dispatch({ type: 'SET_CART', items: guest.items, bundles: guest.bundles })
    setLoading(false)
  }, [])

  const flushServerSync = useCallback(async () => {
    if (!user || syncRunningRef.current) return
    if (!itemSyncRef.current.size && !bundleSyncRef.current.size) return

    syncRunningRef.current = true
    try {
      const itemJobs = [...itemSyncRef.current.entries()]
      for (const [serverItemId, quantity] of itemJobs) {
        if (itemSyncRef.current.get(serverItemId) !== quantity) continue
        await cartAPI.update(serverItemId, { quantity })
        if (itemSyncRef.current.get(serverItemId) === quantity) {
          itemSyncRef.current.delete(serverItemId)
        }
      }

      const bundleJobs = [...bundleSyncRef.current.entries()]
      for (const [serverBundleId, quantity] of bundleJobs) {
        if (bundleSyncRef.current.get(serverBundleId) !== quantity) continue
        await cartAPI.updateBundle(serverBundleId, { quantity })
        if (bundleSyncRef.current.get(serverBundleId) === quantity) {
          bundleSyncRef.current.delete(serverBundleId)
        }
      }
    } catch {
      itemSyncRef.current.clear()
      bundleSyncRef.current.clear()
      await fetchServerCart()
    } finally {
      syncRunningRef.current = false
      if (itemSyncRef.current.size || bundleSyncRef.current.size) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
        syncTimerRef.current = setTimeout(() => {
          flushServerSync()
        }, SERVER_SYNC_MS)
      }
    }
  }, [user, fetchServerCart])

  const queueServerSync = useCallback(() => {
    if (!user) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      flushServerSync()
    }, SERVER_SYNC_MS)
  }, [user, flushServerSync])

  useEffect(() => {
    itemSyncRef.current.clear()
    bundleSyncRef.current.clear()
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
      syncTimerRef.current = null
    }

    if (!user) {
      loadGuestCart()
      return
    }

    setLoading(true)
    fetchServerCart()
      .catch(() => dispatch({ type: 'SET_CART', items: [], bundles: [] }))
      .finally(() => setLoading(false))
  }, [user?.id, loadGuestCart, fetchServerCart])

  const adjustItemQuantity = useCallback((itemId, delta) => {
    const item = findItem(itemId)
    if (!item) return

    const nextQty = Math.max(1, (Number(item.quantity) || 1) + delta)

    if (!user) {
      const nextItems = itemsRef.current
        .map((row) => (matchesCartItem(row, itemId) ? { ...row, quantity: nextQty } : row))
        .filter((row) => (row.quantity || 0) > 0)
      saveGuestCart(nextItems, bundlesRef.current)
      dispatch({ type: 'SET_ITEM_QTY', itemId, quantity: nextQty })
      return
    }

    if (item.id != null) {
      itemSyncRef.current.set(String(item.id), nextQty)
    }
    dispatch({ type: 'SET_ITEM_QTY', itemId, quantity: nextQty })
    queueServerSync()
  }, [findItem, user, queueServerSync])

  const adjustBundleQuantity = useCallback((bundleId, delta) => {
    const bundle = findBundle(bundleId)
    if (!bundle) return

    const nextQty = Math.max(1, (Number(bundle.quantity) || 1) + delta)

    if (!user) {
      const nextBundles = bundlesRef.current
        .map((row) => (
          matchesBundle(row, bundleId)
            ? { ...row, quantity: nextQty, total_price: (row.unit_price || 0) * nextQty }
            : row
        ))
        .filter((row) => (row.quantity || 0) > 0)
      saveGuestCart(itemsRef.current, nextBundles)
      dispatch({ type: 'SET_BUNDLE_QTY', bundleId, quantity: nextQty })
      return
    }

    if (bundle.id != null) {
      bundleSyncRef.current.set(String(bundle.id), nextQty)
    }
    dispatch({ type: 'SET_BUNDLE_QTY', bundleId, quantity: nextQty })
    queueServerSync()
  }, [findBundle, user, queueServerSync])

  const addItem = async (variantId, quantity = 1, guestData) => {
    if (!user) {
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      const exists = guest.items.find((i) => String(i.variant_id) === String(variantId))
      const roundedGuest = guestData
        ? {
          ...guestData,
          price: guestData.price != null
            ? (roundDisplayPrice(guestData.price) ?? guestData.price)
            : guestData.price,
        }
        : {}
      const newItem = { variant_id: variantId, quantity, ...roundedGuest }
      const nextItems = exists
        ? guest.items.map((i) => (
          String(i.variant_id) === String(variantId)
            ? { ...i, quantity: (i.quantity || 0) + quantity }
            : i
        ))
        : [...guest.items, newItem]
      saveGuestCart(nextItems, guest.bundles)
      dispatch({ type: 'SET_CART', items: nextItems, bundles: guest.bundles })
      return
    }

    await cartAPI.add({ variant_id: variantId, quantity })
    await fetchServerCart()
  }

  const addBundle = async (bundlePayload) => {
    const {
      offer_id,
      offer_title,
      offer_image,
      discount_percent = 0,
      discount_label,
      quantity = 1,
      lines,
      unit_price,
      subtotal,
    } = bundlePayload

    if (!user) {
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      const bundleKey = `offer_${offer_id}`
      const bundle = {
        type: 'bundle',
        bundle_key: bundleKey,
        offer_id,
        offer_title,
        offer_image,
        discount_percent,
        discount_label,
        quantity,
        lines,
        unit_price,
        subtotal,
        total_price: unit_price * quantity,
      }
      const without = guest.bundles.filter((b) => String(b.offer_id) !== String(offer_id))
      const nextBundles = [...without, bundle]
      saveGuestCart(guest.items, nextBundles)
      dispatch({ type: 'SET_CART', items: guest.items, bundles: nextBundles })
      return
    }

    await cartAPI.addBundle({
      offer_id,
      quantity,
      lines: lines.map((l) => ({ variant_id: l.variant_id, quantity: 1 })),
    })
    await fetchServerCart()
  }

  const removeItem = async (itemId) => {
    const item = findItem(itemId)
    if (item?.id != null) {
      itemSyncRef.current.delete(String(item.id))
    }

    if (!user) {
      const nextItems = itemsRef.current.filter((row) => !matchesCartItem(row, itemId))
      saveGuestCart(nextItems, bundlesRef.current)
      dispatch({ type: 'REMOVE_ITEM', itemId })
      return
    }

    dispatch({ type: 'REMOVE_ITEM', itemId })
    try {
      await cartAPI.remove(item.id ?? itemId)
    } catch {
      await fetchServerCart()
    }
  }

  const removeBundle = async (bundleId) => {
    const bundle = findBundle(bundleId)
    if (bundle?.id != null) {
      bundleSyncRef.current.delete(String(bundle.id))
    }

    if (!user) {
      const nextBundles = bundlesRef.current.filter((row) => !matchesBundle(row, bundleId))
      saveGuestCart(itemsRef.current, nextBundles)
      dispatch({ type: 'REMOVE_BUNDLE', bundleId })
      return
    }

    dispatch({ type: 'REMOVE_BUNDLE', bundleId })
    try {
      await cartAPI.removeBundle(bundle.id ?? bundleId)
    } catch {
      await fetchServerCart()
    }
  }

  const loadCart = useCallback(async () => {
    if (!user) {
      loadGuestCart()
      return
    }
    setLoading(true)
    try {
      await fetchServerCart()
    } finally {
      setLoading(false)
    }
  }, [user, loadGuestCart, fetchServerCart])

  const mergeGuestCart = async () => {
    if (!user) return
    const guest = parseGuestCart(localStorage.getItem(CART_KEY))
    if (!guest.items.length && !guest.bundles.length) {
      await loadCart()
      return
    }

    setLoading(true)
    for (const i of guest.items) {
      try {
        await cartAPI.add({ variant_id: i.variant_id, quantity: i.quantity || 1 })
      } catch { /* skip */ }
    }
    for (const b of guest.bundles) {
      try {
        await cartAPI.addBundle({
          offer_id: b.offer_id,
          quantity: b.quantity || 1,
          lines: (b.lines || []).map((l) => ({ variant_id: l.variant_id, quantity: 1 })),
        })
      } catch { /* skip */ }
    }
    localStorage.removeItem(CART_KEY)
    itemSyncRef.current.clear()
    bundleSyncRef.current.clear()
    await fetchServerCart()
    setLoading(false)
  }

  const totalCount = useMemo(() => (
    items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    + bundles.reduce((sum, bundle) => sum + (Number(bundle.quantity) || 0), 0)
  ), [items, bundles])

  return (
    <CartContext.Provider value={{
      items,
      bundles,
      loading,
      addItem,
      addBundle,
      adjustItemQuantity,
      adjustBundleQuantity,
      removeItem,
      removeBundle,
      loadCart,
      mergeGuestCart,
      totalCount,
    }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
