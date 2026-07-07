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
    final recent = provider.orders.take(6).toList();

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
                      const Text('لوحة التجهيز', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 8),
                      Text(
                        stats.pending > 0
                            ? 'لديك ${stats.pending} طلب يحتاج معالجة فورية'
                            : 'لا توجد طلبات معلّقة — أحسنت!',
                        style: const TextStyle(color: AppTheme.textSecondary, height: 1.4, fontWeight: FontWeight.w600),
                      ),
                      if (stats.pending > 0) ...[
                        const SizedBox(height: 14),
                        FilledButton.tonal(
                          style: FilledButton.styleFrom(backgroundColor: AppTheme.primarySoft, foregroundColor: AppTheme.primaryDark),
                          onPressed: () => provider.setFilter('pending'),
                          child: const Text('عرض الطلبات المعلّقة'),
                        ),
                      ],
                    ],
                  ),
                ),
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
                label: 'بانتظار التجهيز',
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
                label: 'تم التسليم',
                value: stats.delivered,
                color: AppTheme.success,
                bg: AppTheme.successSoft,
                icon: orderStatusMeta('delivered').icon,
                selected: provider.filter == 'delivered',
                onTap: () => provider.setFilter('delivered'),
              ),
              StatTile(
                label: 'إجمالي الطلبات',
                value: stats.total,
                color: AppTheme.primary,
                bg: AppTheme.primarySoft,
                icon: Icons.receipt_long_rounded,
                selected: provider.filter == 'all',
                onTap: () => provider.setFilter('all'),
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
    return Container(
      width: 86,
      height: 86,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: count > 0 ? AppTheme.warningSoft : AppTheme.primarySoft,
        border: Border.all(color: count > 0 ? AppTheme.warning : AppTheme.primary, width: 2.5),
        boxShadow: [BoxShadow(color: (count > 0 ? AppTheme.warning : AppTheme.primary).withValues(alpha: 0.2), blurRadius: 14)],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('$count', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: count > 0 ? AppTheme.warning : AppTheme.primary)),
          Text('معلّق', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: count > 0 ? AppTheme.warning : AppTheme.primary)),
        ],
      ),
    );
  }
}
