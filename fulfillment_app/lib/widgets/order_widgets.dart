import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/theme.dart';
import '../models/order.dart';
import '../utils/format.dart';
import '../utils/order_status.dart';
import 'app_widgets.dart';
import 'product_image_viewer.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool compact;
  final bool filled;

  const StatusBadge({
    super.key,
    required this.status,
    this.compact = false,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    final meta = orderStatusMeta(status);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 10 : 12, vertical: compact ? 5 : 7),
      decoration: BoxDecoration(
        color: filled ? meta.color : meta.bg,
        borderRadius: BorderRadius.circular(999),
        border: filled ? null : Border.all(color: meta.color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(meta.icon, size: compact ? 13 : 14, color: filled ? Colors.white : meta.color),
          const SizedBox(width: 5),
          Text(
            compact ? meta.shortLabel : meta.label,
            style: TextStyle(
              color: filled ? Colors.white : meta.color,
              fontSize: compact ? 11 : 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class StatTile extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final Color bg;
  final IconData icon;
  final bool selected;
  final VoidCallback? onTap;

  const StatTile({
    super.key,
    required this.label,
    required this.value,
    required this.color,
    required this.bg,
    required this.icon,
    this.selected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected ? bg : AppTheme.surface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: selected ? color.withValues(alpha: 0.45) : AppTheme.borderLight, width: selected ? 1.5 : 1),
            boxShadow: selected ? [BoxShadow(color: color.withValues(alpha: 0.12), blurRadius: 16, offset: const Offset(0, 6))] : const [AppTheme.cardShadowSoft],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(13)),
                child: Icon(icon, color: color, size: 22),
              ),
              const Spacer(),
              Text('$value', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: color, height: 1)),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 280.ms).slideY(begin: 0.06, end: 0);
  }
}

class OrderCard extends StatelessWidget {
  final FulfillmentOrder order;
  final VoidCallback onTap;
  final int index;

  const OrderCard({
    super.key,
    required this.order,
    required this.onTap,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    final meta = orderStatusMeta(order.status);
    final previewImages = _collectPreviewImages();

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: Ink(
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: const [AppTheme.cardShadowSoft],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // شريط الحالة العلوي
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.25), blurRadius: 8, offset: const Offset(0, 3))],
                        ),
                        child: Text('#${order.id}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                      ),
                      const SizedBox(width: 8),
                      if (timeAgoAr(order.createdAt).isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppTheme.surfaceAlt, borderRadius: BorderRadius.circular(8)),
                          child: Text(timeAgoAr(order.createdAt), style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                        ),
                      const Spacer(),
                      StatusBadge(status: order.status, compact: true),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: meta.bg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: meta.color.withValues(alpha: 0.2)),
                        ),
                        child: Icon(Icons.person_rounded, color: meta.color, size: 26),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(order.customerName ?? 'عميل', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppTheme.textPrimary)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textMuted),
                                const SizedBox(width: 4),
                                Expanded(child: Text(order.city, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600))),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(formatMoney(order.finalPrice), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primaryDark)),
                          Text(order.paymentMethod == 'cash' ? 'نقدي' : (order.paymentMethod ?? '—'), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ],
                  ),
                ),
                // معاينة الصور + عداد المنتجات/البكجات
                if (previewImages.isNotEmpty || order.items.isNotEmpty || order.bundles.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceAlt,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (order.items.isNotEmpty)
                              _countChip(Icons.shopping_bag_outlined, '${order.items.length} منتج', AppTheme.product, AppTheme.productSoft),
                            if (order.items.isNotEmpty && order.bundles.isNotEmpty) const SizedBox(width: 8),
                            if (order.bundles.isNotEmpty)
                              _countChip(Icons.card_giftcard_outlined, '${order.bundles.length} بكج', AppTheme.bundle, AppTheme.bundleSoft),
                            const Spacer(),
                            Text('${order.lineCount} عنصر', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted)),
                          ],
                        ),
                        if (previewImages.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          SizedBox(
                            height: 52,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: previewImages.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 8),
                              itemBuilder: (_, i) {
                                final img = previewImages[i];
                                return ProductThumbnail(
                                  imagePath: img.path,
                                  size: 52,
                                  radius: 12,
                                  showZoomHint: false,
                                  onTap: () => showProductImageViewer(context, imagePath: img.path, title: img.label),
                                );
                              },
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
                // زر فتح التفاصيل
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                  child: Row(
                    children: [
                      const Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: AppTheme.primary),
                      const SizedBox(width: 6),
                      Text('عرض التفاصيل', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ).animate(delay: (40 * index).ms).fadeIn(duration: 300.ms).slideX(begin: 0.03, end: 0);
  }

  List<_PreviewImage> _collectPreviewImages() {
    final list = <_PreviewImage>[];
    for (final item in order.items) {
      if (item.image != null) list.add(_PreviewImage(item.image, item.productName ?? 'منتج'));
      if (list.length >= 4) break;
    }
    if (list.length < 4) {
      for (final bundle in order.bundles) {
        for (final item in bundle.items) {
          if (item.image != null) list.add(_PreviewImage(item.image, bundle.offerTitle));
          if (list.length >= 4) break;
        }
        if (list.length >= 4) break;
      }
    }
    return list;
  }

  Widget _countChip(IconData icon, String label, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color)),
        ],
      ),
    );
  }
}

