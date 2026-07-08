import 'package:flutter/material.dart';
import '../core/theme.dart';

class OrderStatusMeta {
  final String label;
  final String shortLabel;
  final Color color;
  final Color bg;
  final IconData icon;

  const OrderStatusMeta({
    required this.label,
    required this.shortLabel,
    required this.color,
    required this.bg,
    required this.icon,
  });
}

OrderStatusMeta orderStatusMeta(String status) {
  switch (status) {
    case 'pending':
      return const OrderStatusMeta(
        label: 'قيد الانتظار',
        shortLabel: 'انتظار',
        color: AppTheme.warning,
        bg: AppTheme.warningSoft,
        icon: Icons.hourglass_top_rounded,
      );
    case 'preparing_shipping':
      return const OrderStatusMeta(
        label: 'قيد التجهيز',
        shortLabel: 'تجهيز',
        color: AppTheme.info,
        bg: AppTheme.infoSoft,
        icon: Icons.inventory_2_rounded,
      );
    case 'shipped':
      return const OrderStatusMeta(
        label: 'قيد الشحن',
        shortLabel: 'شحن',
        color: Color(0xFF7C3AED),
        bg: Color(0xFFF3E8FF),
        icon: Icons.local_shipping_rounded,
      );
    case 'delivered':
      return const OrderStatusMeta(
        label: 'تم التسليم',
        shortLabel: 'مُسلّم',
        color: AppTheme.success,
        bg: AppTheme.successSoft,
        icon: Icons.check_circle_rounded,
      );
    case 'cancelled':
      return const OrderStatusMeta(
        label: 'ملغي',
        shortLabel: 'ملغي',
        color: AppTheme.danger,
        bg: AppTheme.dangerSoft,
        icon: Icons.cancel_rounded,
      );
    default:
      return const OrderStatusMeta(
        label: 'غير معروف',
        shortLabel: '—',
        color: AppTheme.textMuted,
        bg: AppTheme.surfaceAlt,
        icon: Icons.help_outline_rounded,
      );
  }
}

const orderFlowSteps = [
  'pending',
  'preparing_shipping',
  'shipped',
  'delivered',
];
