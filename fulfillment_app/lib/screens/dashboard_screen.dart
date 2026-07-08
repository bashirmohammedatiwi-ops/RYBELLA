import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/orders_provider.dart';
import '../utils/order_status.dart';
import '../widgets/app_widgets.dart';
import '../widgets/order_widgets.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final stats = context.watch<OrdersProvider>().stats;
    final provider = context.watch<OrdersProvider>();
    final recent = provider.orders.take(5).toList();

    return RefreshIndicator(
      onRefresh: () => provider.load(),
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 100),
        children: [
          SoftCard(
            gradient: AppTheme.heroGradient,
            shadows: const [AppTheme.cardShadow],
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primarySoft,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.inventory_2_rounded, color: AppTheme.primary, size: 22),
                          ),
                          const SizedBox(width: 10),
                          const Text('لوحة التجهيز', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        stats.pending > 0
                            ? 'لديك ${stats.pending} طلب قيد الانتظار'
                            : 'لا توجد طلبات قيد الانتظار — أحسنت! 🎉',
                        style: const TextStyle(color: AppTheme.textSecondary, height: 1.4, fontWeight: FontWeight.w600),
                      ),
                      if (stats.pending > 0) ...[
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.warning,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          ),
                          onPressed: () => provider.setFilter('pending'),
                          icon: const Icon(Icons.bolt_rounded, size: 20),
                          label: const Text('معالجة طلبات قيد الانتظار'),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                _PendingRing(count: stats.pending),
              ],
            ),
          ).animate().fadeIn(duration: 350.ms),
          const SizedBox(height: 18),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.05,
            children: [
              StatTile(
                label: 'قيد الانتظار',
                value: stats.pending,
                color: AppTheme.warning,
                bg: AppTheme.warningSoft,
                icon: orderStatusMeta('pending').icon,
                selected: provider.filter == 'pending',
                onTap: () => provider.setFilter('pending'),
              ),
              StatTile(
                label: 'قيد التجهيز',
                value: stats.preparing,
                color: AppTheme.info,
                bg: AppTheme.infoSoft,
                icon: orderStatusMeta('preparing_shipping').icon,
                selected: provider.filter == 'preparing_shipping',
                onTap: () => provider.setFilter('preparing_shipping'),
              ),
              StatTile(
                label: 'تم التجهيز',
                value: stats.ready,
                color: AppTheme.primary,
                bg: AppTheme.primarySoft,
                icon: orderStatusMeta('ready_to_ship').icon,
                selected: provider.filter == 'ready_to_ship',
                onTap: () => provider.setFilter('ready_to_ship'),
              ),
              StatTile(
                label: 'الشحن',
                value: stats.shipping,
                color: const Color(0xFF7C3AED),
                bg: const Color(0xFFF3E8FF),
                icon: orderStatusMeta('shipped').icon,
                selected: provider.filter == 'shipped',
                onTap: () => provider.setFilter('shipped'),
              ),
            ],
          ),
          const SizedBox(height: 22),
          SectionHeader(
            title: 'آخر الطلبات',
            action: recent.isNotEmpty ? 'عرض الكل' : null,
            onAction: recent.isNotEmpty ? () => provider.setFilter('all') : null,
          ),
          if (recent.isEmpty)
            const EmptyState(
              icon: Icons.inbox_rounded,
              title: 'لا توجد طلبات بعد',
              subtitle: 'ستظهر الطلبات الجديدة هنا فور وصولها',
            )
          else
            ...recent.asMap().entries.map(
              (e) => OrderCard(
                order: e.value,
                index: e.key,
                onTap: () => Navigator.of(context).pushNamed('/order/${e.value.id}'),
              ),
            ),
        ],
      ),
    );
  }
}

class _PendingRing extends StatelessWidget {
  final int count;

  const _PendingRing({required this.count});

  @override
  Widget build(BuildContext context) {
    final active = count > 0;
    final color = active ? AppTheme.warning : AppTheme.primary;
    return Container(
      width: 90,
      height: 90,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: active ? AppTheme.warningSoft : AppTheme.primarySoft,
        border: Border.all(color: color, width: 3),
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.25), blurRadius: 16)],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('$count', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: color)),
          Text('انتظار', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color)),
        ],
      ),
    );
  }
}
