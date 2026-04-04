import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';

/// عرض صور المنتج بملء الشاشة مع تكبير/تصغير وأسحاب بين الصور.
class ProductFullscreenGallery extends StatefulWidget {
  final List<String> imageUrls;
  final int initialIndex;

  const ProductFullscreenGallery({
    super.key,
    required this.imageUrls,
    this.initialIndex = 0,
  });

  @override
  State<ProductFullscreenGallery> createState() => _ProductFullscreenGalleryState();
}

class _ProductFullscreenGalleryState extends State<ProductFullscreenGallery> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    final n = widget.imageUrls.length;
    final start = n == 0 ? 0 : widget.initialIndex.clamp(0, n - 1);
    _currentIndex = start;
    _pageController = PageController(initialPage: start);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final urls = widget.imageUrls;
    if (urls.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close_rounded, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: const Center(
          child: Text('لا توجد صور', style: TextStyle(color: Colors.white54, fontSize: 16)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          PhotoViewGallery.builder(
            scrollPhysics: const BouncingScrollPhysics(),
            pageController: _pageController,
            itemCount: urls.length,
            onPageChanged: (i) => setState(() => _currentIndex = i),
            wantKeepAlive: true,
            loadingBuilder: (context, event) {
              if (event == null) {
                return const Center(
                  child: SizedBox(
                    width: 36,
                    height: 36,
                    child: CircularProgressIndicator(
                      color: Colors.white38,
                      strokeWidth: 2.5,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                );
              }
              final total = event.expectedTotalBytes;
              final progress = total == null || total == 0
                  ? null
                  : event.cumulativeBytesLoaded / total;
              return Center(
                child: SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    value: progress,
                    color: Colors.white54,
                    strokeWidth: 2.5,
                    strokeCap: StrokeCap.round,
                  ),
                ),
              );
            },
            builder: (context, index) {
              final url = urls[index];
              if (url.isEmpty) {
                return PhotoViewGalleryPageOptions.customChild(
                  minScale: PhotoViewComputedScale.contained,
                  maxScale: PhotoViewComputedScale.covered * 2,
                  child: const Center(
                    child: Icon(Icons.image_not_supported_outlined, color: Colors.white24, size: 72),
                  ),
                );
              }
              return PhotoViewGalleryPageOptions(
                imageProvider: CachedNetworkImageProvider(url),
                minScale: PhotoViewComputedScale.contained * 0.92,
                maxScale: PhotoViewComputedScale.covered * 3.5,
                initialScale: PhotoViewComputedScale.contained,
                filterQuality: FilterQuality.high,
              );
            },
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Material(
                    color: Colors.black.withValues(alpha: 0.45),
                    shape: const CircleBorder(),
                    clipBehavior: Clip.antiAlias,
                    child: IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white, size: 26),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  if (urls.length > 1)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Text(
                        '${_currentIndex + 1} / ${urls.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          letterSpacing: 0.4,
                        ),
                      ),
                    )
                  else
                    const SizedBox(width: 48),
                  const SizedBox(width: 48),
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.of(context).padding.bottom + 16,
            child: IgnorePointer(
              child: Text(
                'قرّب بإصبعين • اسحب للتنقل',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
