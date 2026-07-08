import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/orders_provider.dart';
import '../utils/order_status.dart';
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
      ('pending', 'قيد الانتظار', AppTheme.warning),
      ('preparing_shipping', 'قيد التجهيز', AppTheme.info),
      ('shipped', 'قيد الشحن', const Color(0xFF7C3AED)),
    ];

    int countFor(String f) {
      if (f == 'pending') return stats.pending;
      if (f == 'preparing_shipping') return stats.preparing;
      if (f == 'shipped') return stats.shipping;
      return 0;
    }

    return Column(
      children: [
        if (provider.error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 4, 18, 0),
            child: Material(
              color: AppTheme.dangerSoft,
              borderRadius: BorderRadius.circular(16),
              child: ListTile(
                dense: true,
                leading: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: AppTheme.danger.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.error_outline, color: AppTheme.danger, size: 20),
                ),
                title: Text(provider.error!, style: const TextStyle(color: AppTheme.danger, fontWeight: FontWeight.w700, fontSize: 13)),
                trailing: IconButton(
                  icon: const Icon(Icons.refresh_rounded),
                  onPressed: () => provider.load(),
                ),
              ),
            ),
          ),
        // شريط إحصائيات سريع
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 6, 18, 0),
          child: Row(
            children: [
              _QuickStat(value: stats.pending, label: 'قيد الانتظار', color: AppTheme.warning, icon: orderStatusMeta('pending').icon),
              const SizedBox(width: 8),
              _QuickStat(value: stats.preparing, label: 'قيد التجهيز', color: AppTheme.info, icon: orderStatusMeta('preparing_shipping').icon),
              const SizedBox(width: 8),
              _QuickStat(value: stats.shipping, label: 'قيد الشحن', color: Color(0xFF7C3AED), icon: orderStatusMeta('shipped').icon),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 8),
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: const [AppTheme.cardShadowSoft],
            ),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) {
                provider.setSearch(v);
                setState(() {});
              },
              decoration: InputDecoration(
                hintText: 'بحث برقم الطلب، الاسم، المدينة...',
                hintStyle: const TextStyle(fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primary),
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
                        icon: const Icon(Icons.tune_rounded, color: AppTheme.textMuted),
                        tooltip: 'ترتيب',
                        onSelected: provider.setSort,
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: OrderSort.newest, child: Text('الأحدث أولاً')),
                          PopupMenuItem(value: OrderSort.oldest, child: Text('الأقدم أولاً')),
                          PopupMenuItem(value: OrderSort.amountHigh, child: Text('الأعلى سعراً')),
                          PopupMenuItem(value: OrderSort.amountLow, child: Text('الأقل سعراً')),
                        ],
                      ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
        ),
        SizedBox(
          height: 48,
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
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 4),
          child: Text(
            '${list.length} طلب',
            style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.textSecondary, fontSize: 13),
          ),
        ),
        Expanded(
          child: provider.loading && list.isEmpty
              ? const LoadingOverlay(message: 'جاري تحميل الطلبات...')
              : RefreshIndicator(
                  onRefresh: () => provider.load(),
                  color: AppTheme.primary,
                  child: list.isEmpty
                      ? ListView(
                          children: [
                            const SizedBox(height: 48),
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

class _QuickStat extends StatelessWidget {
  final int value;
  final String label;
  final Color color;
  final IconData icon;

  const _QuickStat({required this.value, required this.label, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 8),
            Text('$value', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: color)),
            const SizedBox(width: 4),
            Expanded(child: Text(label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: color.withValues(alpha: 0.85)), overflow: TextOverflow.ellipsis)),
          ],
        ),
      ),
    );
  }
}
