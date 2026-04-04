import 'package:flutter/material.dart';

class AppTheme {
  // ألوان وردية وبيضاء - تصميم أنيق
  static const Color primary = Color(0xFFE85D7A);
  static const Color primaryDark = Color(0xFFD14A66);
  static const Color primaryLight = Color(0xFFF08FA6);
  static const Color primarySoft = Color(0x26E85D7A);
  static const Color surface = Color(0xFFFFFBFB);
  static const Color surfaceAlt = Color(0xFFFDF8F9);
  static const Color white = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF4A4A4A);
  static const Color textMuted = Color(0xFF8E8E93);
  static const Color border = Color(0xFFF0E6E8);
  static const Color success = Color(0xFF2E7D32);
  static const Color error = Color(0xFFC62828);
  static const Color pastelYellow = Color(0xFFFFF8E7);
  static const Color pastelPink = Color(0xFFFFF0F5);
  static const Color pastelBlue = Color(0xFFE8F4FD);
  static const Color pastelLavender = Color(0xFFF3E8FD);

  static const double radius = 20;
  static const double radiusLg = 24;
  static const double radiusSm = 14;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        secondary: primaryDark,
        surface: surface,
        error: error,
        brightness: Brightness.light,
      ),
      fontFamily: 'Tajawal',
      scaffoldBackgroundColor: surface,
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: textPrimary,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
        color: Colors.white,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primary,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
