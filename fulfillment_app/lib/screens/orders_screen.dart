import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/orders_provider.dart';
import '../widgets/app_widgets.dart';
import '../widgets/order_widgets.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrdersProvider>();
    final list = provider.filteredOrders;
    final stats = provider.stats;

    const filters = [
      ('pending', 'انتظار', AppTheme.warning),
      ('preparing_shipping', 'تجهيز', AppTheme.info),
      ('delivered', 'مُسلّم', AppTheme.success),
      ('cancelled', 'ملغي', AppTheme.danger),
      ('all', 'الكل', AppTheme.primary),
    ];

    int countFor(String f) {
      if (f == 'all') return stats.total;
      if (f == 'pending') return stats.pending;
      if (f == 'preparing_shipping') return stats.preparing;
      if (f == 'delivered') return stats.delivered;
      if (f == 'cancelled') return stats.cancelled;
      return 0;
    }

    return Column(
      children: [
        if (provider.error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 4, 18, 0),
            child: Material(
              color: AppTheme.dangerSoft,
              borderRadius: BorderRadius.circular(12),
              child: ListTile(
                dense: true,
                leading: const Icon(Icons.error_outline, color: AppTheme.danger),
                title: Text(provider.error!, style: const TextStyle(color: AppTheme.danger, fontWeight: FontWeight.w700)),
                trailing: IconButton(
                  icon: const Icon(Icons.refresh_rounded),
                  onPressed: () => provider.load(),
                ),
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 4, 18, 8),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) {
              provider.setSearch(v);
              setState(() {});
            },
            decoration: InputDecoration(
              hintText: 'بحث برقم الطلب، الاسم، المدينة...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: provider.search.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () {
                        _searchCtrl.clear();
                        provider.setSearch('');
                        setState(() {});
                      },
                    )
                  : PopupMenuButton<OrderSort>(
                      icon: const Icon(Icons.sort_rounded),
                      onSelected: provider.setSort,
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: OrderSort.newest, child: Text('الأحدث')),
                        PopupMenuItem(value: OrderSort.oldest, child: Text('الأقدم')),
                        PopupMenuItem(value: OrderSort.amountHigh, child: Text('الأعلى سعراً')),
                        PopupMenuItem(value: OrderSort.amountLow, child: Text('الأقل سعراً')),
                      ],
                    ),
              filled: true,
              fillColor: AppTheme.surface,
            ),
          ),
        ),
        SizedBox(
          height: 46,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            itemCount: filters.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final (value, label, color) = filters[i];
              return FilterPill(
                label: label,
                color: color,
                count: countFor(value),
                selected: provider.filter == value,
                onTap: () => provider.setFilter(value),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: provider.loading && list.isEmpty
              ? const LoadingOverlay(message: 'جاري تحميل الطلبات...')
              : RefreshIndicator(
                  onRefresh: () => provider.load(),
                  color: AppTheme.primary,
                  child: list.isEmpty
                      ? ListView(
                          children: [
                            const SizedBox(height: 60),
                            EmptyState(
                              icon: Icons.inbox_rounded,
                              title: 'لا توجد طلبات',
                              subtitle: provider.search.isNotEmpty
                                  ? 'جرّب كلمات بحث مختلفة'
                                  : 'ستصل الطلبات الجديدة مع إشعار فوري',
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(18, 4, 18, 100),
                          itemCount: list.length,
                          itemBuilder: (context, i) => OrderCard(
                            order: list[i],
                            index: i,
                            onTap: () => Navigator.of(context).pushNamed('/order/${list[i].id}'),
                          ),
                        ),
                ),
        ),
      ],
    );
  }
}
