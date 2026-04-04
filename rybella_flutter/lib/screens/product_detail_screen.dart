import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';

import '../core/app_animations.dart';
import '../core/config.dart';
import '../core/theme.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/recently_viewed_provider.dart';
import '../providers/wishlist_provider.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';
import '../widgets/product_fullscreen_gallery.dart';

/// ألوان وطبقات خاصة بصفحة المنتج (مظهر تحريري فاخر، فاتح)
class _PdPalette {
  static const Color canvasA = Color(0xFFFFFCFA);
  static const Color canvasB = Color(0xFFFFF5F0);
  static const Color canvasC = Color(0xFFF5EDF2);
  static const Color heroFrame = Color(0xFFFFFFFF);
  static const Color inkSoft = Color(0xFF2C2C30);
  static const Color lineHair = Color(0x1A000000);
  /// لوحة التدرجات — محايدة مع عمق خفيف
  static const Color shadePaper = Color(0xFFFAFAF8);
  static const Color shadePaperHi = Color(0xFFFDFCFB);
  static const Color shadeBorder = Color(0xFFE6E4E1);
  static const Color shadeRing = Color(0xFF2E2C2A);
  static const Color shadeMuted = Color(0xFF9E9A96);
  static const Color shadeChipBg = Color(0xFFF3F2F0);

  /// تدرّج خفيف داخل الدائرة (عمق بسيط)
  static LinearGradient shadeFaceGradient(Color base) {
    final light = Color.lerp(base, Colors.white, 0.22)!;
    final mid = base;
    final depth = Color.lerp(base, const Color(0xFF1A1A1C), 0.1)!;
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [light, mid, depth],
      stops: const [0.0, 0.45, 1.0],
    );
  }

  static const Color shadeNeutralHint = Color(0xFFD8D4D2);
}

/// خط للأرقام في صفحة المنتج — Outfit واضح ومتناسق مع العروض والأسعار
class _PdDigits {
  static TextStyle outfit({
    required double size,
    FontWeight weight = FontWeight.w600,
    Color? color,
    double? height,
    double? letterSpacing,
  }) {
    return GoogleFonts.outfit(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
      letterSpacing: letterSpacing,
    );
  }
}

class ProductDetailScreen extends StatefulWidget {
  final int productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  Product? _product;
  ProductVariant? _selectedVariant;
  int _qty = 1;
  int _galleryIndex = 0;
  bool _loading = true;
  final _pageController = PageController(viewportFraction: 0.86);
  final _thumbScrollController = ScrollController();

