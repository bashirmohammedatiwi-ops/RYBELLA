import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../models/order.dart';
import '../providers/orders_provider.dart';
import '../utils/format.dart';
import '../widgets/app_widgets.dart';
import '../widgets/order_widgets.dart';
import '../widgets/product_line_widgets.dart';

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
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('تم النسخ'),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تحديث حالة الطلب بنجاح')),
      );
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.cancel_outlined, color: AppTheme.danger),
            SizedBox(width: 10),
            Text('سبب الإلغاء'),
          ],
        ),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'اكتب سبب الإلغاء...'),
          maxLines: 3,
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('تراجع')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppTheme.danger),
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: const Text('تأكيد الإلغاء'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('طلب #${widget.orderId}', style: const TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          IconButton(
            onPressed: _loading ? null : _load,
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.surface.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: const Icon(Icons.refresh_rounded, size: 20),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(gradient: AppTheme.pageGradient),
        child: _loading
            ? const LoadingOverlay(message: 'جاري تحميل الطلب...')
            : order == null
                ? const EmptyState(
                    icon: Icons.error_outline_rounded,
                    title: 'الطلب غير موجود',
                    subtitle: 'تعذّر تحميل تفاصيل هذا الطلب',
                  )
                : ListView(
                    padding: const EdgeInsets.fromLTRB(18, 100, 18, 130),
                    children: [
                      OrderStatusTimeline(currentStatus: order.status),
                      const SizedBox(height: 16),
                      _CustomerCard(order: order, onCall: _callCustomer, onCopyAddress: () => _copyText(order.address)),
                      const SizedBox(height: 16),
                      _ItemsSummaryBar(order: order),
                      const SizedBox(height: 14),
                      OrderItemsSection(order: order),
                      const SizedBox(height: 16),
                      _PaymentSummary(order: order),
                      if (order.cancelReason != null && order.cancelReason!.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        SoftCard(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(color: AppTheme.dangerSoft, borderRadius: BorderRadius.circular(10)),
                                child: const Icon(Icons.info_outline_rounded, color: AppTheme.danger, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('سبب الإلغاء', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.danger, fontSize: 12)),
                                    const SizedBox(height: 4),
                                    Text(order.cancelReason!, style: const TextStyle(color: AppTheme.danger, fontWeight: FontWeight.w600, height: 1.4)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
      ),
      bottomNavigationBar: order == null || order.status == 'delivered' || order.status == 'cancelled'
          ? null
          : _ActionBar(
              status: order.status,
              loading: _updating,
              onPreparing: () => _updateStatus('preparing_shipping'),
              onDelivered: () => _updateStatus('delivered'),
              onCancel: () => _updateStatus('cancelled'),
              onPending: () => _updateStatus('pending'),
            ),
    );
  }
}

class _CustomerCard extends StatelessWidget {
  final FulfillmentOrder order;
  final void Function(String?) onCall;
  final VoidCallback onCopyAddress;

  const _CustomerCard({required this.order, required this.onCall, required this.onCopyAddress});

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      shadows: const [AppTheme.cardShadow],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusBadge(status: order.status),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: AppTheme.surfaceAlt, borderRadius: BorderRadius.circular(10)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.schedule_rounded, size: 14, color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(formatOrderDate(order.createdAt), style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.25), blurRadius: 10)],
                ),
                child: Center(
                  child: Text(
                    (order.customerName?.isNotEmpty == true ? order.customerName![0] : 'ع').toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.customerName ?? 'عميل', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 4),
                    Text(order.displayPhone, style: const TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w700, fontSize: 15)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InfoTile(icon: Icons.location_on_rounded, label: 'العنوان', value: '${order.city} — ${order.address}', color: AppTheme.info),
          const SizedBox(height: 10),
          _InfoTile(icon: Icons.phone_rounded, label: 'الهاتف', value: order.displayPhone, color: AppTheme.primary, onTap: () => onCall(order.displayPhone == '—' ? null : order.displayPhone)),
          if (order.couponCode != null) ...[
            const SizedBox(height: 10),
            _InfoTile(icon: Icons.local_offer_rounded, label: 'كوبون', value: order.couponCode!, color: AppTheme.success),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton.tonalIcon(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.successSoft,
                    foregroundColor: AppTheme.success,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => onCall(order.displayPhone == '—' ? null : order.displayPhone),
                  icon: const Icon(Icons.call_rounded, size: 20),
                  label: const Text('اتصال'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                  onPressed: onCopyAddress,
                  icon: const Icon(Icons.copy_rounded, size: 18),
                  label: const Text('نسخ العنوان'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final VoidCallback? onTap;

  const _InfoTile({required this.icon, required this.label, required this.value, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.12)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 18, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color)),
                    const SizedBox(height: 2),
                    Text(value, style: const TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w600, height: 1.4)),
                  ],
                ),
              ),
              if (onTap != null) Icon(Icons.chevron_left_rounded, color: color.withValues(alpha: 0.5), size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _ItemsSummaryBar extends StatelessWidget {
  final FulfillmentOrder order;

  const _ItemsSummaryBar({required this.order});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (order.items.isNotEmpty)
          Expanded(child: _SummaryChip(
            icon: Icons.shopping_bag_rounded,
            label: 'منتجات',
            count: order.items.length,
            color: AppTheme.product,
            bg: AppTheme.productSoft,
          )),
        if (order.items.isNotEmpty && order.bundles.isNotEmpty) const SizedBox(width: 10),
        if (order.bundles.isNotEmpty)
          Expanded(child: _SummaryChip(
            icon: Icons.card_giftcard_rounded,
            label: 'بكجات',
            count: order.bundles.length,
            color: AppTheme.bundle,
            bg: AppTheme.bundleSoft,
          )),
      ],
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final Color color;
  final Color bg;

  const _SummaryChip({required this.icon, required this.label, required this.count, required this.color, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 10),
          Text(label, style: TextStyle(fontWeight: FontWeight.w800, color: color, fontSize: 14)),
          const Spacer(),
          Text('$count', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: color)),
        ],
      ),
    );
  }
}

