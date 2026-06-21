import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { cartAPI } from '../services/api'
import { roundDisplayPrice } from '../utils/pricing'

const CART_KEY = 'rybella_guest_cart'
const SYNC_DEBOUNCE_MS = 400
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

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(false)

  const itemsRef = useRef(items)
  const bundlesRef = useRef(bundles)
  const localRevisionRef = useRef(0)
  const itemSyncTimersRef = useRef(new Map())
  const bundleSyncTimersRef = useRef(new Map())

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

  const bumpLocalRevision = () => {
    localRevisionRef.current += 1
  }

  const resolveServerItemId = useCallback((itemId) => {
    const match = itemsRef.current.find((i) => matchesCartItem(i, itemId))
    return match?.id ?? itemId
  }, [])

  const loadCart = useCallback(async ({ silent = false, force = false } = {}) => {
    if (!user) {
      setLoading(false)
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      setItems(guest.items)
      setBundles(guest.bundles)
      return
    }

    const revisionAtStart = localRevisionRef.current
    if (!silent) setLoading(true)

    try {
      const { data } = await cartAPI.get()
      if (!force && revisionAtStart !== localRevisionRef.current) return

      if (Array.isArray(data)) {
        setItems(data)
        setBundles([])
      } else {
        setItems(data?.items || [])
        setBundles(data?.bundles || [])
      }
    } catch {
      if (!force && revisionAtStart !== localRevisionRef.current) return
      setItems([])
      setBundles([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      localRevisionRef.current = 0
      setItems([])
      setBundles([])
      setLoading(true)
    }
    loadCart()
  }, [user, loadCart])

  const persistGuest = (nextItems, nextBundles) => {
    saveGuestCart(nextItems, nextBundles)
    bumpLocalRevision()
    setItems(nextItems)
    setBundles(nextBundles)
  }

  const scheduleItemSync = useCallback((itemId, quantity) => {
    const key = String(itemId)
    const timers = itemSyncTimersRef.current
    if (timers.has(key)) clearTimeout(timers.get(key))

    timers.set(key, setTimeout(async () => {
      timers.delete(key)
      const serverId = resolveServerItemId(itemId)
      try {
        await cartAPI.update(serverId, { quantity })
      } catch {
        await loadCart({ silent: true, force: true })
      }
    }, SYNC_DEBOUNCE_MS))
  }, [loadCart, resolveServerItemId])

  const scheduleBundleSync = useCallback((bundleId, quantity) => {
    const key = String(bundleId)
    const timers = bundleSyncTimersRef.current
    if (timers.has(key)) clearTimeout(timers.get(key))

    timers.set(key, setTimeout(async () => {
      timers.delete(key)
      try {
        await cartAPI.updateBundle(bundleId, { quantity })
      } catch {
        await loadCart({ silent: true, force: true })
      }
    }, SYNC_DEBOUNCE_MS))
  }, [loadCart])

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
    bumpLocalRevision()
    await cartAPI.add({ variant_id: variantId, quantity })
    await loadCart({ force: true })
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
    bumpLocalRevision()
    await cartAPI.addBundle({
      offer_id,
      quantity,
      lines: lines.map((l) => ({ variant_id: l.variant_id, quantity: 1 })),
    })
    await loadCart({ force: true })
  }

  const updateItem = (itemId, quantity) => {
    bumpLocalRevision()

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

    setItems((prev) => prev.map((i) => (matchesCartItem(i, itemId) ? { ...i, quantity } : i)))
    scheduleItemSync(itemId, quantity)
  }

  const updateBundle = (bundleId, quantity) => {
    bumpLocalRevision()

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

    setBundles((prev) => prev.map((b) => (matchesBundle(b, bundleId)
      ? { ...b, quantity, total_price: (b.unit_price || 0) * quantity }
      : b)))
    scheduleBundleSync(bundleId, quantity)
  }

  const removeItem = async (itemId) => {
    const key = String(itemId)
    if (itemSyncTimersRef.current.has(key)) {
      clearTimeout(itemSyncTimersRef.current.get(key))
      itemSyncTimersRef.current.delete(key)
    }

    bumpLocalRevision()

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
      await loadCart({ silent: true, force: true })
    }
  }

  const removeBundle = async (bundleId) => {
    const key = String(bundleId)
    if (bundleSyncTimersRef.current.has(key)) {
      clearTimeout(bundleSyncTimersRef.current.get(key))
      bundleSyncTimersRef.current.delete(key)
    }

    bumpLocalRevision()

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
      await cartAPI.removeBundle(bundleId)
    } catch {
      setBundles(previous)
      await loadCart({ silent: true, force: true })
    }
  }

  const mergeGuestCart = async () => {
    if (!user) return
    const guest = parseGuestCart(localStorage.getItem(CART_KEY))
    if (!guest.items.length && !guest.bundles.length) {
      await loadCart({ force: true })
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
    localRevisionRef.current = 0
    await loadCart({ force: true })
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
