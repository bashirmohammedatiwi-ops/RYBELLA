import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'app_router.dart';
import 'core/firebase_config.dart';
import 'core/theme.dart';
import 'firebase_options.dart';
import 'providers/auth_provider.dart';
import 'providers/orders_provider.dart';
import 'services/push_service.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

TextTheme _textTheme(TextTheme base) {
  // في الإصدار: خط النظام فقط — تجنّب تحميل خط من الإنترنت عند الإقلاع (سبب شائع للتعطل)
  if (kReleaseMode) return base;
  return GoogleFonts.tajawalTextTheme(base);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = !kReleaseMode;

  if (!kReleaseMode) {
    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      debugPrint('FlutterError: ${details.exception}\n${details.stack}');
    };
  }

  await runZonedGuarded(() async {
    if (!kIsWeb && FirebaseConfig.isConfigured) {
      try {
        await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      } catch (e, st) {
        debugPrint('Firebase init skipped: $e\n$st');
      }
    }

    try {
      await PushService.init();
    } catch (e, st) {
      debugPrint('PushService init skipped: $e\n$st');
    }

    PushService.onNotificationTap = (data) {
      final orderId = int.tryParse('${data['orderId']}');
      if (orderId != null) {
        rootNavigatorKey.currentState?.pushNamed('/order/$orderId');
      }
    };

    runApp(const FulfillmentRoot());
  }, (error, stack) {
    debugPrint('Uncaught error: $error\n$stack');
  });
}

class FulfillmentRoot extends StatelessWidget {
  const FulfillmentRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkAuth()),
        ChangeNotifierProvider(create: (_) => OrdersProvider()),
      ],
      child: MaterialApp(
        navigatorKey: rootNavigatorKey,
        title: 'Rybella Fulfillment',
        debugShowCheckedModeBanner: false,
        locale: const Locale('ar', 'IQ'),
        supportedLocales: const [Locale('ar', 'IQ')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: AppTheme.lightTheme.copyWith(
          textTheme: _textTheme(AppTheme.lightTheme.textTheme),
        ),
        builder: (context, child) => Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        ),
        home: const FulfillmentApp(),
        onGenerateRoute: onGenerateRoute,
      ),
    );
  }
}
