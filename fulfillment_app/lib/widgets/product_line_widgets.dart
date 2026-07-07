import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/order.dart';
import '../utils/format.dart';
import 'product_image_viewer.dart';

/// شارة نوع العنصر
class ItemTypeBadge extends StatelessWidget {
  final bool isBundle;
  final bool compact;

  const ItemTypeBadge({super.key, required this.isBundle, this.compact = false});

  @override
  Widget build(BuildContext context) {
    if (isBundle) {
      return Container(
        padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 10, vertical: compact ? 4 : 5),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [AppTheme.bundle, AppTheme.bundleDark]),
          borderRadius: BorderRadius.circular(999),
          boxShadow: [BoxShadow(color: AppTheme.bundle.withValues(alpha: 0.3), blurRadius: 6, offset: const Offset(0, 2))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.card_giftcard_rounded, size: compact ? 12 : 13, color: Colors.white),
            const SizedBox(width: 4),
            Text('بكج عرض', style: TextStyle(color: Colors.white, fontSize: compact ? 10 : 11, fontWeight: FontWeight.w900)),
          ],
        ),
      );
    }
    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 10, vertical: compact ? 4 : 5),
      decoration: BoxDecoration(
        color: AppTheme.productSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.product.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.shopping_bag_outlined, size: compact ? 12 : 13, color: AppTheme.product),
          const SizedBox(width: 4),
          Text('منتج', style: TextStyle(color: AppTheme.product, fontSize: compact ? 10 : 11, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

/// بطاقة منتج عادي
class ProductLineCard extends StatelessWidget {
  final OrderLine item;
  final String label;

  const ProductLineCard({super.key, required this.item, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.product.withValues(alpha: 0.12)),
        boxShadow: const [AppTheme.cardShadowSoft],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ProductThumbnail(
              imagePath: item.image,
              size: 80,
              radius: 14,
              onTap: () => showProductImageViewer(
                context,
                imagePath: item.image,
                title: label,
                subtitle: item.shadeName,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ItemTypeBadge(isBundle: false, compact: true),
                  const SizedBox(height: 8),
                  Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppTheme.textPrimary, height: 1.3)),
                  if (item.shadeName != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: AppTheme.primarySoft,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.border),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(item.shadeName!, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ],
                  if (item.barcode != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceAlt,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.qr_code_rounded, size: 14, color: AppTheme.textMuted),
                          const SizedBox(width: 4),
                          Text(item.barcode!, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, fontFamily: 'monospace')),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppTheme.primarySoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text('×${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.primaryDark)),
                ),
                const SizedBox(height: 8),
                Text(formatMoney(item.price), style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                Text(formatMoney(item.subtotal), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppTheme.textPrimary)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// بطاقة بكج عرض — تصميم مميز بالكامل
class BundleOfferCard extends StatelessWidget {
  final OrderBundle bundle;

  const BundleOfferCard({super.key, required this.bundle});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        gradient: AppTheme.bundleGradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.bundle.withValues(alpha: 0.35), width: 1.5),
        boxShadow: [BoxShadow(color: AppTheme.bundle.withValues(alpha: 0.12), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // رأس البكج
          Container(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: AppTheme.bundle.withValues(alpha: 0.15))),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppTheme.bundle, AppTheme.bundleDark]),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [BoxShadow(color: AppTheme.bundle.withValues(alpha: 0.35), blurRadius: 8)],
                  ),
                  child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const ItemTypeBadge(isBundle: true, compact: true),
                      const SizedBox(height: 6),
                      Text(bundle.offerTitle, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.textPrimary, height: 1.3)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.bundle.withValues(alpha: 0.2)),
                      ),
                      child: Text('×${bundle.quantity}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppTheme.bundleDark)),
                    ),
                    const SizedBox(height: 6),
                    Text(formatMoney(bundle.totalPrice), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppTheme.bundleDark)),
                  ],
                ),
              ],
            ),
          ),
          // منتجات داخل البكج
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(Icons.inventory_2_outlined, size: 14, color: AppTheme.bundle.withValues(alpha: 0.8)),
                    const SizedBox(width: 6),
                    Text(
                      '${bundle.items.length} منتج داخل البكج',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.bundle.withValues(alpha: 0.9)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ...bundle.items.map((item) => _BundleInnerItem(
                      item: item,
                      offerTitle: bundle.offerTitle,
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BundleInnerItem extends StatelessWidget {
  final OrderLine item;
  final String offerTitle;

  const _BundleInnerItem({required this.item, required this.offerTitle});

  @override
  Widget build(BuildContext context) {
    final label = item.productName ?? offerTitle;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.bundle.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          ProductThumbnail(
            imagePath: item.image,
            size: 56,
            radius: 12,
            placeholderColor: AppTheme.bundleSoft,
            onTap: () => showProductImageViewer(
              context,
              imagePath: item.image,
              title: label,
              subtitle: 'داخل بكج: $offerTitle',
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                if (item.shadeName != null)
                  Text(item.shadeName!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          Text('×${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.bundleDark)),
        ],
      ),
    );
  }
}

/// قائمة عناصر الطلب مع فصل واضح بين المنتجات والبكجات
class OrderItemsSection extends StatelessWidget {
  final FulfillmentOrder order;

  const OrderItemsSection({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final hasProducts = order.items.isNotEmpty;
    final hasBundles = order.bundles.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (hasProducts) ...[
          _SectionLabel(
            icon: Icons.shopping_bag_rounded,
            label: 'منتجات عادية',
            count: order.items.length,
            color: AppTheme.product,
            bg: AppTheme.productSoft,
          ),
          const SizedBox(height: 10),
          ...order.items.map((item) => ProductLineCard(item: item, label: item.productName ?? 'منتج')),
        ],
        if (hasProducts && hasBundles) const SizedBox(height: 6),
        if (hasBundles) ...[
          _SectionLabel(
            icon: Icons.card_giftcard_rounded,
            label: 'بكجات العروض',
            count: order.bundles.length,
            color: AppTheme.bundle,
            bg: AppTheme.bundleSoft,
          ),
          const SizedBox(height: 10),
          ...order.bundles.map((b) => BundleOfferCard(bundle: b)),
        ],
        if (!hasProducts && !hasBundles)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text('لا توجد عناصر في هذا الطلب', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
            ),
          ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final Color color;
  final Color bg;

  const _SectionLabel({
    required this.icon,
    required this.label,
    required this.count,
    required this.color,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 10),
        Text(label, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: color)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
          child: Text('$count', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: color)),
        ),
      ],
    );
  }
}
