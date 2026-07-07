import 'package:flutter/material.dart';

/// ثيم فاتح — ألوان Rybella الناعمة
class AppTheme {
  static const primary = Color(0xFFE85D7A);
  static const primaryDark = Color(0xFFC94A5A);
  static const primarySoft = Color(0xFFFFE8EF);
  static const primaryMuted = Color(0xFFFFF5F9);

  static const accent = Color(0xFFFF9E6D);
  static const accentSoft = Color(0xFFFFF0E8);

  static const bg = Color(0xFFFFFBFC);
  static const bgGradientEnd = Color(0xFFFFF0F5);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceAlt = Color(0xFFFFF8FA);
  static const border = Color(0xFFF5D4DF);
  static const borderLight = Color(0xFFFCEEF3);

  static const textPrimary = Color(0xFF1F1218);
  static const textSecondary = Color(0xFF5C3D4A);
  static const textMuted = Color(0xFF9A7A88);

  static const success = Color(0xFF2EAD7A);
  static const successSoft = Color(0xFFE8F8F0);
  static const warning = Color(0xFFE89B3A);
  static const warningSoft = Color(0xFFFFF6E8);
  static const danger = Color(0xFFE05454);
  static const dangerSoft = Color(0xFFFFEEEE);
  static const info = Color(0xFF4A9FD8);
  static const infoSoft = Color(0xFFEAF5FC);

  /// ألوان بكج العروض — مميزة عن المنتج العادي
  static const bundle = Color(0xFFE87B2E);
  static const bundleDark = Color(0xFFC45E18);
  static const bundleSoft = Color(0xFFFFF3E8);
  static const bundleGradient = LinearGradient(
    colors: [Color(0xFFFFF0E0), Color(0xFFFFFAF5)],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  /// ألوان المنتج العادي
  static const product = Color(0xFF5B6FD8);
  static const productSoft = Color(0xFFEEF0FF);

  static const cardShadow = BoxShadow(
    color: Color(0x14E85D7A),
    blurRadius: 24,
    offset: Offset(0, 8),
  );

  static const cardShadowSoft = BoxShadow(
    color: Color(0x0A000000),
    blurRadius: 16,
    offset: Offset(0, 4),
  );

  static LinearGradient get heroGradient => const LinearGradient(
        colors: [Color(0xFFFFE4EC), Color(0xFFFFF8FA), Color(0xFFFFFFFF)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      );

  static LinearGradient get primaryGradient => const LinearGradient(
        colors: [primary, primaryDark],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );

  static LinearGradient get pageGradient => const LinearGradient(
        colors: [bg, bgGradientEnd],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      );

  static ThemeData get lightTheme {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        secondary: accent,
        surface: surface,
        error: danger,
        brightness: Brightness.light,
      ),
    );

    return base.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w800,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: borderLight),
        ),
      ),
      dividerTheme: const DividerThemeData(color: borderLight, thickness: 1),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: textPrimary,
        contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textSecondary,
          side: const BorderSide(color: border),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        labelStyle: const TextStyle(color: textMuted, fontWeight: FontWeight.w600),
        hintStyle: const TextStyle(color: textMuted),
        prefixIconColor: textMuted,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: primarySoft,
        elevation: 0,
        height: 68,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
            color: selected ? primary : textMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(color: selected ? primary : textMuted, size: 24);
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceAlt,
        selectedColor: primarySoft,
        labelStyle: const TextStyle(fontWeight: FontWeight.w700),
        side: const BorderSide(color: borderLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
    );
  }
}
