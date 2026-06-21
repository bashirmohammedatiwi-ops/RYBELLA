import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { cartAPI } from '../services/api'

const CART_KEY = 'rybella_guest_cart'
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

  const loadCart = useCallback(async () => {
    if (!user) {
      setLoading(false)
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      setItems(guest.items)
      setBundles(guest.bundles)
      return
    }
    setLoading(true)
    try {
      const { data } = await cartAPI.get()
      if (Array.isArray(data)) {
        setItems(data)
        setBundles([])
      } else {
        setItems(data?.items || [])
        setBundles(data?.bundles || [])
      }
    } catch {
      setItems([])
      setBundles([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
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

  const resolveServerItemId = useCallback((itemId, list = items) => {
    const match = list.find((i) => matchesCartItem(i, itemId))
    return match?.id ?? itemId
  }, [items])

  const addItem = async (variantId, quantity = 1, guestData) => {
    if (!user) {
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      const exists = guest.items.find((i) => String(i.variant_id) === String(variantId))
      const newItem = { variant_id: variantId, quantity, ...(guestData || {}) }
      const nextItems = exists
        ? guest.items.map((i) => (String(i.variant_id) === String(variantId)
          ? { ...i, quantity: (i.quantity || 0) + quantity }
          : i))
        : [...guest.items, newItem]
      persistGuest(nextItems, guest.bundles)
      return
    }
    await cartAPI.add({ variant_id: variantId, quantity })
    await loadCart()
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
    await loadCart()
  }

  const updateItem = async (itemId, quantity) => {
    if (!user) {
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      const nextItems = guest.items
        .map((i) => (matchesCartItem(i, itemId) ? { ...i, quantity } : i))
        .filter((i) => (i.quantity || 0) > 0)
      persistGuest(nextItems, guest.bundles)
      return
    }

    const serverId = resolveServerItemId(itemId)
    const previous = items
    setItems((prev) => prev.map((i) => (matchesCartItem(i, itemId) ? { ...i, quantity } : i)))
    try {
      await cartAPI.update(serverId, { quantity })
    } catch {
      setItems(previous)
      await loadCart()
    }
  }

  const updateBundle = async (bundleId, quantity) => {
    if (!user) {
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      const nextBundles = guest.bundles
        .map((b) => (matchesBundle(b, bundleId)
          ? { ...b, quantity, total_price: (b.unit_price || 0) * quantity }
          : b))
        .filter((b) => (b.quantity || 0) > 0)
      persistGuest(guest.items, nextBundles)
      return
    }

    const previous = bundles
    setBundles((prev) => prev.map((b) => (matchesBundle(b, bundleId)
      ? { ...b, quantity, total_price: (b.unit_price || 0) * quantity }
      : b)))
    try {
      await cartAPI.updateBundle(bundleId, { quantity })
      await loadCart()
    } catch {
      setBundles(previous)
      await loadCart()
    }
  }

  const removeItem = async (itemId) => {
    if (!user) {
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      persistGuest(guest.items.filter((i) => !matchesCartItem(i, itemId)), guest.bundles)
      return
    }

    const serverId = resolveServerItemId(itemId)
    const previous = items
    setItems((prev) => prev.filter((i) => !matchesCartItem(i, itemId)))
    try {
      await cartAPI.remove(serverId)
    } catch {
      setItems(previous)
      await loadCart()
    }
  }

  const removeBundle = async (bundleId) => {
    if (!user) {
      const guest = parseGuestCart(localStorage.getItem(CART_KEY))
      persistGuest(guest.items, guest.bundles.filter((b) => !matchesBundle(b, bundleId)))
      return
    }

    const previous = bundles
    setBundles((prev) => prev.filter((b) => !matchesBundle(b, bundleId)))
    try {
      await cartAPI.removeBundle(bundleId)
    } catch {
      setBundles(previous)
      await loadCart()
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
