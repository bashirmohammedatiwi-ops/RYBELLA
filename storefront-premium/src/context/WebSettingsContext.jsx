import { createContext, useContext, useEffect, useState } from 'react'
import { webSettingsAPI } from '../services/api'

const WebSettingsContext = createContext(null)

export function WebSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    webSettingsAPI.get()
      .then((r) => setSettings(r?.data || null))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WebSettingsContext.Provider value={{ settings, loading, setSettings }}>
      {children}
    </WebSettingsContext.Provider>
  )
}

export function useWebSettings() {
  const ctx = useContext(WebSettingsContext)
  if (!ctx) throw new Error('useWebSettings must be used within WebSettingsProvider')
  return ctx
}
