import { useState, useEffect } from 'react'
import { useWebSettings } from '../context/WebSettingsContext'
import BottomNav from './BottomNav'
import LayoutExtras from './LayoutExtras'
import ScrollToTop from './ScrollToTop'
import './Layout.css'

export default function Layout({ children }) {
  const { settings } = useWebSettings()

  const showBottomNav = !settings || settings.show_bottom_nav !== '0'
  const showAnnouncement = settings?.announcement_bar_enabled === '1' && settings?.announcement_bar

  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', showBottomNav)
    return () => document.body.classList.remove('has-bottom-nav')
  }, [showBottomNav])

  return (
    <div className="app-layout">
      <ScrollToTop />
      {showAnnouncement && (
        <div className="app-announcement">
          <span>{settings.announcement_bar}</span>
        </div>
      )}
      <main className="app-main">
        {children}
      </main>
      {showBottomNav && <BottomNav />}
      <LayoutExtras settings={settings} />
    </div>
  )
}
