import 'dart:math' show min;

import 'package:flutter/material.dart';

/// نقاط توقف للهاتف / التابلت (أقصر ضلع).
abstract final class AppBreakpoints {
  static const double phone = 600;
  static const double tablet = 900;
}

/// تخطيط متجاوب للهواتف والأجهزة اللوحية.
class Responsive {
  Responsive._();

  static Size sizeOf(BuildContext context) => MediaQuery.sizeOf(context);

  static double width(BuildContext context) => sizeOf(context).width;

  static double shortestSide(BuildContext context) => sizeOf(context).shortestSide;

  static bool isPhone(BuildContext context) =>
      shortestSide(context) < AppBreakpoints.phone;

  static bool isTablet(BuildContext context) =>
      shortestSide(context) >= AppBreakpoints.phone;

  static bool isLargeTablet(BuildContext context) =>
      shortestSide(context) >= AppBreakpoints.tablet;

  /// عرض أقصى للمحتوى (يتمركز على الشاشات العريضة).
  static double maxContentWidth(BuildContext context) =>
      min(width(context), 1280);

  /// هوامش أفقية للصفحات.
  static double pagePaddingH(BuildContext context) {
    final s = shortestSide(context);
    if (s >= 900) return 32;
    if (s >= 600) return 22;
    return 16;
  }

  /// أعمدة شبكة المنتجات.
  static int productGridColumns(BuildContext context) {
    final w = width(context);
    if (w >= 1200) return 4;
    if (w >= 800) return 3;
    return 2;
  }

  static double productChildAspectRatio(BuildContext context) {
    final c = productGridColumns(context);
    if (c >= 4) return 0.68;
    if (c >= 3) return 0.66;
    return 0.64;
  }

  /// شبكة الفئات الفرعية / التصنيفات (أعمدة أكثر على التابلت).
  static int categoryGridColumns(BuildContext context) {
    final w = width(context);
    if (w >= 1100) return 5;
    if (w >= 800) return 4;
    if (w >= 600) return 3;
    return 3;
  }

  static double categoryChildAspectRatio(BuildContext context) {
    final c = categoryGridColumns(context);
    if (c >= 5) return 0.88;
    if (c >= 4) return 0.85;
    return 0.82;
  }

  /// عرض شريط الفئات في صفحة الاستكشاف.
  static double exploreSidebarRailWidth(BuildContext context) {
    final s = shortestSide(context);
    if (s >= 900) return 88;
    if (s >= 600) return 78;
    return 72;
  }

  /// عرض بطاقة عرض أفقي في الرئيسية (نسبة من العرض).
  static double homeOfferCardWidth(BuildContext context) {
    final w = width(context);
    return min(340, w * 0.72);
  }
}