  @override
  void dispose() {
    _pageController.dispose();
    _thumbScrollController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final p = await ApiService.getProduct(widget.productId);
    if (p != null) {
      if (mounted) context.read<RecentlyViewedProvider>().add(widget.productId);
      setState(() {
        _product = p;
        if (p.variants.isNotEmpty) {
          ProductVariant? v;
          for (final x in p.variants) {
            if (x.inStock) {
              v = x;
              break;
            }
          }
          _selectedVariant = v ?? p.variants.first;
        } else {
          _selectedVariant = null;
        }
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  List<String> get _galleryUrls {
    if (_product == null) return [];
    final urls = <String>[];
    if (_product!.mainImage != null) urls.add(_product!.mainImage!);
    for (final v in _product!.variants) {
      if (v.image != null && !urls.contains(v.image)) urls.add(v.image!);
    }
    for (final u in _product!.images) {
      if (!urls.contains(u)) urls.add(u);
    }
    return urls.isEmpty ? [''] : urls;
  }

  List<String> get _displayUrls {
    final base = _galleryUrls;
    if (base.isEmpty) return [''];
    final variantImage = _selectedVariant?.image;
    if (variantImage != null && variantImage.isNotEmpty) {
      final rest = base.where((u) => u != variantImage).toList();
      return [variantImage, ...rest];
    }
    return base;
  }

  String _img(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${AppConfig.imgBase}$path';
  }

  void _openFullscreenGallery(BuildContext context) {
    final raw = _displayUrls.map(_img).where((u) => u.isNotEmpty).toList();
    if (raw.isEmpty) return;
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => ProductFullscreenGallery(
          imageUrls: raw,
          initialIndex: _galleryIndex.clamp(0, raw.length - 1),
        ),
      ),
    );
  }

  void _syncThumbs(int index) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_thumbScrollController.hasClients) return;
      final max = _thumbScrollController.position.maxScrollExtent;
      const itemExtent = 68.0;
      final w = MediaQuery.of(context).size.width;
      final target = (index * itemExtent) - w / 2 + 32;
      _thumbScrollController.animateTo(
        target.clamp(0.0, max),
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final wishlist = context.watch<WishlistProvider>();

    if (_loading) {
      return Scaffold(
        body: _PdLoadingShell(),
      );
    }
    if (_product == null) {
      return Scaffold(
        body: _PdBackground(
          child: SafeArea(
            child: Column(
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: _PdGlassIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      onTap: () => context.pop(),
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.inventory_2_outlined, size: 56, color: AppTheme.textMuted.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text(
                  'المنتج غير موجود',
                  style: GoogleFonts.cormorantGaramond(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const Spacer(flex: 2),
              ],
            ),
          ),
        ),
      );
    }

    final p = _product!;
    final price = _selectedVariant?.price ?? p.minPrice ?? 0.0;
    final inStock = _selectedVariant?.inStock ?? false;
    final lineTotal = price * _qty;
    final topPad = MediaQuery.of(context).padding.top;

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          _PdBackground(
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(child: SizedBox(height: topPad + 8)),
                SliverToBoxAdapter(
                  child: _PdHeroGallery(
                    displayUrls: _displayUrls,
                    galleryIndex: _galleryIndex,
                    pageController: _pageController,
                    thumbScrollController: _thumbScrollController,
                    img: _img,
                    onPageChanged: (i) {
                      setState(() => _galleryIndex = i);
                      _syncThumbs(i);
                    },
                    onOpenFullscreen: () => _openFullscreenGallery(context),
                    onVariantKey: _selectedVariant?.id ?? 0,
                  ),
                ),
                SliverToBoxAdapter(
                  child: _PdContentSheet(
                    product: p,
                    price: price,
                    inStock: inStock,
                    selectedVariant: _selectedVariant,
                    qty: _qty,
                    onQtyChange: (q) => setState(() => _qty = q),
                    onVariantSelect: (v) {
                      if (_selectedVariant?.id == v.id) return;
                      setState(() {
                        _selectedVariant = v;
                        _galleryIndex = 0;
                      });
                      _pageController.jumpToPage(0);
                    },
                    parseColor: _parseColor,
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(height: MediaQuery.of(context).padding.bottom + 120),
                ),
              ],
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _PdGlassIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      onTap: () => context.pop(),
                    ),
                    if (auth.isLoggedIn)
                      _PdGlassIconButton(
                        icon: wishlist.isInWishlist(p.id) ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        filled: wishlist.isInWishlist(p.id),
                        onTap: () {
                          HapticFeedback.lightImpact();
                          wishlist.toggle(p.id);
                        },
                      )
                    else
                      const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _PdCheckoutBar(
        inStock: inStock,
        hasVariant: _selectedVariant != null,
        qty: _qty,
        lineTotal: lineTotal,
        onAdd: () async {
          final ok = await cart.addItem(
            _selectedVariant!.id,
            _qty,
            productName: p.name,
            shadeName: _selectedVariant!.shadeName,
            unitPrice: _selectedVariant!.price,
            variantImage: _selectedVariant!.image,
            productImage: p.mainImage,
          );
          if (ok && context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'تمت الإضافة إلى السلة',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.98),
                        ),
                      ),
                    ),
                  ],
                ),
                backgroundColor: _PdPalette.inkSoft,
                behavior: SnackBarBehavior.floating,
                margin: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            );
          }
        },
      ),
    );
  }

  Color? _parseColor(String? code) {
    if (code == null || !code.startsWith('#')) return null;
    final hex = code.substring(1);
    if (hex.length == 6 || hex.length == 8) {
      return Color(int.parse('FF$hex', radix: 16));
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// خلفية
// ═══════════════════════════════════════════════════════════════════════════

class _PdBackground extends StatelessWidget {
  final Widget child;

  const _PdBackground({required this.child});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            _PdPalette.canvasA,
            _PdPalette.canvasB,
            _PdPalette.canvasC,
          ],
          stops: [0.0, 0.45, 1.0],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -120,
            right: -80,
            child: IgnorePointer(
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.primary.withValues(alpha: 0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 120,
            left: -60,
            child: IgnorePointer(
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFB794F6).withValues(alpha: 0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// تحميل
// ═══════════════════════════════════════════════════════════════════════════

class _PdLoadingShell extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return _PdBackground(
      child: Shimmer.fromColors(
        baseColor: Colors.white.withValues(alpha: 0.45),
        highlightColor: Colors.white.withValues(alpha: 0.95),
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, top + 60, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                height: 380,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              const SizedBox(height: 28),
              Container(height: 22, width: 140, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
              const SizedBox(height: 14),
              Container(height: 36, width: double.infinity, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10))),
              const SizedBox(height: 24),
              Container(height: 120, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20))),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// معرض
// ═══════════════════════════════════════════════════════════════════════════

class _PdHeroGallery extends StatelessWidget {
  final List<String> displayUrls;
  final int galleryIndex;
  final PageController pageController;
  final ScrollController thumbScrollController;
  final String Function(String?) img;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onOpenFullscreen;
  final int onVariantKey;

  const _PdHeroGallery({
    required this.displayUrls,
    required this.galleryIndex,
    required this.pageController,
    required this.thumbScrollController,
    required this.img,
    required this.onPageChanged,
    required this.onOpenFullscreen,
    required this.onVariantKey,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 420,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 380),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: ScaleTransition(
                scale: Tween<double>(begin: 0.96, end: 1).animate(animation),
                child: child,
              ),
            ),
            child: PageView.builder(
              key: ValueKey('hero-$onVariantKey'),
              controller: pageController,
              physics: const BouncingScrollPhysics(),
              itemCount: displayUrls.length,
              onPageChanged: onPageChanged,
              itemBuilder: (context, i) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _PdHeroSlide(
                    imageUrl: img(displayUrls[i]),
                    onTap: onOpenFullscreen,
                  ),
                );
              },
            ),
          ),
        ),
        if (displayUrls.length > 1) ...[
          const SizedBox(height: 14),
          SizedBox(
            height: 72,
            child: ListView.builder(
              controller: thumbScrollController,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 18),
              itemCount: displayUrls.length,
              itemBuilder: (context, i) {
                final sel = i == galleryIndex;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      pageController.animateToPage(
                        i,
                        duration: const Duration(milliseconds: 320),
                        curve: Curves.easeOutCubic,
                      );
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: 62,
                      height: 62,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: sel ? AppTheme.primary : Colors.white.withValues(alpha: 0.85),
                          width: sel ? 2.5 : 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: sel ? AppTheme.primary.withValues(alpha: 0.25) : Colors.black.withValues(alpha: 0.06),
                            blurRadius: sel ? 14 : 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            ColoredBox(
                              color: Colors.white,
                              child: AppImage(url: img(displayUrls[i]), fit: BoxFit.cover),
                            ),
                            if (sel)
                              DecoratedBox(
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (displayUrls.length > 1)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: _PdPalette.lineHair),
                  ),
                  child: Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: '${galleryIndex + 1}',
                          style: _PdDigits.outfit(
                            size: 12,
                            weight: FontWeight.w600,
                            color: AppTheme.textMuted,
                            letterSpacing: 0.4,
                          ),
                        ),
                        TextSpan(
                          text: ' / ',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textMuted,
                            letterSpacing: 0.4,
                          ),
                        ),
                        TextSpan(
                          text: '${displayUrls.length}',
                          style: _PdDigits.outfit(
                            size: 12,
                            weight: FontWeight.w600,
                            color: AppTheme.textMuted,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (displayUrls.length > 1) const SizedBox(width: 10),
              TextButton.icon(
                onPressed: onOpenFullscreen,
                icon: Icon(Icons.zoom_in_rounded, size: 18, color: AppTheme.primary.withValues(alpha: 0.9)),
                label: Text(
                  'عرض كامل',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primary,
                    fontSize: 13,
                  ),
                ),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                ),
              ),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(duration: 450.ms, curve: Curves.easeOut);
  }
}

