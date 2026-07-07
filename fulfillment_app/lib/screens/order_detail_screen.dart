import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/config.dart';
import '../core/theme.dart';
import '../models/order.dart';
import '../providers/orders_provider.dart';
import '../utils/format.dart';
import '../widgets/app_widgets.dart';
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
    if (phone == null || phone.isEmpty || phone == '—') return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _copyText(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم النسخ')));
  }

  Future<void> _updateStatus(String status) async {
    String? cancelReason;
    if (status == 'cancelled') {
      cancelReason = await _askCancelReason();
      if (cancelReason == null || cancelReason.isEmpty) return;
    }

    setState(() => _updating = true);
    final ok = await context.read<OrdersProvider>().updateStatus(widget.orderId, status, cancelReason: cancelReason);
    if (!mounted) return;
    setState(() => _updating = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم تحديث حالة الطلب بنجاح')));
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('سبب الإلغاء'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'اكتب سبب الإلغاء...'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('تراجع')),
          FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('تأكيد')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text('طلب #${widget.orderId}'),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: _loading
          ? const LoadingOverlay(message: 'جاري تحميل الطلب...')
          : order == null
              ? const EmptyState(
                  icon: Icons.error_outline_rounded,
                  title: 'الطلب غير موجود',
                  subtitle: 'تعذّر تحميل تفاصيل هذا الطلب',
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(18, 4, 18, 120),
                  children: [
                    OrderStatusTimeline(currentStatus: order.status),
                    const SizedBox(height: 14),
                    SoftCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              StatusBadge(status: order.status),
                              const Spacer(),
                              Text(formatOrderDate(order.createdAt), style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(order.customerName ?? 'عميل', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                          const SizedBox(height: 12),
                          _infoRow(Icons.location_on_outlined, '${order.city} — ${order.address}'),
                          const SizedBox(height: 8),
                          _infoRow(Icons.phone_rounded, order.displayPhone, onTap: () => _callCustomer(order.displayPhone == '—' ? null : order.displayPhone)),
                          if (order.couponCode != null) ...[
                            const SizedBox(height: 8),
                            _infoRow(Icons.local_offer_outlined, 'كوبون: ${order.couponCode}'),
                          ],
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => _callCustomer(order.displayPhone == '—' ? null : order.displayPhone),
                                  icon: const Icon(Icons.call_rounded, size: 18),
                                  label: const Text('اتصال'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => _copyText(order.address),
                                  icon: const Icon(Icons.copy_rounded, size: 18),
                                  label: const Text('نسخ العنوان'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    SectionHeader(title: 'المنتجات (${order.lineCount})'),
                    SoftCard(
                      padding: const EdgeInsets.all(14),
                      child: _ItemsList(order: order),
                    ),
                    const SizedBox(height: 14),
                    SoftCard(
                      child: Column(
                        children: [
                          _payRow('المجموع', formatMoney(order.totalPrice)),
                          _payRow('التوصيل', formatMoney(order.deliveryFee)),
                          if (order.discount > 0) _payRow('الخصم', '- ${formatMoney(order.discount)}', color: AppTheme.success),
                          const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider()),
                          _payRow('الإجمالي', formatMoney(order.finalPrice), bold: true),
                        ],
                      ),
                    ),
                    if (order.cancelReason != null && order.cancelReason!.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      SoftCard(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.info_outline_rounded, color: AppTheme.danger, size: 20),
                            const SizedBox(width: 10),
                            Expanded(child: Text('سبب الإلغاء: ${order.cancelReason}', style: const TextStyle(color: AppTheme.danger, fontWeight: FontWeight.w700))),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
      bottomNavigationBar: order == null || order.status == 'delivered' || order.status == 'cancelled'
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
              decoration: const BoxDecoration(
                color: AppTheme.surface,
                border: Border(top: BorderSide(color: AppTheme.borderLight)),
                boxShadow: [BoxShadow(color: Color(0x0A000000), blurRadius: 12, offset: Offset(0, -4))],
              ),
              child: SafeArea(child: _ActionBar(
                status: order.status,
                loading: _updating,
                onPreparing: () => _updateStatus('preparing_shipping'),
                onDelivered: () => _updateStatus('delivered'),
                onCancel: () => _updateStatus('cancelled'),
                onPending: () => _updateStatus('pending'),
              )),
            ),
    );
  }

  Widget _infoRow(IconData icon, String text, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppTheme.primary),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w600, height: 1.4))),
        ],
      ),
    );
  }

  Widget _payRow(String k, String v, {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Text(k, style: TextStyle(color: AppTheme.textMuted, fontWeight: bold ? FontWeight.w800 : FontWeight.w600)),
          const Spacer(),
          Text(v, style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w800, fontSize: bold ? 18 : 15, color: color ?? (bold ? AppTheme.primaryDark : AppTheme.textPrimary))),
        ],
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
        padding: const EdgeInsets.only(top: 8, bottom: 6),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: AppTheme.accentSoft, borderRadius: BorderRadius.circular(10)),
          child: Text(bundle.offerTitle, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.accent)),
        ),
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
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: img != null
                ? CachedNetworkImage(imageUrl: '${AppConfig.imgBase}$img', width: 56, height: 56, fit: BoxFit.cover)
                : Container(
                    width: 56,
                    height: 56,
                    color: AppTheme.primarySoft,
                    child: const Icon(Icons.image_outlined, color: AppTheme.primary),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
                if (item.shadeName != null) Text(item.shadeName!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                if (item.barcode != null) Text('باركود: ${item.barcode}', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('×${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              Text(formatMoney(item.price), style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
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
    if (loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

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
          IconButton.filledTonal(
            style: IconButton.styleFrom(backgroundColor: AppTheme.dangerSoft, foregroundColor: AppTheme.danger),
            onPressed: onCancel,
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      );
    }

    if (status == 'preparing_shipping') {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: onDelivered,
              icon: const Icon(Icons.check_circle_rounded),
              label: const Text('تم التسليم'),
              style: FilledButton.styleFrom(backgroundColor: AppTheme.success),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: onPending, child: const Text('إرجاع للانتظار')),
        ],
      );
    }

    return const SizedBox.shrink();
  }
}
