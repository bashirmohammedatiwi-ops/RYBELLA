import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsAPI } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return { ok: false, reason: 'simulator', message: 'الإشعارات تعمل على جهاز حقيقي فقط' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return {
      ok: false,
      reason: finalStatus,
      message: 'لم يتم السماح بإشعارات الهاتف',
    };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Rybella',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E85D7A',
    });
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId
    || Constants?.easConfig?.projectId;

  let tokenData;
  try {
    tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
  } catch (e) {
    return { ok: false, reason: 'token-error', message: e.message || 'تعذّر الحصول على رمز الإشعار' };
  }

  const token = tokenData?.data;
  if (!token) {
    return { ok: false, reason: 'no-token', message: 'تعذّر الحصول على رمز الإشعار' };
  }

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await notificationsAPI.subscribePush({ token, platform });

  return { ok: true, token, message: 'تم تفعيل إشعارات الهاتف' };
}
