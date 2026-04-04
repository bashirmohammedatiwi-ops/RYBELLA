import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../core/config.dart';

class AppImage extends StatelessWidget {
  final String? url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Alignment alignment;

  const AppImage({
    super.key,
    this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.alignment = Alignment.center,
  });

  @override
  Widget build(BuildContext context) {
    final fullUrl = url != null && url!.isNotEmpty
        ? (url!.startsWith('http') ? url! : '${AppConfig.imgBase}$url')
        : null;
    if (fullUrl == null) {
      return Container(
        width: width,
        height: height,
        color: Colors.grey[200],
        child: const Icon(Icons.image_not_supported, color: Colors.grey),
      );
    }
    return CachedNetworkImage(
      imageUrl: fullUrl,
      width: width,
      height: height,
      fit: fit,
      alignment: alignment,
      placeholder: (_, __) => Container(
        width: width,
        height: height,
        color: Colors.grey[200],
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      errorWidget: (_, __, ___) => Container(
        width: width,
        height: height,
        color: Colors.grey[200],
        child: const Icon(Icons.broken_image, color: Colors.grey),
      ),
    );
  }
}