class _PdHeroSlide extends StatelessWidget {
  final String imageUrl;
  final VoidCallback onTap;

  const _PdHeroSlide({required this.imageUrl, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(38),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white.withValues(alpha: 0.98),
              _PdPalette.heroFrame,
              AppTheme.pastelPink.withValues(alpha: 0.28),
              AppTheme.pastelLavender.withValues(alpha: 0.12),
            ],
            stops: const [0.0, 0.35, 0.72, 1.0],
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withValues(alpha: 0.06),
              blurRadius: 44,
              offset: const Offset(0, 20),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 28,
              offset: const Offset(0, 12),
            ),
          ],
          border: Border.all(color: Colors.white.withValues(alpha: 0.95)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(38),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.white.withValues(alpha: 0.15),
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.02),
                      ],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(28),
                child: AppImage(url: imageUrl, fit: BoxFit.contain),
              ),
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(26),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.28),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.touch_app_rounded, size: 15, color: Colors.white.withValues(alpha: 0.92)),
                            const SizedBox(width: 7),
                            Text(
                              'اضغط للتكبير',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.95),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// محتوى
// ═══════════════════════════════════════════════════════════════════════════

class _PdContentSheet extends StatelessWidget {
  final Product product;
  final double price;
  final bool inStock;
  final ProductVariant? selectedVariant;
  final int qty;
  final ValueChanged<int> onQtyChange;
  final void Function(ProductVariant) onVariantSelect;
  final Color? Function(String?) parseColor;