class _PreviewImage {
  final String? path;
  final String label;
  _PreviewImage(this.path, this.label);
}

class FilterPill extends StatelessWidget {
  final String label;
  final bool selected;
  final int? count;
  final Color? color;
  final VoidCallback onTap;

  const FilterPill({
    super.key,
    required this.label,
    required this.selected,
    this.count,
    this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.primary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
          decoration: BoxDecoration(
            color: selected ? c.withValues(alpha: 0.14) : AppTheme.surface,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: selected ? c.withValues(alpha: 0.5) : AppTheme.borderLight, width: selected ? 1.5 : 1),
            boxShadow: selected ? [BoxShadow(color: c.withValues(alpha: 0.1), blurRadius: 10)] : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (selected)
                Padding(
                  padding: const EdgeInsets.only(left: 0),
                  child: Icon(Icons.check_circle_rounded, size: 14, color: c),
                ),
              if (selected) const SizedBox(width: 6),
              Text(label, style: TextStyle(color: selected ? c : AppTheme.textSecondary, fontWeight: FontWeight.w800, fontSize: 13)),
              if (count != null && count! > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: selected ? c : AppTheme.primarySoft,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text('$count', style: TextStyle(color: selected ? Colors.white : AppTheme.primaryDark, fontSize: 11, fontWeight: FontWeight.w900)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primarySoft, AppTheme.surface],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.border),
                boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.1), blurRadius: 20)],
              ),
              child: Icon(icon, size: 42, color: AppTheme.primary),
            ),
            const SizedBox(height: 22),
            Text(title, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w900, color: AppTheme.textPrimary)),
            const SizedBox(height: 8),
            Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textMuted, height: 1.5, fontWeight: FontWeight.w500)),
            if (action != null) ...[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
}

class OrderStatusTimeline extends StatelessWidget {
  final String currentStatus;

  const OrderStatusTimeline({super.key, required this.currentStatus});

  @override
  Widget build(BuildContext context) {
    if (currentStatus == 'cancelled') {
      return SoftCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: AppTheme.dangerSoft, borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.cancel_rounded, color: AppTheme.danger),
            ),
            const SizedBox(width: 12),
            const Expanded(child: Text('تم إلغاء هذا الطلب', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.danger, fontSize: 15))),
          ],
        ),
      );
    }

    final currentIdx = orderFlowSteps.indexOf(currentStatus).clamp(0, orderFlowSteps.length - 1);

    return SoftCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Row(
        children: List.generate(orderFlowSteps.length * 2 - 1, (i) {
          if (i.isOdd) {
            final stepIdx = i ~/ 2;
            final done = currentIdx > stepIdx;
            return Expanded(
              child: Container(
                height: 3,
                margin: const EdgeInsets.only(bottom: 32),
                decoration: BoxDecoration(
                  gradient: done
                      ? LinearGradient(colors: [AppTheme.success, AppTheme.success.withValues(alpha: 0.6)])
                      : null,
                  color: done ? null : AppTheme.border,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            );
          }

          final stepIdx = i ~/ 2;
          final status = orderFlowSteps[stepIdx];
          final meta = orderStatusMeta(status);
          final active = currentIdx >= stepIdx;
          final current = currentIdx == stepIdx;
          return Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: current ? 42 : 36,
                height: current ? 42 : 36,
                decoration: BoxDecoration(
                  color: active ? meta.bg : AppTheme.surfaceAlt,
                  shape: BoxShape.circle,
                  border: Border.all(color: active ? meta.color : AppTheme.border, width: current ? 2.5 : 1),
                  boxShadow: current ? [BoxShadow(color: meta.color.withValues(alpha: 0.25), blurRadius: 10)] : null,
                ),
                child: Icon(meta.icon, size: current ? 20 : 18, color: active ? meta.color : AppTheme.textMuted),
              ),
              const SizedBox(height: 6),
              Text(
                meta.shortLabel,
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: active ? meta.color : AppTheme.textMuted),
                textAlign: TextAlign.center,
              ),
            ],
          );
        }),
      ),
    );
  }
}
