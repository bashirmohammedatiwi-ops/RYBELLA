import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../core/firebase_config.dart';
import '../firebase_options.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (!FirebaseConfig.isConfigured) return;
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    }
  } catch (_) {}
}

class PushService {
  static final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  static const _channelId = 'rybella_fulfillment';
  static const _channelName = 'تجهيز الطلبات';
  static void Function(Map<String, dynamic> data)? onNotificationTap;

  static bool get _isNativeMobile =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  static Future<bool> _firebaseReady() async {
    if (kIsWeb || !FirebaseConfig.isConfigured) return false;
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      }
      return true;
    } catch (e) {
      debugPrint('[PushService] Firebase: $e');
      return false;
    }
  }

  static Future<void> init() async {
    if (kIsWeb) {
      debugPrint('[PushService] Web — push handled by browser later; UI only');
      return;
    }

    try {
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const darwin = DarwinInitializationSettings();
      await _local.initialize(
        const InitializationSettings(android: android, iOS: darwin, macOS: darwin),
        onDidReceiveNotificationResponse: (details) {
          final payload = details.payload;
          if (payload != null && payload.startsWith('order:')) {
            onNotificationTap?.call({'orderId': payload.split(':').last});
          }
        },
      );
    } catch (e) {
      debugPrint('[PushService] local notifications init skipped: $e');
    }

    if (defaultTargetPlatform == TargetPlatform.macOS) return;

    if (defaultTargetPlatform == TargetPlatform.android) {
      await _local
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(const AndroidNotificationChannel(
            _channelId,
            _channelName,
            description: 'إشعارات الطلبات الجديدة والتذكيرات',
            importance: Importance.max,
            playSound: true,
          ));
    }

    if (!await _firebaseReady()) return;

    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      FirebaseMessaging.onMessage.listen((message) {
        final title = message.notification?.title ?? 'طلب جديد';
        final body = message.notification?.body ?? '';
        final orderId = message.data['orderId'];
        showLocal(
          title: title,
          body: body,
          payload: orderId != null ? 'order:$orderId' : null,
        );
      });

      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        final orderId = message.data['orderId'];
        if (orderId != null) {
          onNotificationTap?.call({'orderId': orderId});
        }
      });
    } catch (e) {
      debugPrint('[PushService] FCM listeners skipped: $e');
    }
  }

  static Future<bool> requestAndSubscribe() async {
    if (!_isNativeMobile || !await _firebaseReady()) return false;

    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(alert: true, badge: true, sound: true);
      final allowed = settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;
      if (!allowed) return false;

      final token = await messaging.getToken();
      if (token == null || token.isEmpty) return false;

      final platform = defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
      final res = await ApiService.subscribePush(token: token, platform: platform);
      return res.success;
    } catch (e) {
      debugPrint('[PushService] subscribe skipped: $e');
      return false;
    }
  }

  static Future<void> syncAfterLogin() async {
    if (!_isNativeMobile || !await _firebaseReady()) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      final platform = defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
      await ApiService.subscribePush(token: token, platform: platform);
    } catch (e) {
      debugPrint('[PushService] sync skipped: $e');
    }
  }

  static Future<void> showLocal({
    required String title,
    required String body,
    String? payload,
    bool ongoing = false,
  }) async {
    if (kIsWeb) return;

    try {
      final androidDetails = AndroidNotificationDetails(
        _channelId,
        _channelName,
        channelDescription: 'إشعارات تجهيز الطلبات',
        importance: Importance.max,
        priority: Priority.high,
        ongoing: ongoing,
        fullScreenIntent: true,
        category: AndroidNotificationCategory.reminder,
      );
      const iosDetails = DarwinNotificationDetails(presentSound: true);
      await _local.show(
        DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title,
        body,
        NotificationDetails(android: androidDetails, iOS: iosDetails),
        payload: payload,
      );
    } catch (e) {
      debugPrint('[PushService] showLocal skipped: $e');
    }
  }

  static Future<void> cancelAll() async {
    if (kIsWeb) return;
    try {
      await _local.cancelAll();
    } catch (e) {
      debugPrint('[PushService] cancelAll skipped: $e');
    }
  }
}
