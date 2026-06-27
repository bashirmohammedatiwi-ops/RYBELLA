import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notificationsAPI } from '../services/api'
import { formatDate } from '../utils/format'
import MobileHeader from '../components/MobileHeader'
import './Notifications.css'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = () => {
    setLoading(true)
    notificationsAPI.getMine()
      .then((r) => setItems(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const unreadCount = items.filter((n) => !n.is_read && !n.read_at).length

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setItems((prev) => prev.map((n) => (
        n.id === id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n
      )))
    } catch {
      /* ignore */
    }
  }

  const markAllRead = async () => {
    if (!unreadCount) return
    setMarkingAll(true)
    try {
      await notificationsAPI.markAllRead()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: 1, read_at: n.read_at || new Date().toISOString() })))
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="premium-notifications premium-notifications-loading">
        <MobileHeader title="الإشعارات" showBack showCart={false} />
        <div className="premium-notifications-loading-inner">
          <div className="premium-notifications-spinner" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-notifications">
      <MobileHeader title="الإشعارات" showBack showCart={false} />
      <div className="premium-notifications-body">
        <div className="premium-notifications-head">
          <h1 className="premium-notifications-title">الإشعارات</h1>
          {unreadCount > 0 && (
            <button
              type="button"
              className="premium-notifications-mark-all"
              onClick={markAllRead}
              disabled={markingAll}
            >
              {markingAll ? '...' : 'تعليم الكل كمقروء'}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="premium-notifications-empty">
            <div className="premium-notifications-empty-icon" aria-hidden="true">🔔</div>
            <p>لا توجد إشعارات بعد.</p>
            <Link to="/explore" className="premium-notifications-shop-btn">تسوق الآن</Link>
          </div>
        ) : (
          <div className="premium-notifications-list">
            {items.map((n) => {
              const isUnread = !n.is_read && !n.read_at
              return (
                <article
                  key={n.id}
                  className={`premium-notification-card${isUnread ? ' is-unread' : ''}`}
                  onClick={() => isUnread && markRead(n.id)}
                  onKeyDown={(e) => {
                    if (isUnread && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      markRead(n.id)
                    }
                  }}
                  role={isUnread ? 'button' : undefined}
                  tabIndex={isUnread ? 0 : undefined}
                >
                  <div className="premium-notification-top">
                    <h2 className="premium-notification-title">{n.title}</h2>
                    {isUnread && <span className="premium-notification-dot" aria-label="غير مقروء" />}
                  </div>
                  <p className="premium-notification-message">{n.message}</p>
                  <time className="premium-notification-date" dateTime={n.created_at}>
                    {formatDate(n.created_at)}
                  </time>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