  const _PdContentSheet({
    required this.product,
    required this.price,
    required this.inStock,
    required this.selectedVariant,
    required this.qty,
    required this.onQtyChange,
    required this.onVariantSelect,
    required this.parseColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(10, 6, 10, 0),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.white.withValues(alpha: 0.97),
            const Color(0xFFFFFCFC),
          ],
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(38)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.04),
            blurRadius: 44,
            offset: const Offset(0, -10),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 32,
            offset: const Offset(0, -6),
          ),
        ],
        border: Border.all(color: Colors.white.withValues(alpha: 0.95)),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(38)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 20, 22, 34),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.textMuted.withValues(alpha: 0.12),
                        AppTheme.textMuted.withValues(alpha: 0.22),
                        AppTheme.textMuted.withValues(alpha: 0.12),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (product.brandName != null && product.brandName!.isNotEmpty)
                Text(
                  product.brandName!.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 3.2,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textMuted,
                  ),
                ),
              if (product.brandName != null && product.brandName!.isNotEmpty) const SizedBox(height: 10),
              Text(
                product.name,
                textAlign: TextAlign.center,
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 30,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                  color: _PdPalette.inkSoft,
                ),
              ),
              const SizedBox(height: 20),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                transitionBuilder: (c, a) => FadeTransition(opacity: a, child: c),
                child: Row(
                  key: ValueKey('price-$price-$inStock'),
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      price.toStringAsFixed(0),
                      style: _PdDigits.outfit(
                        size: 36,
                        weight: FontWeight.w700,
                        color: AppTheme.primary,
                        height: 1,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2, right: 4),
                      child: Text(
                        ' د.ع',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary.withValues(alpha: 0.85),
                        ),
                      ),
                    ),
                    if (!inStock) ...[
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'غير متوفر',
                          style: TextStyle(color: AppTheme.error, fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                      ),
                    ] else
                      Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppTheme.success.withValues(alpha: 0.12),
                              AppTheme.success.withValues(alpha: 0.06),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.success.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified_outlined, size: 15, color: AppTheme.success.withValues(alpha: 0.9)),
                            const SizedBox(width: 6),
                            Text(
                              'متوفر',
                              style: TextStyle(
                                color: AppTheme.success.withValues(alpha: 0.95),
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              if (product.variants.isNotEmpty) ...[
                const SizedBox(height: 26),
                _PdShadesPanel(
                  product: product,
                  selectedVariant: selectedVariant,
                  onVariantSelect: onVariantSelect,
                  parseColor: parseColor,
                ),
              ],
              if (product.description != null && product.description!.isNotEmpty) ...[
                const SizedBox(height: 28),
                _PdSectionTitle(icon: Icons.article_outlined, title: 'عن المنتج'),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                      colors: [
                        AppTheme.pastelPink.withValues(alpha: 0.28),
                        Colors.white,
                        AppTheme.pastelLavender.withValues(alpha: 0.16),
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppTheme.primary.withValues(alpha: 0.07)),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.03),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Text(
                    product.description!,
                    style: TextStyle(
                      fontSize: 15.5,
                      height: 1.78,
                      color: AppTheme.textSecondary.withValues(alpha: 0.95),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 28),
              _PdSectionTitle(icon: Icons.numbers_rounded, title: 'الكمية'),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _PdQtyStepper(
                      qty: qty,
                      onDec: () {
                        HapticFeedback.lightImpact();
                        onQtyChange((qty - 1).clamp(1, 999));
                      },
                      onInc: () {
                        HapticFeedback.lightImpact();
                        onQtyChange((qty + 1).clamp(1, 999));
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 80.ms);
  }
}

/// لوحة تدرجات — بسيطة مع طبقات خفيفة: تدرّج ورقي، عدّاد، عرض الدرجة مع لون
class _PdShadesPanel extends StatelessWidget {
  final Product product;
  final ProductVariant? selectedVariant;
  final void Function(ProductVariant) onVariantSelect;
  final Color? Function(String?) parseColor;

  const _PdShadesPanel({
    required this.product,
    required this.selectedVariant,
    required this.onVariantSelect,
    required this.parseColor,
  });

  @override
  Widget build(BuildContext context) {
    final n = product.variants.length;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            _PdPalette.shadePaperHi,
            _PdPalette.shadePaper,
          ],
        ),
        border: Border.all(color: _PdPalette.shadeBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'درجات اللون',
                      style: GoogleFonts.cormorantGaramond(
                        fontSize: 23,
                        fontWeight: FontWeight.w600,
                        color: _PdPalette.inkSoft,
                        height: 1.2,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      'اختر درجة واحدة',
                      style: TextStyle(
                        fontSize: 12,
                        height: 1.45,
                        color: _PdPalette.shadeMuted,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              if (n > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                  decoration: BoxDecoration(
                    color: _PdPalette.shadeChipBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: _PdPalette.shadeBorder),
                  ),
                  child: n == 1
                      ? Text(
                          'درجة واحدة',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _PdPalette.shadeMuted,
                            letterSpacing: 0.2,
                          ),
                        )
                      : Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: '$n ',
                                style: _PdDigits.outfit(
                                  size: 11,
                                  weight: FontWeight.w600,
                                  color: _PdPalette.shadeMuted,
                                  letterSpacing: 0.2,
                                ),
                              ),
                              TextSpan(
                                text: 'درجات',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: _PdPalette.shadeMuted,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
            ],
          ),
          Container(
            height: 1,
            margin: const EdgeInsets.only(top: 18, bottom: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  _PdPalette.shadeBorder.withValues(alpha: 0.85),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          if (selectedVariant != null)
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 280),
              switchInCurve: Curves.easeOutCubic,
              transitionBuilder: (child, anim) {
                return FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero).animate(
                      CurvedAnimation(parent: anim, curve: Curves.easeOutCubic),
                    ),
                    child: child,
                  ),
                );
              },
              child: Padding(
                key: ValueKey(selectedVariant!.id),
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      margin: const EdgeInsets.only(top: 4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: _PdPalette.shadeFaceGradient(
                          parseColor(selectedVariant!.colorCode) ?? _PdPalette.shadeNeutralHint,
                        ),
                        border: Border.all(color: _PdPalette.shadeBorder, width: 1),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'الدرجة',
                            style: TextStyle(
                              fontSize: 10,
                              letterSpacing: 1.8,
                              fontWeight: FontWeight.w500,
                              color: _PdPalette.shadeMuted,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            selectedVariant!.shadeName,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.cormorantGaramond(
                              fontSize: 21,
                              fontWeight: FontWeight.w600,
                              color: _PdPalette.inkSoft,
                              height: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          SizedBox(
            height: 74,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 2),
              itemCount: product.variants.length,
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                final v = product.variants[i];
                final active = selectedVariant?.id == v.id;
                final col = parseColor(v.colorCode);
                return Center(
                  child: ScaleOnTap(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onVariantSelect(v);
                    },
                    child: _PdShadeSwatch(
                      color: col,
                      active: active,
                      inStock: v.inStock,
                      label: v.shadeName,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 420.ms, curve: Curves.easeOut).slideY(begin: 0.03, end: 0, duration: 420.ms, curve: Curves.easeOutCubic);
  }
}

/// عينة دائرية — لمعة علوية خفيفة، حلقة داكنة + حافة بيضاء عند التحديد
class _PdShadeSwatch extends StatelessWidget {
  final Color? color;
  final bool active;
  final bool inStock;
  final String label;

  const _PdShadeSwatch({
    required this.color,
    required this.active,
    required this.inStock,
    required this.label,
  });

  static const double _d = 48;

  @override
  Widget build(BuildContext context) {
    final base = color ?? _PdPalette.shadeNeutralHint;
    final inner = Container(
      width: _d,
      height: _d,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: _PdPalette.shadeFaceGradient(base),
        border: Border.all(
          color: active ? Colors.white : _PdPalette.shadeBorder,
          width: active ? 2 : 1,
        ),
      ),
      child: ClipOval(
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.white.withValues(alpha: 0.22),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.45],
                    ),
                  ),
                ),
              ),
            ),
            if (!inStock)
              ColoredBox(
                color: Colors.white.withValues(alpha: 0.52),
                child: Center(
                  child: Icon(
                    Icons.remove_rounded,
                    size: 22,
                    color: _PdPalette.shadeMuted.withValues(alpha: 0.55),
                  ),
                ),
              ),
            if (active && inStock)
              Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _PdPalette.shadeRing,
                      border: Border.all(color: Colors.white, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 3,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );

    return Semantics(
      button: true,
      label: label,
      selected: active,
      enabled: inStock,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.all(active ? 3.5 : 0),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: active ? Border.all(color: _PdPalette.shadeRing, width: 2) : null,
          boxShadow: active
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.09),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: inner,
      ),
    );
  }
}

