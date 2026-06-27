import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getPushPermission,
  isPushSupported,
  registerServiceWorker,
  subscribeToPushNotifications,
  syncExistingPushSubscription,
} from '../utils/pushNotifications'
import { PUSH_PERMISSION_COPY as copy } from '../constants/pushCopy'
import './PushPermissionPrompt.css'

export default function PushPermissionPrompt() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [permission, setPermission] = useState(getPushPermission())

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (!user) {
      setVisible(false)
      return
    }

    setPermission(getPushPermission())

    if (!isPushSupported()) {
      setVisible(false)
      return
    }

    if (Notification.permission === 'granted') {
      syncExistingPushSubscription()
      setVisible(false)
      return
    }

    if (Notification.permission === 'denied') {
      setVisible(false)
      return
    }

    const dismissed = sessionStorage.getItem('push_prompt_dismissed')
    setVisible(!dismissed)
  }, [user])

  const handleEnable = async () => {
    setLoading(true)
    setMessage('')
    const result = await subscribeToPushNotifications()
    setLoading(false)
    if (result.ok) {
      setPermission('granted')
      setVisible(false)
      setMessage(result.message)
    } else {
      setMessage(result.message || 'تعذّر تفعيل الإشعارات')
      if (result.reason === 'denied') setVisible(false)
    }
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
  const [permission, setPermission] = useState(getPushPermission())
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    setPermission(getPushPermission())
    if (user && permission === 'granted') {
      syncExistingPushSubscription()
    }
  }, [user, permission])

  if (!user || !isPushSupported()) return null

  const handleClick = async () => {
    setLoading(true)
    setFeedback('')
    const result = await subscribeToPushNotifications()
    setLoading(false)
    setPermission(getPushPermission())
    setFeedback(result.message || (result.ok ? 'تم التفعيل' : 'تعذّر التفعيل'))
  }

  if (permission === 'granted') {
    return <p className={`push-enable-status is-on ${className}`}>إشعارات الهاتف مفعّلة ✓</p>
  }

  if (permission === 'denied') {
    return (
      <p className={`push-enable-status is-denied ${className}`}>
        الإشعارات مرفوضة — فعّليها من إعدادات المتصفح/الهاتف
      </p>
    )
  }

  return (
    <div className={`push-enable-block ${className}`}>
      <p className="push-enable-teaser">{copy.enableShort}</p>
      <button type="button" className="push-enable-btn" onClick={handleClick} disabled={loading}>
        {loading ? '...' : copy.accept}
      </button>
      {feedback && <p className="push-enable-feedback">{feedback}</p>}
    </div>
  )
}
