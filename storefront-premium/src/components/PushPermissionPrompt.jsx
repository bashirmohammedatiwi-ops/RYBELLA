import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getPushPermission,
  isPushSupported,
  isPushFullyEnabled,
  registerServiceWorker,
  activatePushNotifications,
  ensurePushNotifications,
  PUSH_UPDATED_EVENT,
} from '../utils/pushNotifications'
import { PUSH_PERMISSION_COPY as copy } from '../constants/pushCopy'
import './PushPermissionPrompt.css'

function usePushStatus() {
  const [permission, setPermission] = useState(getPushPermission())
  const [enabled, setEnabled] = useState(isPushFullyEnabled())

  const refresh = useCallback(() => {
    setPermission(getPushPermission())
    setEnabled(isPushFullyEnabled())
  }, [])

  useEffect(() => {
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener(PUSH_UPDATED_EVENT, onUpdate)
    window.addEventListener('focus', onUpdate)
    document.addEventListener('visibilitychange', onUpdate)
    return () => {
      window.removeEventListener(PUSH_UPDATED_EVENT, onUpdate)
      window.removeEventListener('focus', onUpdate)
      document.removeEventListener('visibilitychange', onUpdate)
    }
  }, [refresh])

  return { permission, enabled, refresh }
}

export default function PushPermissionPrompt() {
  const { user } = useAuth()
  const { permission, enabled, refresh } = usePushStatus()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (!user) {
      setVisible(false)
      return
    }

    if (!isPushSupported()) {
      setVisible(false)
      return
    }

    if (enabled || permission === 'denied') {
      setVisible(false)
      return
    }

    if (permission === 'granted') {
      setLoading(true)
      ensurePushNotifications()
        .then((result) => {
          refresh()
          if (result.ok) {
            setVisible(false)
            sessionStorage.removeItem('push_prompt_dismissed')
          }
        })
        .finally(() => setLoading(false))
      return
    }

    const dismissed = sessionStorage.getItem('push_prompt_dismissed')
    setVisible(!dismissed)
  }, [user, permission, enabled, refresh])

  const handleEnable = async () => {
    setLoading(true)
    setMessage('')
    const result = await activatePushNotifications()
    refresh()
    setLoading(false)

    if (result.ok) {
      sessionStorage.removeItem('push_prompt_dismissed')
      setVisible(false)
      return
    }

    setMessage(result.message || 'تعذّر تفعيل الإشعارات')
    if (result.reason === 'denied') setVisible(false)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('push_prompt_dismissed', '1')
    setVisible(false)
  }

  if (!user || !visible) return null

  return (
    <div className="push-permission-prompt" role="dialog" aria-labelledby="push-prompt-title">
      <div className="push-permission-inner">
        <div className="push-permission-icon" aria-hidden="true">🔔</div>
        <div className="push-permission-text">
          <strong id="push-prompt-title">{copy.title}</strong>
          <p>{copy.body}</p>
          <p className="push-permission-highlight">{copy.highlight}</p>
          <p className="push-permission-reassurance">{copy.reassurance}</p>
          {loading && (
            <p className="push-permission-hint">اضغطي «سماح» في نافذة المتصفح لإكمال التفعيل...</p>
          )}
          {message && <p className="push-permission-msg">{message}</p>}
        </div>
        <div className="push-permission-actions">
          <button type="button" className="push-permission-enable" onClick={handleEnable} disabled={loading}>
            {loading ? 'جاري التفعيل...' : copy.accept}
          </button>
          <button type="button" className="push-permission-later" onClick={handleDismiss} disabled={loading}>
            {copy.later}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PushEnableButton({ className = '' }) {
  const { user } = useAuth()
  const { permission, enabled, refresh } = usePushStatus()
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!user || !isPushSupported() || permission !== 'granted' || enabled) return
    setLoading(true)
    ensurePushNotifications()
      .then(() => refresh())
      .finally(() => setLoading(false))
  }, [user, permission, enabled, refresh])

  if (!user || !isPushSupported()) return null

  if (enabled) {
    return <p className={`push-enable-status is-on ${className}`}>إشعارات الهاتف مفعّلة ✓</p>
  }

  if (permission === 'granted') {
    return (
      <p className={`push-enable-status is-on ${className}`}>
        {loading ? 'جاري إكمال التفعيل...' : 'تم منح الإذن — جاري تفعيل الإشعارات...'}
      </p>
    )
  }

  if (permission === 'denied') {
    return (
      <p className={`push-enable-status is-denied ${className}`}>
        الإشعارات مرفوضة — فعّليها من إعدادات المتصفح/الهاتف
      </p>
    )
  }

  const handleClick = async () => {
    setLoading(true)
    setFeedback('')
    const result = await activatePushNotifications()
    refresh()
    setLoading(false)
    if (result.ok) {
      setFeedback('')
      return
    }
    setFeedback(result.message || 'تعذّر التفعيل')
  }

  return (
    <div className={`push-enable-block ${className}`}>
      <p className="push-enable-teaser">{copy.enableShort}</p>
      <button type="button" className="push-enable-btn" onClick={handleClick} disabled={loading}>
        {loading ? 'جاري التفعيل...' : copy.accept}
      </button>
      {feedback && <p className="push-enable-feedback">{feedback}</p>}
    </div>
  )
}
