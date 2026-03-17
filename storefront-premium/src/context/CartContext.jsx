import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { cartAPI } from '../services/api'

const CART_KEY = 'rybella_guest_cart'
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const loadCart = async () => {
    if (!user) {
      try {
        const stored = localStorage.getItem(CART_KEY)
        setItems(stored ? JSON.parse(stored) : [])
      } catch {
        setItems([])
      }
      return
    }
    setLoading(true)
    try {
      const { data } = await cartAPI.get()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [user])

  const saveGuestCart = (newItems) => {
    localStorage.setItem(CART_KEY, JSON.stringify(newItems))
    setItems(newItems)
  }

  const addItem = async (variantId, quantity = 1, guestData) => {
    if (!user) {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
      const exists = stored.find((i) => i.variant_id === variantId)
      const newItem = { variant_id: variantId, quantity, ...(guestData || {}) }
      const next = exists
        ? stored.map((i) => (i.variant_id === variantId ? { ...i, quantity: (i.quantity || 0) + quantity } : i))
        : [...stored, newItem]
      saveGuestCart(next)
      return
    }
    try {
      await cartAPI.add({ variant_id: variantId, quantity })
      loadCart()
    } catch (e) {
      throw e
    }
  }

  const updateItem = async (itemId, quantity) => {
    if (!user) {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
      const next = stored
        .map((i) => (String(i.variant_id) === String(itemId) ? { ...i, quantity } : i))
        .filter((i) => (i.quantity || 0) > 0)
      saveGuestCart(next)
      return
    }
    await cartAPI.update(itemId, { quantity })
    loadCart()
  }

  const removeItem = async (itemId) => {
    if (!user) {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
      saveGuestCart(stored.filter((i) => String(i.variant_id) !== String(itemId) && String(i.id) !== String(itemId)))
      return
    }
    await cartAPI.remove(itemId)
    loadCart()
  }

  const mergeGuestCart = async () => {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    if (stored.length === 0) return
    for (const i of stored) {
      try {
        await cartAPI.add({ variant_id: i.variant_id, quantity: i.quantity || 1 })
      } catch {}
    }
    localStorage.removeItem(CART_KEY)
    loadCart()
  }

  const totalCount = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)

  return (
    <CartContext.Provider value={{ items, loading, addItem, updateItem, removeItem, loadCart, mergeGuestCart, totalCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
