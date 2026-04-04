import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/theme.dart';
import 'app_router.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/wishlist_provider.dart';
import 'providers/recently_viewed_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const RybellaApp());
}

class RybellaApp extends StatelessWidget {
  const RybellaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkAuth()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => WishlistProvider()),
        ChangeNotifierProvider(create: (_) => RecentlyViewedProvider()..load()),
      ],
      child: const _AppWithAuthSync(),
    );
  }
}

class _AppWithAuthSync extends StatelessWidget {
  const _AppWithAuthSync();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Rybella',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme.copyWith(
        textTheme: GoogleFonts.tajawalTextTheme(AppTheme.lightTheme.textTheme).copyWith(
          headlineLarge: GoogleFonts.cormorantGaramond(fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
          headlineMedium: GoogleFonts.cormorantGaramond(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
          titleLarge: GoogleFonts.cormorantGaramond(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
        ),
      ),
      routerConfig: createAppRouter(),
    );
  }
}
