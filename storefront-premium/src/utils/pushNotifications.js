import { notificationsAPI } from '../services/api'

const SW_PATH = '/sw.js'

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

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_PATH)
  } catch {
    return null
  }
}

export async function subscribeToPushNotifications() {
  if (!isPushSupported()) {
    return { ok: false, reason: 'unsupported', message: 'المتصفح لا يدعم إشعارات الهاتف' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      reason: permission,
      message: permission === 'denied'
        ? 'تم رفض الإذن. يمكنك تفعيل الإشعارات من إعدادات المتصفح.'
        : 'لم يتم منح إذن الإشعارات',
    };
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return { ok: false, reason: 'sw-failed', message: 'تعذّر تفعيل خدمة الإشعارات' };
  }

  await navigator.serviceWorker.ready;

  const { data } = await notificationsAPI.getVapidPublicKey();
  if (!data?.publicKey) {
    return { ok: false, reason: 'no-vapid', message: 'الخادم غير مهيّأ لإشعارات الهاتف' };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });
  }

  await notificationsAPI.subscribePush({
    platform: 'web',
    subscription: subscription.toJSON(),
  });

  localStorage.setItem('push_enabled', '1');
  return { ok: true, message: 'تم تفعيل إشعارات الهاتف بنجاح' };
}

export async function unsubscribeFromPushNotifications() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await notificationsAPI.unsubscribePush({ endpoint: subscription.endpoint }).catch(() => {});
    await subscription.unsubscribe();
  }
  localStorage.removeItem('push_enabled');
}

export async function syncExistingPushSubscription() {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  if (!localStorage.getItem('token')) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await notificationsAPI.subscribePush({
      platform: 'web',
      subscription: subscription.toJSON(),
    });
    localStorage.setItem('push_enabled', '1');
  } catch {
    /* ignore */
  }
}
