import { useLocation } from 'react-router-dom'
import { webSettingsAPI } from '../services/api'
import { useState, useEffect } from 'react'
import BottomNav from './BottomNav'
import BackToTop from './BackToTop'
import FloatingContact from './FloatingContact'
import './Layout.css'

export default function Layout({ children }) {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    webSettingsAPI.get().then((r) => r?.data && setSettings(r.data)).catch(() => {})
  }, [])

  const showAnnouncement = settings?.announcement_bar_enabled === '1' && settings?.announcement_bar

  return (
    <div className="app-layout">
      {showAnnouncement && (
        <div className="app-announcement">
          <span>{settings.announcement_bar}</span>
        </div>
      )}
      <main className="app-main">
        {children}
      </main>
      {settings?.show_bottom_nav !== '0' && <BottomNav />}
      {settings?.show_back_to_top !== '0' && <BackToTop />}
      {settings?.show_contact_float !== '0' && <FloatingContact whatsappNumber={settings?.whatsapp_number} />}
    </div>
  )
}