class _PdSectionTitle extends StatelessWidget {
  final IconData icon;
  final String title;

  const _PdSectionTitle({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: LinearGradient(
              colors: [
                AppTheme.primary.withValues(alpha: 0.09),
                AppTheme.pastelPink.withValues(alpha: 0.35),
              ],
            ),
            border: Border.all(color: AppTheme.primary.withValues(alpha: 0.07)),
          ),
          child: Icon(icon, size: 19, color: AppTheme.primary.withValues(alpha: 0.9)),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: GoogleFonts.cormorantGaramond(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: _PdPalette.inkSoft,
            letterSpacing: 0.2,
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsetsDirectional.only(start: 14),
            child: Divider(color: AppTheme.textMuted.withValues(alpha: 0.12), height: 1, thickness: 0.8),
          ),
        ),
      ],
    );
  }
}

class _PdQtyStepper extends StatelessWidget {
  final int qty;
  final VoidCallback onDec;
  final VoidCallback onInc;

  const _PdQtyStepper({
    required this.qty,
    required this.onDec,
    required this.onInc,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _PdRoundIconBtn(icon: Icons.remove_rounded, onTap: onDec),
          Container(
            constraints: const BoxConstraints(minWidth: 48),
            alignment: Alignment.center,
            child: Text(
              '$qty',
              style: _PdDigits.outfit(
                size: 19,
                weight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          _PdRoundIconBtn(icon: Icons.add_rounded, onTap: onInc),
        ],
      ),
    );
  }
}

class _PdRoundIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _PdRoundIconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Icon(icon, size: 22, color: AppTheme.primary),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// شريط علوي / سفلي
// ═══════════════════════════════════════════════════════════════════════════

class _PdGlassIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool filled;

