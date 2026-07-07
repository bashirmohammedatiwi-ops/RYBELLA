import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/orders_provider.dart';
import '../widgets/order_widgets.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final stats = context.watch<OrdersProvider>().stats;
    final orders = context.watch<OrdersProvider>();

    return RefreshIndicator(
      onRefresh: () => orders.load(),
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2A1520), Color(0xFF141C27)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.35)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('مركز التجهيز', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 6),
                      Text(
                        stats.pending > 0
                            ? '${stats.pending} طلب يحتاج اهتمامك الآن'
                            : 'لا توجد طلبات معلّقة — عمل رائع!',
                        style: const TextStyle(color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
                if (stats.pending > 0)
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.warning.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.warning),
                    ),
                    child: Text(
                      '${stats.pending}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.warning),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.25,
            children: [
              StatTile(
                label: 'بانتظار التجهيز',
                value: stats.pending,
                color: AppTheme.warning,
                icon: Icons.hourglass_top_rounded,
                selected: orders.filter == 'pending',
                onTap: () => orders.setFilter('pending'),
              ),
              StatTile(
                label: 'قيد التجهيز',
                value: stats.preparing,
                color: AppTheme.info,
                icon: Icons.local_shipping_rounded,
                selected: orders.filter == 'preparing_shipping',
                onTap: () => orders.setFilter('preparing_shipping'),
              ),
              StatTile(
                label: 'تم التسليم',
                value: stats.delivered,
                color: AppTheme.success,
                icon: Icons.check_circle_rounded,
                selected: orders.filter == 'delivered',
                onTap: () => orders.setFilter('delivered'),
              ),
              StatTile(
                label: 'إجمالي الطلبات',
                value: stats.total,
                color: AppTheme.primary,
                icon: Icons.receipt_long_rounded,
                selected: orders.filter == 'all',
                onTap: () => orders.setFilter('all'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text('آخر الطلبات', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ...orders.orders.take(5).map(
            (o) => OrderCard(
              order: o,
              onTap: () => Navigator.of(context).pushNamed('/order/${o.id}'),
            ),
          ),
        ],
      ),
    );
  }
}
