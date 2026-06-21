import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { cartAPI } from '../services/api'
import { roundDisplayPrice } from '../utils/pricing'

const CART_KEY = 'rybella_guest_cart'
const SYNC_DEBOUNCE_MS = 450
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

function itemPendingKeys(item) {
  const keys = []
  if (item?.id != null) keys.push(`item:${item.id}`)
  if (item?.variant_id != null) keys.push(`variant:${item.variant_id}`)
  return keys
}

function bundlePendingKeys(bundle) {
  const keys = []
  if (bundle?.id != null) keys.push(`bundle:${bundle.id}`)
  if (bundle?.offer_id != null) keys.push(`offer:${bundle.offer_id}`)
  if (bundle?.bundle_key) keys.push(`bundleKey:${bundle.bundle_key}`)
  return keys
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(false)

  const itemsRef = useRef(items)
  const bundlesRef = useRef(bundles)
  const pendingItemQtyRef = useRef(new Map())
  const pendingBundleQtyRef = useRef(new Map())
  const itemSyncTimersRef = useRef(new Map())
  const bundleSyncTimersRef = useRef(new Map())
  const loadCartSeqRef = useRef(0)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    bundlesRef.current = bundles
  }, [bundles])

  useEffect(() => () => {
    itemSyncTimersRef.current.forEach((timer) => clearTimeout(timer))
    bundleSyncTimersRef.current.forEach((timer) => clearTimeout(timer))
  }, [])

  const findItem = useCallback((itemId) => (
    itemsRef.current.find((i) => matchesCartItem(i, itemId))
  ), [])

  const findBundle = useCallback((bundleId) => (
    bundlesRef.current.find((b) => matchesBundle(b, bundleId))
  ), [])

  const setItemPending = useCallback((itemId, quantity) => {
    const item = findItem(itemId)
    const keys = item ? itemPendingKeys(item) : [`raw:${itemId}`]
    keys.forEach((key) => pendingItemQtyRef.current.set(key, quantity))
  }, [findItem])

  const clearItemPending = useCallback((itemId) => {
    const item = findItem(itemId)
    const keys = item ? itemPendingKeys(item) : [`raw:${itemId}`]
    keys.forEach((key) => pendingItemQtyRef.current.delete(key))
  }, [findItem])

  const getItemPendingQuantity = useCallback((item) => {
    for (const key of itemPendingKeys(item)) {
      if (pendingItemQtyRef.current.has(key)) {
        return pendingItemQtyRef.current.get(key)
      }
    }
    return null
  }, [])

  const setBundlePending = useCallback((bundleId, quantity) => {
    const bundle = findBundle(bundleId)
    const keys = bundle ? bundlePendingKeys(bundle) : [`rawBundle:${bundleId}`]
    keys.forEach((key) => pendingBundleQtyRef.current.set(key, quantity))
  }, [findBundle])

  const clearBundlePending = useCallback((bundleId) => {
    const bundle = findBundle(bundleId)
    const keys = bundle ? bundlePendingKeys(bundle) : [`rawBundle:${bundleId}`]
    keys.forEach((key) => pendingBundleQtyRef.current.delete(key))
  }, [findBundle])

  const getBundlePendingQuantity = useCallback((bundle) => {
    for (const key of bundlePendingKeys(bundle)) {
      if (pendingBundleQtyRef.current.has(key)) {
        return pendingBundleQtyRef.current.get(key)
      }
    }
    return null
  }, [])

  const applyPendingToItems = useCallback((serverItems) => {
    if (!pendingItemQtyRef.current.size) return serverItems
    return serverItems.map((item) => {
      const pendingQty = getItemPendingQuantity(item)
      return pendingQty == null ? item : { ...item, quantity: pendingQty }
    })
  }, [getItemPendingQuantity])

  const applyPendingToBundles = useCallback((serverBundles) => {
    if (!pendingBundleQtyRef.current.size) return serverBundles
    return serverBundles.map((bundle) => {
      const pendingQty = getBundlePendingQuantity(bundle)
      if (pendingQty == null) return bundle
      return {
        ...bundle,
        quantity: pendingQty,
        total_price: (bundle.unit_price || 0) * pendingQty,
      }
    })
  }, [getBundlePendingQuantity])

  const resolveServerItemId = useCallback((itemId) => {
    const match = findItem(itemId)
    return match?.id ?? itemId
  }, [findItem])

  const resolveServerBundleId = useCallback((bundleId) => {
    const match = findBundle(bundleId)
    return match?.id ?? bundleId
  }, [findBundle])

  const loadCart = useCallback(async ({ silent = false } = {}) => {
    if (!user) {
      setLoading(false)
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      setItems(guest.items)
      setBundles(guest.bundles)
      return
    }

    const seq = loadCartSeqRef.current + 1
    loadCartSeqRef.current = seq
    if (!silent) setLoading(true)

    try {
      const { data } = await cartAPI.get()
      if (seq !== loadCartSeqRef.current) return

      const serverItems = Array.isArray(data) ? data : (data?.items || [])
      const serverBundles = Array.isArray(data) ? [] : (data?.bundles || [])

      setItems(applyPendingToItems(serverItems))
      setBundles(applyPendingToBundles(serverBundles))
    } catch {
      if (seq !== loadCartSeqRef.current) return
      if (!pendingItemQtyRef.current.size) setItems([])
      if (!pendingBundleQtyRef.current.size) setBundles([])
    } finally {
      if (seq === loadCartSeqRef.current && !silent) setLoading(false)
    }
  }, [user, applyPendingToItems, applyPendingToBundles])

  useEffect(() => {
    pendingItemQtyRef.current.clear()
    pendingBundleQtyRef.current.clear()
    if (user) {
      setItems([])
      setBundles([])
      setLoading(true)
    }
    loadCart()
  }, [user, loadCart])

  const persistGuest = (nextItems, nextBundles) => {
    saveGuestCart(nextItems, nextBundles)
    setItems(nextItems)
    setBundles(nextBundles)
  }

  const scheduleItemSync = useCallback((itemId, quantity) => {
    setItemPending(itemId, quantity)
    const timerKey = String(resolveServerItemId(itemId))
    const timers = itemSyncTimersRef.current
    if (timers.has(timerKey)) clearTimeout(timers.get(timerKey))

    timers.set(timerKey, setTimeout(async () => {
      timers.delete(timerKey)
      const serverId = resolveServerItemId(itemId)
      try {
        await cartAPI.update(serverId, { quantity })
        clearItemPending(itemId)
      } catch {
        clearItemPending(itemId)
        await loadCart({ silent: true })
      }
    }, SYNC_DEBOUNCE_MS))
  }, [clearItemPending, loadCart, resolveServerItemId, setItemPending])

  const scheduleBundleSync = useCallback((bundleId, quantity) => {
    setBundlePending(bundleId, quantity)
    const timerKey = String(resolveServerBundleId(bundleId))
    const timers = bundleSyncTimersRef.current
    if (timers.has(timerKey)) clearTimeout(timers.get(timerKey))

    timers.set(timerKey, setTimeout(async () => {
      timers.delete(timerKey)
      const serverId = resolveServerBundleId(bundleId)
      try {
        await cartAPI.updateBundle(serverId, { quantity })
        clearBundlePending(bundleId)
      } catch {
        clearBundlePending(bundleId)
        await loadCart({ silent: true })
      }
    }, SYNC_DEBOUNCE_MS))
  }, [clearBundlePending, loadCart, resolveServerBundleId, setBundlePending])

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
        ? guest.items.map((i) => (String(i.variant_id) === String(variantId)
          ? { ...i, quantity: (i.quantity || 0) + quantity }
          : i))
        : [...guest.items, newItem]
      persistGuest(nextItems, guest.bundles)
      return
    }
    await cartAPI.add({ variant_id: variantId, quantity })
    await loadCart({ silent: true })
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
      persistGuest(guest.items, [...without, bundle])
      return
    }
    await cartAPI.addBundle({
      offer_id,
      quantity,
      lines: lines.map((l) => ({ variant_id: l.variant_id, quantity: 1 })),
    })
    await loadCart({ silent: true })
  }

  const updateItem = (itemId, quantity) => {
    if (!user) {
      setItems((prevItems) => {
        const nextItems = prevItems
          .map((i) => (matchesCartItem(i, itemId) ? { ...i, quantity } : i))
          .filter((i) => (i.quantity || 0) > 0)
        saveGuestCart(nextItems, bundlesRef.current)
        return nextItems
      })
      return
    }

    setItemPending(itemId, quantity)
    setItems((prev) => prev.map((i) => (matchesCartItem(i, itemId) ? { ...i, quantity } : i)))
    scheduleItemSync(itemId, quantity)
  }

  const updateBundle = (bundleId, quantity) => {
    if (!user) {
      setBundles((prevBundles) => {
        const nextBundles = prevBundles
          .map((b) => (matchesBundle(b, bundleId)
            ? { ...b, quantity, total_price: (b.unit_price || 0) * quantity }
            : b))
          .filter((b) => (b.quantity || 0) > 0)
        saveGuestCart(itemsRef.current, nextBundles)
        return nextBundles
      })
      return
    }

    setBundlePending(bundleId, quantity)
    setBundles((prev) => prev.map((b) => (matchesBundle(b, bundleId)
      ? { ...b, quantity, total_price: (b.unit_price || 0) * quantity }
      : b)))
    scheduleBundleSync(bundleId, quantity)
  }

  const removeItem = async (itemId) => {
    const timerKey = String(resolveServerItemId(itemId))
    if (itemSyncTimersRef.current.has(timerKey)) {
      clearTimeout(itemSyncTimersRef.current.get(timerKey))
      itemSyncTimersRef.current.delete(timerKey)
    }
    clearItemPending(itemId)

    if (!user) {
      setItems((prevItems) => {
        const nextItems = prevItems.filter((i) => !matchesCartItem(i, itemId))
        saveGuestCart(nextItems, bundlesRef.current)
        return nextItems
      })
      return
    }

    const serverId = resolveServerItemId(itemId)
    const previous = itemsRef.current
    setItems((prev) => prev.filter((i) => !matchesCartItem(i, itemId)))
    try {
      await cartAPI.remove(serverId)
    } catch {
      setItems(previous)
      await loadCart({ silent: true })
    }
  }

  const removeBundle = async (bundleId) => {
    const timerKey = String(resolveServerBundleId(bundleId))
    if (bundleSyncTimersRef.current.has(timerKey)) {
      clearTimeout(bundleSyncTimersRef.current.get(timerKey))
      bundleSyncTimersRef.current.delete(timerKey)
    }
    clearBundlePending(bundleId)

    if (!user) {
      setBundles((prevBundles) => {
        const nextBundles = prevBundles.filter((b) => !matchesBundle(b, bundleId))
        saveGuestCart(itemsRef.current, nextBundles)
        return nextBundles
      })
      return
    }

    const previous = bundlesRef.current
    setBundles((prev) => prev.filter((b) => !matchesBundle(b, bundleId)))
    try {
      await cartAPI.removeBundle(resolveServerBundleId(bundleId))
    } catch {
      setBundles(previous)
      await loadCart({ silent: true })
    }
  }

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
    pendingItemQtyRef.current.clear()
    pendingBundleQtyRef.current.clear()
    await loadCart()
  }

  const itemCount = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    + bundles.reduce((s, b) => s + (Number(b.quantity) || 0), 0)
  const totalCount = itemCount

  return (
    <CartContext.Provider value={{
      items,
      bundles,
      loading,
      addItem,
      addBundle,
      updateItem,
      updateBundle,
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
