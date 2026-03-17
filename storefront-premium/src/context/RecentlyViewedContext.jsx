import { createContext, useContext, useState, useCallback } from "react"
const STORAGE_KEY = "rybella_recently_viewed"
const MAX_ITEMS = 12
const loadIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw).slice(0, MAX_ITEMS) : []
  } catch { return [] }
}
const RecentlyViewedContext = createContext(null)
export function RecentlyViewedProvider({ children }) {
  const [recentIds, setRecentIds] = useState(loadIds)
  const addProduct = useCallback((productId) => {
    setRecentIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])
  return (
    <RecentlyViewedContext.Provider value={{ recentIds, addProduct }}>
      {children}
    </RecentlyViewedContext.Provider>
  )
}
export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext)
  return ctx || { recentIds: [], addProduct: () => {} }
}