class _PaymentSummary extends StatelessWidget {
  final FulfillmentOrder order;

  const _PaymentSummary({required this.order});

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.receipt_long_rounded, color: AppTheme.primary, size: 20),
              SizedBox(width: 8),
              Text('ملخص الدفع', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 14),
          _payRow('المجموع', formatMoney(order.totalPrice)),
          _payRow('التوصيل', formatMoney(order.deliveryFee)),
          if (order.discount > 0) _payRow('الخصم', '- ${formatMoney(order.discount)}', color: AppTheme.success),
          const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider()),
          _payRow('الإجمالي', formatMoney(order.finalPrice), bold: true),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.payments_outlined, size: 16, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(
                  order.paymentMethod == 'cash' ? 'دفع نقدي عند الاستلام' : (order.paymentMethod ?? 'طريقة دفع غير محددة'),
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textSecondary, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _payRow(String k, String v, {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(k, style: TextStyle(color: AppTheme.textMuted, fontWeight: bold ? FontWeight.w800 : FontWeight.w600)),
          const Spacer(),
          Text(v, style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w800, fontSize: bold ? 20 : 15, color: color ?? (bold ? AppTheme.primaryDark : AppTheme.textPrimary))),
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
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 18),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: const Border(top: BorderSide(color: AppTheme.borderLight)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 20, offset: const Offset(0, -6))],
      ),
      child: SafeArea(
        child: loading
            ? const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(color: AppTheme.primary)))
            : status == 'pending'
                ? Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: FilledButton.icon(
                          onPressed: onPreparing,
                          icon: const Icon(Icons.inventory_2_rounded),
                          label: const Text('بدء التجهيز'),
                          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      IconButton.filled(
                        style: IconButton.styleFrom(
                          backgroundColor: AppTheme.dangerSoft,
                          foregroundColor: AppTheme.danger,
                          minimumSize: const Size(52, 52),
                        ),
                        onPressed: onCancel,
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  )
                : status == 'preparing_shipping'
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: onDelivered,
                              icon: const Icon(Icons.check_circle_rounded),
                              label: const Text('تم التسليم'),
                              style: FilledButton.styleFrom(
                                backgroundColor: AppTheme.success,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextButton.icon(
                            onPressed: onPending,
                            icon: const Icon(Icons.undo_rounded, size: 18),
                            label: const Text('إرجاع للانتظار'),
                          ),
                        ],
                      )
                    : const SizedBox.shrink(),
      ),
    );
  }
}
