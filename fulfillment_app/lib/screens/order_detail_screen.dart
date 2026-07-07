import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/config.dart';
import '../core/theme.dart';
import '../models/order.dart';
import '../providers/orders_provider.dart';
import '../widgets/order_widgets.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  FulfillmentOrder? _order;
  bool _loading = true;
  bool _updating = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final order = await context.read<OrdersProvider>().fetchOrder(widget.orderId);
    if (mounted) setState(() { _order = order; _loading = false; });
  }

  Future<void> _callCustomer(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _updateStatus(String status) async {
    String? cancelReason;
    if (status == 'cancelled') {
      cancelReason = await _askCancelReason();
      if (cancelReason == null) return;
    }

    setState(() => _updating = true);
    final ok = await context.read<OrdersProvider>().updateStatus(
      widget.orderId,
      status,
      cancelReason: cancelReason,
    );
    if (!mounted) return;
    setState(() => _updating = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم تحديث حالة الطلب')));
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<OrdersProvider>().error ?? 'فشل التحديث')),
      );
    }
  }

  Future<String?> _askCancelReason() async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('سبب الإلغاء'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'اكتب سبب الإلغاء...'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('تراجع')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: const Text('تأكيد الإلغاء'),
          ),
        ],
      ),
    );
  }

  String _money(double v) => NumberFormat.decimalPattern('ar_IQ').format(v);

  @override
  Widget build(BuildContext context) {
    final order = _order;

    return Scaffold(
      appBar: AppBar(
        title: Text('طلب #${widget.orderId}'),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : order == null
              ? const EmptyState(
                  icon: Icons.error_outline_rounded,
                  title: 'الطلب غير موجود',
                  subtitle: 'تعذّر تحميل تفاصيل هذا الطلب',
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _HeaderCard(order: order, onCall: () => _callCustomer(order.displayPhone == '—' ? null : order.displayPhone)),
                    const SizedBox(height: 14),
                    _Section(title: 'المنتجات', child: _ItemsList(order: order)),
                    const SizedBox(height: 14),
                    _Section(
                      title: 'ملخص الدفع',
                      child: Column(
                        children: [
                          _row('المجموع', '${_money(order.totalPrice)} د.ع'),
                          _row('التوصيل', '${_money(order.deliveryFee)} د.ع'),
                          if (order.discount > 0) _row('الخصم', '- ${_money(order.discount)} د.ع'),
                          const Divider(),
                          _row('الإجمالي', '${_money(order.finalPrice)} د.ع', bold: true),
                        ],
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
      bottomNavigationBar: order == null || order.status == 'delivered' || order.status == 'cancelled'
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _ActionBar(
                  status: order.status,
                  loading: _updating,
                  onPending: () => _updateStatus('pending'),
                  onPreparing: () => _updateStatus('preparing_shipping'),
                  onDelivered: () => _updateStatus('delivered'),
                  onCancel: () => _updateStatus('cancelled'),
                ),
              ),
            ),
    );
  }

  Widget _row(String k, String v, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(k, style: TextStyle(color: AppTheme.textMuted, fontWeight: bold ? FontWeight.w800 : FontWeight.w500)),
          const Spacer(),
          Text(v, style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, color: bold ? AppTheme.accent : AppTheme.textPrimary)),
        ],
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  final FulfillmentOrder order;
  final VoidCallback onCall;

  const _HeaderCard({required this.order, required this.onCall});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusBadge(status: order.status),
                const Spacer(),
                Text(order.statusLabel, style: const TextStyle(fontWeight: FontWeight.w800)),
              ],
            ),
            const SizedBox(height: 14),
            Text(order.customerName ?? 'عميل', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 18, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Expanded(child: Text('${order.city} — ${order.address}', style: const TextStyle(color: AppTheme.textMuted))),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.phone_rounded, size: 18, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(order.displayPhone, style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton.filledTonal(onPressed: onCall, icon: const Icon(Icons.call_rounded)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;

  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _ItemsList extends StatelessWidget {
  final FulfillmentOrder order;

  const _ItemsList({required this.order});

  @override
  Widget build(BuildContext context) {
    final lines = <Widget>[];

    for (final item in order.items) {
      lines.add(_LineTile(item: item, label: item.productName ?? 'منتج'));
    }
    for (final bundle in order.bundles) {
      lines.add(Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(bundle.offerTitle, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.accent)),
      ));
      for (final item in bundle.items) {
        lines.add(_LineTile(item: item, label: item.productName ?? bundle.offerTitle));
      }
    }

    return Column(children: lines);
  }
}

class _LineTile extends StatelessWidget {
  final OrderLine item;
  final String label;

  const _LineTile({required this.item, required this.label});

  @override
  Widget build(BuildContext context) {
    final img = item.image;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: img != null
                ? CachedNetworkImage(
                    imageUrl: '${AppConfig.imgBase}$img',
                    width: 52,
                    height: 52,
                    fit: BoxFit.cover,
                  )
                : Container(
                    width: 52,
                    height: 52,
                    color: AppTheme.surfaceLight,
                    child: const Icon(Icons.image_not_supported_outlined, color: AppTheme.textMuted),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
                if (item.shadeName != null)
                  Text(item.shadeName!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                if (item.barcode != null)
                  Text('باركود: ${item.barcode}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              ],
            ),
          ),
          Text('×${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class _ActionBar extends StatelessWidget {
  final String status;
  final bool loading;
  final VoidCallback onPreparing;
  final VoidCallback onDelivered;
  final VoidCallback onCancel;
  final VoidCallback onPending;

  const _ActionBar({
    required this.status,
    required this.loading,
    required this.onPreparing,
    required this.onDelivered,
    required this.onCancel,
    required this.onPending,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    if (status == 'pending') {
      return Row(
        children: [
          Expanded(
            child: FilledButton.icon(
              onPressed: onPreparing,
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text('بدء التجهيز'),
            ),
          ),
          const SizedBox(width: 10),
          IconButton.outlined(onPressed: onCancel, icon: const Icon(Icons.close_rounded, color: AppTheme.danger)),
        ],
      );
    }

    if (status == 'preparing_shipping') {
      return Row(
        children: [
          Expanded(
            child: FilledButton.icon(
              onPressed: onDelivered,
              icon: const Icon(Icons.check_rounded),
              label: const Text('تم التسليم'),
            ),
          ),
          const SizedBox(width: 10),
          OutlinedButton(onPressed: onPending, child: const Text('إرجاع للانتظار')),
        ],
      );
    }

    return const SizedBox.shrink();
  }
}
