import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../models/product.dart';
import 'app_image.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final bool inWishlist;
  final VoidCallback? onWishlistTap;
  final VoidCallback? onTap;
  final VoidCallback? onQuickView;
  final int? colorIndex;

  const ProductCard({
    super.key,
    required this.product,
    this.inWishlist = false,
    this.onWishlistTap,
    this.onTap,
    this.onQuickView,
    this.colorIndex,
  });

  bool get _isOutOfStock =>
      product.variants.isEmpty || product.variants.every((v) => v.stock <= 0);

  Color? _parseColor(String? code) {
    if (code == null || !code.startsWith('#')) return null;
    final hex = code.substring(1);
    if (hex.length == 6 || hex.length == 8) {
      return Color(int.parse('FF$hex', radix: 16));
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final price = product.minPrice != null
        ? '${product.minPrice!.toStringAsFixed(0)} د.ع'
        : '—';
    String? imgUrl = product.mainImage;
    if (imgUrl == null && product.variants.isNotEmpty) {
      final v = product.variants.firstWhere(
          (x) => x.image != null, orElse: () => product.variants.first);
      imgUrl = v.image;
    }
    imgUrl ??= product.images.isNotEmpty ? product.images.first : null;
    final imgFull = imgUrl != null && !imgUrl.startsWith('http')
        ? '${AppConfig.imgBase}$imgUrl'
        : imgUrl ?? '';

    // ألوان من المتغيرات للمعاينة: أول 4 + عدد الباقي
    final allColorVariants = product.variants
        .where((v) => v.colorCode != null && v.colorCode!.isNotEmpty)
        .toList();
    final totalShades = allColorVariants.length;
    final displayedColors = allColorVariants
        .take(4)
        .map((v) => _parseColor(v.colorCode))
        .whereType<Color>()
        .toList();
    final remainingCount = totalShades > 4 ? totalShades - 4 : 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
            BoxShadow(
              color: AppTheme.primary.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ─── منطقة الصورة ───
            Expanded(
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    margin: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.pastelPink.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppImage(url: imgFull, fit: BoxFit.contain),
                      ),
                    ),
                  ),
                  // شارات
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (product.isFeatured)
                          _MiniBadge(label: 'مميز', color: AppTheme.primary),
                        if (product.isFeatured && product.isBestSeller)
                          const SizedBox(height: 4),
                        if (product.isBestSeller)
                          _MiniBadge(
                              label: 'الأكثر مبيعاً',
                              color: const Color(0xFFB8860B)),
                      ],
                    ),
                  ),
                  // زر المفضلة
                  if (onWishlistTap != null)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Material(
                        color: Colors.white.withOpacity(0.95),
                        shape: const CircleBorder(),
                        elevation: 0,
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            onWishlistTap!();
                          },
                          customBorder: const CircleBorder(),
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Icon(
                              inWishlist
                                  ? Icons.favorite_rounded
                                  : Icons.favorite_border_rounded,
                              color: inWishlist
                                  ? AppTheme.primary
                                  : AppTheme.textMuted,
                              size: 18,
                            ),
                          ),
                        ),
                      ),
                    ),
                  // نفذت الكمية
                  if (_isOutOfStock)
                    Positioned(
                      left: 10,
                      right: 10,
                      bottom: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Text(
                            'نفذت الكمية',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // ─── معلومات المنتج ───
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (product.brandName != null &&
                      product.brandName!.isNotEmpty) ...[
                    Text(
                      product.brandName!,
                      style: TextStyle(
                        fontSize: 9,
                        color: AppTheme.textMuted,
                        letterSpacing: 1,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                  ],
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cormorantGaramond(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Flexible(
                        child: Text(
                          price,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (displayedColors.isNotEmpty || remainingCount > 0)
                        Flexible(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ...displayedColors.map(
                                  (c) => Container(
                                    width: 12,
                                    height: 12,
                                    margin: const EdgeInsets.only(left: 3),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: c,
                                      border: Border.all(
                                          color: Colors.white, width: 1.2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.08),
                                          blurRadius: 3,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                if (remainingCount > 0)
                                  Container(
                                    margin: const EdgeInsets.only(left: 4),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 4, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: AppTheme.pastelPink.withOpacity(0.5),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: AppTheme.primary.withOpacity(0.25),
                                        width: 1,
                                      ),
                                    ),
                                    child: Text(
                                      '+$remainingCount',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _MiniBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.35),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
