import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../core/config.dart';
import '../core/theme.dart';

/// عرض صورة المنتج بحجم كبير مع تكبير/تصغير
void showProductImageViewer(
  BuildContext context, {
  required String? imagePath,
  String? title,
  String? subtitle,
}) {
  if (imagePath == null || imagePath.isEmpty) return;
  final url = '${AppConfig.imgBase}$imagePath';

  Navigator.of(context).push(
    PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black87,
      transitionDuration: const Duration(milliseconds: 280),
      reverseTransitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (_, __, ___) => _ProductImageViewerPage(
        imageUrl: url,
        title: title,
        subtitle: subtitle,
      ),
      transitionsBuilder: (_, anim, __, child) => FadeTransition(opacity: anim, child: child),
    ),
  );
}

class _ProductImageViewerPage extends StatelessWidget {
  final String imageUrl;
  final String? title;
  final String? subtitle;

  const _ProductImageViewerPage({
    required this.imageUrl,
    this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          InteractiveViewer(
            minScale: 0.5,
            maxScale: 4,
            child: Center(
              child: Hero(
                tag: imageUrl,
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  fit: BoxFit.contain,
                  placeholder: (_, __) => const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  ),
                  errorWidget: (_, __, ___) => const Icon(
                    Icons.broken_image_outlined,
                    color: Colors.white54,
                    size: 64,
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                child: Row(
                  children: [
                    IconButton.filled(
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.pinch_outlined, color: Colors.white70, size: 16),
                          SizedBox(width: 6),
                          Text('قرّب للتكبير', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (title != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [Colors.black.withValues(alpha: 0.85), Colors.transparent],
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title!,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(subtitle!, style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600)),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// صورة مصغّرة قابلة للنقر مع أيقونة تكبير
class ProductThumbnail extends StatelessWidget {
  final String? imagePath;
  final double size;
  final double radius;
  final VoidCallback? onTap;
  final bool showZoomHint;
  final Color placeholderColor;

  const ProductThumbnail({
    super.key,
    required this.imagePath,
    this.size = 72,
    this.radius = 16,
    this.onTap,
    this.showZoomHint = true,
    this.placeholderColor = AppTheme.productSoft,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = imagePath != null && imagePath!.isNotEmpty;
    final url = hasImage ? '${AppConfig.imgBase}$imagePath' : null;

    Widget image;
    if (hasImage) {
      image = Hero(
        tag: url!,
        child: CachedNetworkImage(
          imageUrl: url,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (_, __) => _placeholder(),
          errorWidget: (_, __, ___) => _placeholder(icon: Icons.broken_image_outlined),
        ),
      );
    } else {
      image = _placeholder();
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: hasImage
            ? (onTap ?? () => showProductImageViewer(context, imagePath: imagePath))
            : null,
        borderRadius: BorderRadius.circular(radius),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(radius),
              child: SizedBox(width: size, height: size, child: image),
            ),
            if (showZoomHint && hasImage)
              Positioned(
                bottom: 4,
                left: 4,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.zoom_in_rounded, color: Colors.white, size: 14),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder({IconData icon = Icons.image_outlined}) {
    return Container(
      width: size,
      height: size,
      color: placeholderColor,
      child: Icon(icon, color: AppTheme.textMuted, size: size * 0.38),
    );
  }
}
