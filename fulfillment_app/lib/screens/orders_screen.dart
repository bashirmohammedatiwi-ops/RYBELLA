import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/orders_provider.dart';
import '../widgets/order_widgets.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  static const filters = [
    ('pending', 'انتظار'),
    ('preparing_shipping', 'تجهيز'),
    ('delivered', 'مُسلّم'),
    ('cancelled', 'ملغي'),
    ('all', 'الكل'),
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrdersProvider>();
    final list = provider.filteredOrders;

    return Column(
      children: [
        SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: filters.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final (value, label) = filters[i];
              final selected = provider.filter == value;
              return FilterChip(
                label: Text(label),
                selected: selected,
                onSelected: (_) => provider.setFilter(value),
                selectedColor: AppTheme.primary.withValues(alpha: 0.2),
                checkmarkColor: AppTheme.primary,
                labelStyle: TextStyle(
                  color: selected ? AppTheme.primary : AppTheme.textMuted,
                  fontWeight: FontWeight.w700,
                ),
              );
            },
          ),
        ),
        Expanded(
          child: provider.loading && list.isEmpty
              ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
              : RefreshIndicator(
                  onRefresh: () => provider.load(),
                  color: AppTheme.primary,
                  child: list.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 80),
                            EmptyState(
                              icon: Icons.inbox_rounded,
                              title: 'لا توجد طلبات',
                              subtitle: 'ستظهر الطلبات الجديدة هنا فور وصولها مع إشعار فوري',
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                          itemCount: list.length,
                          itemBuilder: (context, i) => OrderCard(
                            order: list[i],
                            onTap: () => Navigator.of(context).pushNamed('/order/${list[i].id}'),
                          ),
                        ),
                ),
        ),
      ],
    );
  }
}
