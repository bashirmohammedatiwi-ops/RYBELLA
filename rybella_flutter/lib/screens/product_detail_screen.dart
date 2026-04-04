import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../core/app_animations.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../providers/recently_viewed_provider.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';

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
  final _pageController = PageController(viewportFraction: 0.92);

  @override
  void dispose() {
    _pageController.dispose();
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

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final wishlist = context.watch<WishlistProvider>();

    if (_loading) {
      return Scaffold(
        backgroundColor: const Color(0xFFFAF8F9),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(
                  color: AppTheme.primary,
                  strokeWidth: 2.5,
                  strokeCap: StrokeCap.round,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'جاري التحميل',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 15),
              ),
            ],
          ),
        ),
      );
    }
    if (_product == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFFAF8F9),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Text(
            'المنتج غير موجود',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
          ),
        ),
      );
    }

    final p = _product!;
    final price = _selectedVariant?.price ?? p.minPrice ?? 0.0;
    final inStock = _selectedVariant?.inStock ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F9),
      body: Stack(
        children: [
          // ─── محتوى قابل للتمرير (الصورة تتحرك مع الصفحة) ───
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // مساحة للهيدر
              SliverToBoxAdapter(
                child: SizedBox(height: MediaQuery.of(context).padding.top + 70),
              ),
              // ─── معرض الصور ───
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 340,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 350),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      transitionBuilder: (child, animation) => FadeTransition(
                        opacity: animation,
                        child: ScaleTransition(
                          scale: Tween<double>(begin: 0.97, end: 1).animate(animation),
                          child: child,
                        ),
                      ),
                      child: PageView.builder(
                        key: ValueKey('gallery-${_selectedVariant?.id ?? 0}'),
                        controller: _pageController,
                        physics: const BouncingScrollPhysics(),
                        itemCount: _displayUrls.length,
                        onPageChanged: (i) => setState(() => _galleryIndex = i),
                        itemBuilder: (_, i) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppTheme.pastelPink.withOpacity(0.35),
                                Colors.white,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.08),
                                blurRadius: 24,
                                offset: const Offset(0, 8),
                              ),
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: AppImage(url: _img(_displayUrls[i]), fit: BoxFit.contain),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              if (_displayUrls.length > 1)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 14, bottom: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _displayUrls.length,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 280),
                          curve: Curves.easeOutCubic,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: i == _galleryIndex ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            gradient: i == _galleryIndex
                                ? const LinearGradient(
                                    colors: [AppTheme.primary, AppTheme.primaryDark],
                                  )
                                : null,
                            color: i == _galleryIndex ? null : AppTheme.textMuted.withOpacity(0.25),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              // ─── المحتوى ───
              SliverToBoxAdapter(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x0A000000),
                        blurRadius: 24,
                        offset: Offset(0, -6),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 140),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (p.brandName != null && p.brandName!.isNotEmpty) ...[
                        Text(
                          p.brandName!.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.textMuted,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                      ],
                      Text(
                        p.name,
                        style: GoogleFonts.cormorantGaramond(
                          fontSize: 24,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 12),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        transitionBuilder: (child, animation) => FadeTransition(
                          opacity: animation,
                          child: child,
                        ),
                        child: Row(
                          key: ValueKey('price-$price'),
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${price.toStringAsFixed(0)} د.ع',
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ),
                            if (!inStock) ...[
                              const SizedBox(width: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppTheme.error.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'غير متوفر',
                                  style: TextStyle(fontSize: 13, color: AppTheme.error, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ],
                      ),
                    ),
                      if (p.variants.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Icon(Icons.palette_outlined, size: 18, color: AppTheme.primary),
                            const SizedBox(width: 8),
                            Text(
                              'تدرجات اللون',
                              style: GoogleFonts.cormorantGaramond(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          height: 72,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            itemCount: p.variants.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemBuilder: (_, i) {
                              final v = p.variants[i];
                              final isActive = _selectedVariant?.id == v.id;
                              final color = _parseColor(v.colorCode);
                              return ScaleOnTap(
                                onTap: () {
                                  if (_selectedVariant?.id == v.id) return;
                                  setState(() {
                                    _selectedVariant = v;
                                    _galleryIndex = 0;
                                  });
                                  _pageController.jumpToPage(0);
                                },
                                child: _ColorChip(
                                  color: color,
                                  label: v.shadeName,
                                  isActive: isActive,
                                  inStock: v.inStock,
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                      if (p.description != null && p.description!.isNotEmpty) ...[
                        const SizedBox(height: 28),
                        Row(
                          children: [
                            Icon(Icons.description_outlined, size: 20, color: AppTheme.primary),
                            const SizedBox(width: 10),
                            Text(
                              'الوصف',
                              style: GoogleFonts.cormorantGaramond(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppTheme.pastelPink.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppTheme.primary.withOpacity(0.08)),
                          ),
                          child: Text(
                            p.description!,
                            style: TextStyle(
                              fontSize: 15,
                              height: 1.7,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 28),
                      Row(
                        children: [
                          Icon(Icons.shopping_cart_outlined, size: 20, color: AppTheme.primary),
                          const SizedBox(width: 10),
                          Text(
                            'الكمية',
                            style: GoogleFonts.cormorantGaramond(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            decoration: BoxDecoration(
                              color: AppTheme.pastelPink.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: AppTheme.primary.withOpacity(0.1)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ScaleOnTap(
                                  onTap: () => setState(() => _qty = (_qty - 1).clamp(1, 999)),
                                  child: _QtyBtn(icon: Icons.remove_rounded),
                                ),
                                SizedBox(
                                  width: 44,
                                  child: Text(
                                    '$_qty',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textPrimary,
                                    ),
                                  ),
                                ),
                                ScaleOnTap(
                                  onTap: () => setState(() => _qty = (_qty + 1).clamp(1, 999)),
                                  child: _QtyBtn(icon: Icons.add_rounded),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
          // ─── هيدر ثابت ───
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _HeaderBtn(
                      icon: Icons.arrow_back_ios_new,
                      onTap: () => context.pop(),
                    ),
                    if (auth.isLoggedIn)
                      _HeaderBtn(
                        icon: wishlist.isInWishlist(p.id) ? Icons.favorite : Icons.favorite_border,
                        isActive: wishlist.isInWishlist(p.id),
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
      // ─── زر الإضافة ───
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        padding: EdgeInsets.fromLTRB(24, 20, 24, MediaQuery.of(context).padding.bottom + 20),
        child: SafeArea(
          top: false,
          child: ScaleOnTap(
            onTap: inStock && _selectedVariant != null
                ? () async {
                    final ok = await cart.addItem(_selectedVariant!.id, _qty);
                    if (ok && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('تمت الإضافة إلى السلة'),
                          backgroundColor: AppTheme.textPrimary,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    }
                  }
                : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              height: 56,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: inStock && _selectedVariant != null
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppTheme.primary, AppTheme.primaryDark],
                      )
                    : null,
                color: inStock && _selectedVariant != null ? null : AppTheme.textMuted.withOpacity(0.25),
                boxShadow: inStock && _selectedVariant != null
                    ? [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.35),
                          blurRadius: 14,
                          offset: const Offset(0, 5),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_bag_outlined,
                    size: 22,
                    color: inStock && _selectedVariant != null ? Colors.white : Colors.white70,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    inStock ? 'أضف للسلة' : 'غير متوفر',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: inStock && _selectedVariant != null ? Colors.white : Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
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

/// زر الهيدر
class _HeaderBtn extends StatelessWidget {
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _HeaderBtn({
    required this.icon,
    required this.onTap,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF0F0F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Center(
            child: Icon(
              icon,
              size: 20,
              color: isActive ? AppTheme.primary : AppTheme.textPrimary,
            ),
          ),
        ),
      ),
    );
  }
}

/// شريحة لون - تصميم بطاقة أفقية
class _ColorChip extends StatelessWidget {
  final Color? color;
  final String label;
  final bool isActive;
  final bool inStock;

  const _ColorChip({
    required this.color,
    required this.label,
    required this.isActive,
    required this.inStock,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? const Color(0xFFE0E0E0);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      width: 120,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        gradient: isActive
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppTheme.primary.withOpacity(0.12),
                  AppTheme.pastelPink.withOpacity(0.5),
                ],
              )
            : null,
        color: isActive ? null : AppTheme.pastelPink.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive ? AppTheme.primary : AppTheme.border,
          width: isActive ? 2 : 1,
        ),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: AppTheme.primary.withOpacity(0.2),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: c,
              border: Border.all(color: Colors.white, width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
                color: inStock ? AppTheme.textPrimary : AppTheme.textMuted,
              ),
            ),
          ),
          if (isActive)
            Icon(Icons.check_circle_rounded, size: 18, color: AppTheme.primary),
        ],
      ),
    );
  }
}

/// زر الكمية
class _QtyBtn extends StatelessWidget {
  final IconData icon;

  const _QtyBtn({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      child: Icon(icon, size: 22, color: AppTheme.textPrimary),
    );
  }
}