  const _PdGlassIconButton({
    required this.icon,
    required this.onTap,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Material(
          color: Colors.white.withValues(alpha: 0.72),
          child: InkWell(
            onTap: onTap,
            child: Container(
              width: 48,
              height: 48,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white.withValues(alpha: 0.95)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                icon,
                size: 22,
                color: filled ? AppTheme.primary : AppTheme.textPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PdCheckoutBar extends StatelessWidget {
  final bool inStock;
  final bool hasVariant;
  final int qty;
  final double lineTotal;
  final Future<void> Function() onAdd;

  const _PdCheckoutBar({
    required this.inStock,
    required this.hasVariant,
    required this.qty,
    required this.lineTotal,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    final canAdd = inStock && hasVariant;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          padding: EdgeInsets.fromLTRB(20, 14, 20, bottom + 16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.88),
            border: Border(
              top: BorderSide(color: Colors.white.withValues(alpha: 0.95)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 24,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      qty > 1
                          ? Text.rich(
                              TextSpan(
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textMuted,
                                ),
                                children: [
                                  const TextSpan(text: 'الإجمالي ('),
                                  TextSpan(
                                    text: '$qty',
                                    style: _PdDigits.outfit(
                                      size: 12,
                                      weight: FontWeight.w700,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                  const TextSpan(text: ')'),
                                ],
                              ),
                            )
                          : Text(
                              'السعر',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textMuted,
                              ),
                            ),
                      const SizedBox(height: 2),
                      Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: lineTotal.toStringAsFixed(0),
                              style: _PdDigits.outfit(
                                size: 26,
                                weight: FontWeight.w700,
                                color: _PdPalette.inkSoft,
                                height: 1,
                              ),
                            ),
                            TextSpan(
                              text: ' د.ع',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                                color: _PdPalette.inkSoft.withValues(alpha: 0.88),
                                height: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ScaleOnTap(
                    onTap: canAdd ? () => onAdd() : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      height: 54,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        gradient: canAdd
                            ? const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [AppTheme.primary, AppTheme.primaryDark],
                              )
                            : null,
                        color: canAdd ? null : AppTheme.textMuted.withValues(alpha: 0.22),
                        boxShadow: canAdd
                            ? [
                                BoxShadow(
                                  color: AppTheme.primary.withValues(alpha: 0.35),
                                  blurRadius: 18,
                                  offset: const Offset(0, 8),
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.shopping_bag_outlined,
                            color: canAdd ? Colors.white : Colors.white70,
                            size: 22,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            inStock ? 'أضف للسلة' : 'غير متوفر',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: canAdd ? Colors.white : Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
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
