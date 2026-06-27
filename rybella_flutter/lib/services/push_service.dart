import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// إشعارات FCM — يتطلب إعداد Firebase (راجع STORE_PUBLISHING.md)
class PushService {
  static const _subscribedKey = 'rybella_push_subscribed';

  static Future<bool> _firebaseReady() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
      return true;
    } catch (e) {
      debugPrint('[PushService] Firebase not configured: $e');
      return false;
    }
  }

  static Future<bool> isEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_subscribedKey) == true) return true;
    if (!await _firebaseReady()) return false;
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  static Future<bool> requestAndSubscribe() async {
    if (!await _firebaseReady()) return false;

    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    final allowed = settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
    if (!allowed) return false;

    final token = await messaging.getToken();
    if (token == null || token.isEmpty) return false;

    final platform = Platform.isIOS ? 'ios' : 'android';
    final res = await ApiService.subscribePush(token: token, platform: platform);
    if (res.success) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_subscribedKey, true);
      return true;
    }
    return false;
  }

  static Future<void> syncAfterLogin() async {
    if (!await isEnabled()) return;
    if (!await _firebaseReady()) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) return;
    final platform = Platform.isIOS ? 'ios' : 'android';
    await ApiService.subscribePush(token: token, platform: platform);
  }

  static Future<void> clearOnLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_subscribedKey);
  }
}
