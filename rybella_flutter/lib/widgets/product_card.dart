import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../models/product.dart';
import 'app_image.dart';

class ProductCard extends StatefulWidget {
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

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  bool _pressed = false;

  bool get _isOutOfStock =>
      widget.product.variants.isEmpty ||
      widget.product.variants.every((v) => v.stock <= 0);

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
    final product = widget.product;
    final priceStr = product.minPrice?.toStringAsFixed(0);

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

    final allColorVariants = product.variants
        .where((v) => v.colorCode != null && v.colorCode!.isNotEmpty)
        .toList();
    final displayedColors = allColorVariants
        .take(4)
        .map((v) => _parseColor(v.colorCode))
        .whereType<Color>()
        .toList();
    final nShades = allColorVariants.length;
    final remainingCount = nShades > 4 ? nShades - 4 : 0;

    return AnimatedScale(
      scale: _pressed ? 0.985 : 1,
      duration: const Duration(milliseconds: 110),
      curve: Curves.easeOutCubic,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(24),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: widget.onTap,
          onTapDown: (_) => setState(() => _pressed = true),
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFFFFFFF),
                  Color(0xFFFFFBFD),
                  Color(0xFFFFF8FA),
                ],
                stops: [0.0, 0.45, 1.0],
              ),
              border: Border.all(
                color: AppTheme.primary.withValues(alpha: 0.1),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.07),
                  blurRadius: 26,
                  offset: const Offset(0, 10),
                  spreadRadius: -3,
                ),
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 5),
                ),
                BoxShadow(
                  color: Colors.white.withValues(alpha: 0.9),
                  blurRadius: 0,
                  offset: const Offset(0, -1),
                  spreadRadius: 0,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  flex: 5,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(10, 10, 10, 0),
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(20),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Colors.white,
                                AppTheme.pastelPink.withValues(alpha: 0.48),
                                AppTheme.pastelLavender.withValues(alpha: 0.16),
                              ],
                              stops: const [0.0, 0.5, 1.0],
                            ),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.98),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withValues(alpha: 0.06),
                                blurRadius: 14,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(18.5),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.all(11),
                                  child: AppImage(
                                    url: imgFull,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                                Positioned.fill(
                                  child: IgnorePointer(
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            Colors.white.withValues(alpha: 0.2),
                                            Colors.transparent,
                                            Colors.black.withValues(alpha: 0.03),
                                          ],
                                          stops: const [0.0, 0.45, 1.0],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 14,
                        right: 14,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (product.isFeatured)
                              _MiniBadge(
                                label: 'مميز',
                                color: AppTheme.primary,
                                icon: Icons.auto_awesome_rounded,
                              ),
                            if (product.isFeatured && product.isBestSeller)
                              const SizedBox(height: 5),
                            if (product.isBestSeller)
                              _MiniBadge(
                                label: 'الأكثر مبيعاً',
                                color: const Color(0xFFC9A227),
                                icon: Icons.trending_up_rounded,
                              ),
                          ],
                        ),
                      ),
                      if (widget.onWishlistTap != null)
                        Positioned(
                          top: 14,
                          left: 14,
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              widget.onWishlistTap!();
                            },
                            behavior: HitTestBehavior.opaque,
                            child: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.96),
                                border: Border.all(
                                  color: AppTheme.border.withValues(alpha: 0.65),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.07),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(8),
                              child: Icon(
                                widget.inWishlist
                                    ? Icons.favorite_rounded
                                    : Icons.favorite_border_rounded,
                                color: widget.inWishlist
                                    ? AppTheme.primary
                                    : AppTheme.textMuted,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      if (_isOutOfStock)
                        Positioned(
                          left: 14,
                          right: 14,
                          bottom: 14,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.black.withValues(alpha: 0.55),
                                    Colors.black.withValues(alpha: 0.65),
                                  ],
                                ),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.2),
                                ),
                              ),
                              child: const Center(
                                child: Text(
                                  'نفذت الكمية',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        AppTheme.primary.withValues(alpha: 0.12),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        AppTheme.pastelPink.withValues(alpha: 0.06),
                        Colors.white.withValues(alpha: 0.4),
                      ],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (product.brandName != null &&
                          product.brandName!.isNotEmpty) ...[
                        Text(
                          product.brandName!.toUpperCase(),
                          style: TextStyle(
                            fontSize: 8.5,
                            color: AppTheme.textMuted,
                            letterSpacing: 1.4,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                      ],
                      Text(
                        product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.cormorantGaramond(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Flexible(
                            child: priceStr != null
                                ? Text.rich(
                                    TextSpan(
                                      children: [
                                        TextSpan(
                                          text: priceStr,
                                          style: GoogleFonts.outfit(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.primary,
                                            height: 1,
                                            letterSpacing: -0.2,
                                          ),
                                        ),
                                        TextSpan(
                                          text: ' د.ع',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: AppTheme.primary.withValues(alpha: 0.88),
                                          ),
                                        ),
                                      ],
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  )
                                : Text(
                                    '—',
                                    style: GoogleFonts.outfit(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textMuted,
                                    ),
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
                                        width: 13,
                                        height: 13,
                                        margin: const EdgeInsets.only(left: 3),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: c,
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 1.5,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.12),
                                              blurRadius: 4,
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
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              AppTheme.pastelPink.withValues(alpha: 0.65),
                                              AppTheme.pastelPink.withValues(alpha: 0.35),
                                            ],
                                          ),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(
                                            color: AppTheme.primary.withValues(alpha: 0.22),
                                            width: 1,
                                          ),
                                        ),
                                        child: Text(
                                          '+$remainingCount',
                                          style: GoogleFonts.outfit(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
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
        ),
      ),
    );
  }
}

class _MiniBadge extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;

  const _MiniBadge({
    required this.label,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color,
            Color.lerp(color, Colors.black, 0.08)!,
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.45),
          width: 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.4),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: Colors.white.withValues(alpha: 0.95)),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.15,
            ),
          ),
        ],
      ),
    );
  }
}
