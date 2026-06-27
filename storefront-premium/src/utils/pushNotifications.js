import { notificationsAPI } from '../services/api'

const SW_PATH = '/sw.js'
export const PUSH_UPDATED_EVENT = 'rybella-push-updated'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function notifyPushUpdated() {
  window.dispatchEvent(new CustomEvent(PUSH_UPDATED_EVENT))
}

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

export function getPushPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function isPushFullyEnabled() {
  return getPushPermission() === 'granted' && localStorage.getItem('push_enabled') === '1'
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_PATH)
  } catch {
    return null
  }
}

async function completePushSubscription() {
  if (!localStorage.getItem('token')) {
    return { ok: false, reason: 'auth', message: 'يجب تسجيل الدخول أولاً' }
  }

  const registration = await registerServiceWorker()
  if (!registration) {
    return { ok: false, reason: 'sw-failed', message: 'تعذّر تفعيل خدمة الإشعارات' }
  }

  await navigator.serviceWorker.ready

  const { data } = await notificationsAPI.getVapidPublicKey()
  if (!data?.publicKey) {
    return { ok: false, reason: 'no-vapid', message: 'الخادم غير مهيّأ لإشعارات الهاتف' }
  }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    })
  }

  await notificationsAPI.subscribePush({
    platform: 'web',
    subscription: subscription.toJSON(),
  })

  localStorage.setItem('push_enabled', '1')
  notifyPushUpdated()
  return { ok: true, message: 'تم تفعيل إشعارات الهاتف بنجاح' }
}

/** يكمّل الاشتراك إذا كان الإذن ممنوحاً مسبقاً */
export async function ensurePushNotifications() {
  if (!isPushSupported()) {
    return { ok: false, reason: 'unsupported', message: 'المتصفح لا يدعم إشعارات الهاتف' }
  }

  if (Notification.permission === 'denied') {
    return {
      ok: false,
      reason: 'denied',
      message: 'تم رفض الإذن. يمكنك تفعيل الإشعارات من إعدادات المتصفح.',
    }
  }

  if (Notification.permission !== 'granted') {
    return { ok: false, reason: 'default', message: 'لم يتم منح إذن الإشعارات بعد' }
  }

  if (isPushFullyEnabled()) {
    return { ok: true, message: 'إشعارات الهاتف مفعّلة' }
  }

  return completePushSubscription()
}

/** يطلب الإذن ثم يكمّل الاشتراك في خطوة واحدة */
export async function activatePushNotifications() {
  if (!isPushSupported()) {
    return { ok: false, reason: 'unsupported', message: 'المتصفح لا يدعم إشعارات الهاتف' }
  }

  if (Notification.permission === 'denied') {
    return {
      ok: false,
      reason: 'denied',
      message: 'تم رفض الإذن. يمكنك تفعيل الإشعارات من إعدادات المتصفح.',
    }
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    notifyPushUpdated()
    if (permission !== 'granted') {
      return {
        ok: false,
        reason: permission,
        message: permission === 'denied'
          ? 'تم رفض الإذن. يمكنك تفعيل الإشعارات من إعدادات المتصفح.'
          : 'لم يتم منح إذن الإشعارات',
      }
    }
  }

  return completePushSubscription()
}

export async function subscribeToPushNotifications() {
  return activatePushNotifications()
}

export async function unsubscribeFromPushNotifications() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await notificationsAPI.unsubscribePush({ endpoint: subscription.endpoint }).catch(() => {})
    await subscription.unsubscribe()
  }
  localStorage.removeItem('push_enabled')
  notifyPushUpdated()
}

export async function syncExistingPushSubscription() {
  return ensurePushNotifications()
}
