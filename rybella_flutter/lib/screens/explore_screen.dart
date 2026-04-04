import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';

import '../core/config.dart';
import '../core/responsive.dart';
import '../core/theme.dart';
import '../models/brand.dart';
import '../models/category.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/wishlist_provider.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';
import '../widgets/product_card.dart';

/// ثوابت بصرية موحّدة لصفحة المنتجات (خلفية بيضاء؛ الوردي في الشريط الجانبي فقط)
abstract final class _ExploreDecor {
  static const Color sheetTint = Color(0xFFFFFFFF);
}

IconData _exploreCategoryIcon(Category c) {
  final name = c.name.toLowerCase();
  if (name.contains('شفاه') || name.contains('lip')) return Icons.face_rounded;
  if (name.contains('عطور') || name.contains('perfume'))
    return Icons.spa_rounded;
  if (name.contains('عناية') || name.contains('care')) {
    return Icons.auto_awesome_rounded;
  }
  if (name.contains('مكياج') || name.contains('makeup'))
    return Icons.brush_rounded;
  if (name.contains('بشرة') || name.contains('skin')) {
    return Icons.dry_cleaning_rounded;
  }
  return Icons.category_rounded;
}

class ExploreScreen extends StatefulWidget {
  final int? categoryId;
  final int? subcategoryId;
  final int? brandId;
  final String? search;
  final String? tag;
  final String? colorCode;
  final double? minPrice;
  final double? maxPrice;
  final bool featured;

  const ExploreScreen({
    super.key,
    this.categoryId,
    this.subcategoryId,
    this.brandId,
    this.search,
    this.tag,
    this.colorCode,
    this.minPrice,
    this.maxPrice,
    this.featured = false,
  });

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreDigits {
  static TextStyle outfit({
    required double size,
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) {
    return GoogleFonts.outfit(fontSize: size, fontWeight: weight, color: color);
  }
}

class _ExploreScreenState extends State<ExploreScreen> {
  static const _prefSidebarKey = 'explore_sidebar_visible';

  List<Product> _products = [];
  List<Category> _categories = [];
  List<Subcategory> _sidebarSubcategories = [];
  List<Brand> _brands = [];
  bool _loading = true;
  String _sortBy = '';
  final _searchController = TextEditingController();
  final _exploreScrollController = ScrollController();
  final _sidebarFade = ValueNotifier<double>(1.0);

  static const _kSidebarFadeScrollPx = 280.0;

  /// شريط الفئات الجانبي
  bool _sidebarVisible = true;

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.search ?? '';
    _exploreScrollController.addListener(_syncSidebarFadeFromScroll);
    _loadFilters();
    _loadProducts();
    _loadSidebarSubcategories();
    _restoreSidebarPref();
  }

  void _syncSidebarFadeFromScroll() {
    final p = _exploreScrollController.offset.clamp(0.0, double.infinity);
    final next = (1.0 - p / _kSidebarFadeScrollPx).clamp(0.0, 1.0);
    if ((_sidebarFade.value - next).abs() > 0.002) {
      _sidebarFade.value = next;
    }
  }

  Future<void> _loadSidebarSubcategories() async {
    if (widget.categoryId == null) {
      if (mounted) setState(() => _sidebarSubcategories = []);
      return;
    }
    final list = await ApiService.getSubcategories(
      categoryId: widget.categoryId,
    );
    if (mounted) {
      setState(() => _sidebarSubcategories = list);
    }
  }

  Future<void> _restoreSidebarPref() async {
    final p = await SharedPreferences.getInstance();
    final v = p.getBool(_prefSidebarKey);
    if (mounted && v != null) {
      setState(() => _sidebarVisible = v);
    }
  }

  Future<void> _setSidebarVisible(bool visible) async {
    setState(() => _sidebarVisible = visible);
    final p = await SharedPreferences.getInstance();
    await p.setBool(_prefSidebarKey, visible);
  }

  @override
  void didUpdateWidget(covariant ExploreScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.categoryId != widget.categoryId) {
      _loadSidebarSubcategories();
    }
    if (oldWidget.categoryId != widget.categoryId ||
        oldWidget.subcategoryId != widget.subcategoryId ||
        oldWidget.brandId != widget.brandId ||
        oldWidget.search != widget.search ||
        oldWidget.tag != widget.tag ||
        oldWidget.colorCode != widget.colorCode ||
        oldWidget.minPrice != widget.minPrice ||
        oldWidget.maxPrice != widget.maxPrice ||
        oldWidget.featured != widget.featured) {
      _loadProducts();
    }
  }

  Future<void> _loadFilters() async {
    final cats = await ApiService.getCategories();
    final brs = await ApiService.getBrands();
    setState(() {
      _categories = cats;
      _brands = brs;
    });
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    final list = await ApiService.getProducts(
      categoryId: widget.categoryId,
      subcategoryId: widget.subcategoryId,
      brandId: widget.brandId,
      search: widget.search ?? _searchController.text,
      tags: widget.tag,
      colorCode: widget.colorCode,
      minPrice: widget.minPrice,
      maxPrice: widget.maxPrice,
      sortBy: _sortBy.isEmpty ? null : _sortBy,
      featured: widget.featured ? '1' : null,
    );
    setState(() {
      _products = list;
      _loading = false;
    });
  }

  String _buildUrl({Map<String, String>? overrides}) {
    final params = <String, String>{
      if (widget.categoryId != null)
        'category_id': widget.categoryId.toString(),
      if (widget.subcategoryId != null)
        'subcategory_id': widget.subcategoryId.toString(),
      if (widget.brandId != null) 'brand_id': widget.brandId.toString(),
      if (widget.search != null && widget.search!.isNotEmpty)
        'search': widget.search!,
      if (widget.tag != null) 'tag': widget.tag!,
      if (widget.colorCode != null) 'color': widget.colorCode!,
      if (widget.minPrice != null) 'min_price': widget.minPrice.toString(),
      if (widget.maxPrice != null) 'max_price': widget.maxPrice.toString(),
    };
    overrides?.forEach((k, v) {
      if (v.isEmpty) {
        params.remove(k);
      } else {
        params[k] = v;
      }
    });
    final q = params.isEmpty
        ? ''
        : '?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
    return '/explore$q';
  }

  @override
  void dispose() {
    _exploreScrollController.removeListener(_syncSidebarFadeFromScroll);
    _exploreScrollController.dispose();
    _sidebarFade.dispose();
    _searchController.dispose();
    super.dispose();
  }

  String _heroSubtitle() {
    if (widget.featured) return 'تشكيلة مميزة نختارها لكِ بعناية';
    if (widget.categoryId != null) {
      for (final c in _categories) {
        if (c.id == widget.categoryId) return c.name;
      }
    }
    if (widget.brandId != null) {
      for (final b in _brands) {
        if (b.id == widget.brandId) return b.name;
      }
    }
    if (widget.search != null && widget.search!.trim().isNotEmpty) {
      return 'نتائج البحث عن «${widget.search!.trim()}»';
    }
    return 'اكتشفي أحدث المنتجات والعروض';
  }

  String _sortLabel() {
    switch (_sortBy) {
      case 'price_asc':
        return 'السعر: الأقل';
      case 'price_desc':
        return 'السعر: الأعلى';
      case 'newest':
        return 'الأحدث';
      default:
        return 'الافتراضي';
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final wishlist = context.watch<WishlistProvider>();

    return Scaffold(
      backgroundColor: _ExploreDecor.sheetTint,
      body: ValueListenableBuilder<double>(
        valueListenable: _sidebarFade,
        builder: (context, fade, _) {
          final kRailMax = Responsive.exploreSidebarRailWidth(context);
          final ph = Responsive.pagePaddingH(context);
          final railW = _sidebarVisible
              ? (kRailMax * fade).clamp(0.0, kRailMax)
              : 0.0;
          final showExpandArrow =
              !_sidebarVisible || (_sidebarVisible && fade < 0.05);
          return Stack(
            fit: StackFit.expand,
            clipBehavior: Clip.none,
            children: [
              Positioned.fill(
                child: AnimatedPadding(
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeInOutCubic,
                  padding: EdgeInsetsDirectional.only(start: railW),
                  child: CustomScrollView(
                    controller: _exploreScrollController,
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                        SliverToBoxAdapter(
                          child: Material(
                            color: _ExploreDecor.sheetTint,
                            child: SafeArea(
                              bottom: false,
                              child: Padding(
                                padding: EdgeInsets.fromLTRB(ph, 8, ph, 16),
                                child: DefaultTextStyle(
                                  style: const TextStyle(
                                    color: AppTheme.textPrimary,
                                    fontFamily: 'Tajawal',
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      Align(
                                        alignment:
                                            AlignmentDirectional.centerEnd,
                                        child: IconButton.filled(
                                          style: IconButton.styleFrom(
                                            backgroundColor: Colors.white,
                                            side: BorderSide(
                                              color: AppTheme.border.withValues(
                                                alpha: 0.95,
                                              ),
                                            ),
                                            foregroundColor: AppTheme.primary,
                                            elevation: 0,
                                            shadowColor: Colors.transparent,
                                          ),
                                          onPressed: _showSortSheet,
                                          icon: const Icon(
                                            Icons.sort_rounded,
                                            size: 22,
                                          ),
                                        ),
                                      ),
                                      if (widget.featured)
                                        Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: 10,
                                          ),
                                          child: Align(
                                            alignment: AlignmentDirectional
                                                .centerStart,
                                            child: DecoratedBox(
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius:
                                                    BorderRadius.circular(24),
                                                border: Border.all(
                                                  color: AppTheme.border
                                                      .withValues(
                                                    alpha: 0.95,
                                                  ),
                                                ),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black
                                                        .withValues(
                                                      alpha: 0.05,
                                                    ),
                                                    blurRadius: 16,
                                                    offset: const Offset(0, 4),
                                                  ),
                                                ],
                                              ),
                                              child: Padding(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                  horizontal: 14,
                                                  vertical: 7,
                                                ),
                                                child: Row(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: [
                                                    Icon(
                                                      Icons
                                                          .auto_awesome_rounded,
                                                      size: 16,
                                                      color: AppTheme.primary,
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Text(
                                                      'تشكيلة مميزة',
                                                      style:
                                                          GoogleFonts.outfit(
                                                        fontSize: 12,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color:
                                                            AppTheme.primary,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      Row(
                                        children: [
                                          Text(
                                            'المتجر',
                                            style: GoogleFonts.outfit(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 1.0,
                                              color: AppTheme.textMuted,
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                            ),
                                            child: Container(
                                              width: 4,
                                              height: 4,
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                color: AppTheme.primary
                                                    .withValues(
                                                  alpha: 0.55,
                                                ),
                                              ),
                                            ),
                                          ),
                                          Text(
                                            'Rybella',
                                            style: GoogleFonts.outfit(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 0.6,
                                              color: AppTheme.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        'المنتجات',
                                        style: TextStyle(
                                          fontFamily: 'Tajawal',
                                          fontSize: 30,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.textPrimary,
                                          height: 1.05,
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        _heroSubtitle(),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontFamily: 'Tajawal',
                                          fontSize: 14,
                                          height: 1.45,
                                          fontWeight: FontWeight.w500,
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: EdgeInsets.fromLTRB(ph, 4, ph, 12),
                            child: _ExploreSearchCard(
                              controller: _searchController,
                              onSubmitSearch: () {
                                HapticFeedback.lightImpact();
                                context.go(
                                  _buildUrl(
                                    overrides: {
                                      'search': _searchController.text,
                                    },
                                  ),
                                );
                              },
                              onFieldSubmitted: (v) => context.go(
                                _buildUrl(overrides: {'search': v}),
                              ),
                            ),
                          ),
                        ),
                        if (_categories.isNotEmpty || _brands.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.fromLTRB(ph, 0, ph, 10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _ExploreSectionTitle(
                                    title: 'تصفية سريعة',
                                    icon: Icons.tune_rounded,
                                  ),
                                  const SizedBox(height: 12),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                      horizontal: 10,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(26),
                                      border: Border.all(
                                        color: AppTheme.border.withValues(
                                          alpha: 0.9,
                                        ),
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(
                                            alpha: 0.04,
                                          ),
                                          blurRadius: 20,
                                          offset: const Offset(0, 8),
                                        ),
                                      ],
                                    ),
                                    child: SizedBox(
                                      height: 46,
                                      child: ListView(
                                        scrollDirection: Axis.horizontal,
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 4,
                                        ),
                                        physics: const BouncingScrollPhysics(),
                                        children: [
                                          _FilterPill(
                                            label: 'الكل',
                                            active:
                                                widget.categoryId == null &&
                                                widget.brandId == null &&
                                                widget.tag == null &&
                                                widget.colorCode == null,
                                            onTap: () => context.go('/explore'),
                                          ),
                                          ..._categories.map(
                                            (c) => _FilterPill(
                                              label: c.name,
                                              active: widget.categoryId == c.id,
                                              onTap: () => context.go(
                                                _buildUrl(
                                                  overrides: {
                                                    'category_id': c.id
                                                        .toString(),
                                                    'subcategory_id': '',
                                                  },
                                                ),
                                              ),
                                            ),
                                          ),
                                          ..._brands
                                              .take(3)
                                              .map(
                                                (b) => _FilterPill(
                                                  label: b.name,
                                                  active:
                                                      widget.brandId == b.id,
                                                  onTap: () => context.go(
                                                    _buildUrl(
                                                      overrides: {
                                                        'brand_id': b.id
                                                            .toString(),
                                                      },
                                                    ),
                                                  ),
                                                ),
                                              ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        if (_categories.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: EdgeInsets.fromLTRB(ph, 0, ph, 10),
                              child: _CategoryOrbRail(
                                categories: _categories,
                                selectedCategoryId: widget.categoryId,
                                onCategoryTap: (id) => context.go(
                                  id == null
                                      ? '/explore'
                                      : _buildUrl(
                                          overrides: {
                                            'category_id': id.toString(),
                                            'subcategory_id': '',
                                          },
                                        ),
                                ),
                              ),
                            ),
                          ),
                        if (!_loading && _products.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(18, 4, 18, 12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.82),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: AppTheme.border.withValues(
                                      alpha: 0.85,
                                    ),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.04,
                                      ),
                                      blurRadius: 16,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 4,
                                      height: 26,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(4),
                                        gradient: const LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            AppTheme.primary,
                                            AppTheme.primaryDark,
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text.rich(
                                        TextSpan(
                                          style: GoogleFonts.outfit(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textMuted,
                                          ),
                                          children: [
                                            const TextSpan(text: 'عرض '),
                                            TextSpan(
                                              text: '${_products.length}',
                                              style: _ExploreDigits.outfit(
                                                size: 15,
                                                weight: FontWeight.w800,
                                                color: AppTheme.primary,
                                              ),
                                            ),
                                            TextSpan(
                                              text: _products.length == 1
                                                  ? ' منتج'
                                                  : ' منتجات',
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Material(
                                      color: Colors.transparent,
                                      child: InkWell(
                                        onTap: _showSortSheet,
                                        borderRadius: BorderRadius.circular(22),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 14,
                                            vertical: 9,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(
                                              22,
                                            ),
                                            border: Border.all(
                                              color: AppTheme.border.withValues(
                                                alpha: 0.9,
                                              ),
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                Icons.sort_rounded,
                                                size: 17,
                                                color: AppTheme.primary
                                                    .withValues(alpha: 0.92),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                _sortLabel(),
                                                style: GoogleFonts.outfit(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                  color: AppTheme.textSecondary,
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
                        if (_loading)
                          SliverToBoxAdapter(
                            child: _ExploreShimmerGrid(
                              height: MediaQuery.of(context).size.height * 0.62,
                              columns: Responsive.productGridColumns(context),
                              aspect: Responsive.productChildAspectRatio(context),
                              paddingH: Responsive.pagePaddingH(context),
                            ),
                          )
                        else if (_products.isEmpty)
                          const SliverFillRemaining(
                            child: _EmptyProductsState(),
                          )
                        else
                          SliverPadding(
                            padding: EdgeInsets.fromLTRB(
                              Responsive.pagePaddingH(context),
                              6,
                              Responsive.pagePaddingH(context),
                              120,
                            ),
                            sliver: SliverGrid(
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount:
                                        Responsive.productGridColumns(context),
                                    mainAxisSpacing: 16,
                                    crossAxisSpacing: 16,
                                    childAspectRatio:
                                        Responsive.productChildAspectRatio(
                                            context),
                                  ),
                              delegate: SliverChildBuilderDelegate((_, i) {
                                final p = _products[i];
                                return ProductCard(
                                      product: p,
                                      inWishlist:
                                          auth.isLoggedIn &&
                                          wishlist.isInWishlist(p.id),
                                      onWishlistTap: auth.isLoggedIn
                                          ? () => wishlist.toggle(p.id)
                                          : null,
                                      onTap: () =>
                                          context.push('/products/${p.id}'),
                                    )
                                    .animate()
                                    .fadeIn(delay: (i * 32).ms)
                                    .slideY(
                                      begin: 0.05,
                                      end: 0,
                                      curve: Curves.easeOutCubic,
                                    );
                              }, childCount: _products.length),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
          if (railW >= 0.5)
            PositionedDirectional(
              start: 0,
              top: 0,
              bottom: 0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeInOutCubic,
                width: railW,
                alignment: AlignmentDirectional.centerStart,
                child: ClipRect(
                  child: IgnorePointer(
                    ignoring: fade < 0.04,
                    child: Opacity(
                      opacity: fade.clamp(0.0, 1.0),
                      child: _CategorySidebar(
                        categories: _categories,
                        subcategories: _sidebarSubcategories,
                        selectedCategoryId: widget.categoryId,
                        selectedSubcategoryId: widget.subcategoryId,
                        onCollapse: () {
                          HapticFeedback.lightImpact();
                          _setSidebarVisible(false);
                        },
                        onCategoryTap: (id) => context.go(
                          id == null
                              ? '/explore'
                              : _buildUrl(
                                  overrides: {
                                    'category_id': id.toString(),
                                    'subcategory_id': '',
                                  },
                                ),
                        ),
                        onSubcategoryTap: (subId) => context.go(
                          _buildUrl(
                            overrides: {
                              'subcategory_id': subId == null
                                  ? ''
                                  : subId.toString(),
                            },
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
              if (showExpandArrow)
                PositionedDirectional(
                  start: 0,
                  top: 0,
                  bottom: 0,
                  width: 50,
                  child: Center(
                    child: _ExploreSidebarCollapsed(
                      onExpand: () {
                        HapticFeedback.lightImpact();
                        if (!_sidebarVisible) {
                          _setSidebarVisible(true);
                        } else {
                          _exploreScrollController.animateTo(
                            0,
                            duration: const Duration(milliseconds: 380),
                            curve: Curves.easeOutCubic,
                          );
                        }
                      },
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _showSortSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        margin: const EdgeInsets.only(top: 8),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.14),
              blurRadius: 28,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.border,
                      AppTheme.primary.withValues(alpha: 0.45),
                      AppTheme.border,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'ترتيب المنتجات',
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  'اختاري طريقة عرض القائمة',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Divider(
                  height: 1,
                  color: AppTheme.border.withValues(alpha: 0.65),
                ),
              ),
              const SizedBox(height: 4),
              _SortOption(
                label: 'الافتراضي',
                selected: _sortBy.isEmpty,
                onTap: () {
                  setState(() => _sortBy = '');
                  _loadProducts();
                  Navigator.pop(ctx);
                },
              ),
              _SortOption(
                label: 'السعر: من الأقل للأعلى',
                selected: _sortBy == 'price_asc',
                onTap: () {
                  setState(() => _sortBy = 'price_asc');
                  _loadProducts();
                  Navigator.pop(ctx);
                },
              ),
              _SortOption(
                label: 'السعر: من الأعلى للأقل',
                selected: _sortBy == 'price_desc',
                onTap: () {
                  setState(() => _sortBy = 'price_desc');
                  _loadProducts();
                  Navigator.pop(ctx);
                },
              ),
              _SortOption(
                label: 'الأحدث',
                selected: _sortBy == 'newest',
                onTap: () {
                  setState(() => _sortBy = 'newest');
                  _loadProducts();
                  Navigator.pop(ctx);
                },
              ),
              SizedBox(height: MediaQuery.of(ctx).padding.bottom + 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _ExploreSectionTitle extends StatelessWidget {
  final String title;
  final IconData icon;

  const _ExploreSectionTitle({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.border.withValues(alpha: 0.45),
              border: Border.all(
                color: AppTheme.border.withValues(alpha: 0.8),
              ),
            ),
            child: Icon(
              icon,
              size: 16,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ExploreSearchCard extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSubmitSearch;
  final ValueChanged<String> onFieldSubmitted;

  const _ExploreSearchCard({
    required this.controller,
    required this.onSubmitSearch,
    required this.onFieldSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: AppTheme.border.withValues(alpha: 0.95),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        textInputAction: TextInputAction.search,
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppTheme.textPrimary,
        ),
        decoration: InputDecoration(
          filled: true,
          fillColor: const Color(0xFFF8F8F8),
          hintText: 'ابحثي عن منتج، ماركة، أو لون...',
          hintStyle: TextStyle(
            color: AppTheme.textMuted,
            fontSize: 14,
            height: 1.35,
          ),
          prefixIcon: Icon(
            Icons.search_rounded,
            color: AppTheme.primary.withValues(alpha: 0.88),
            size: 24,
          ),
          suffixIcon: IconButton(
            icon: Icon(
              Icons.arrow_forward_ios_rounded,
              color: AppTheme.primary,
              size: 18,
            ),
            onPressed: onSubmitSearch,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(26),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 15,
          ),
        ),
        onSubmitted: onFieldSubmitted,
      ),
    );
  }
}

class _CategoryOrbRail extends StatelessWidget {
  final List<Category> categories;
  final int? selectedCategoryId;
  final ValueChanged<int?> onCategoryTap;

  const _CategoryOrbRail({
    required this.categories,
    required this.selectedCategoryId,
    required this.onCategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 8),
          child: _ExploreSectionTitle(
            title: 'التصنيفات',
            icon: Icons.grid_view_rounded,
          ),
        ),
        const SizedBox(height: 14),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: AppTheme.border.withValues(alpha: 0.9),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: SizedBox(
            height: 96,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              physics: const BouncingScrollPhysics(),
              children: [
                _ExploreOrb(
                  label: 'الكل',
                  icon: Icons.apps_rounded,
                  imageUrl: null,
                  selected: selectedCategoryId == null,
                  onTap: () => onCategoryTap(null),
                ),
                ...categories.map(
                  (c) => _ExploreOrb(
                    label: c.name,
                    icon: _exploreCategoryIcon(c),
                    imageUrl: c.icon ?? c.image,
                    selected: selectedCategoryId == c.id,
                    onTap: () => onCategoryTap(c.id),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ExploreOrb extends StatelessWidget {
  final String label;
  final IconData icon;
  final String? imageUrl;
  final bool selected;
  final VoidCallback onTap;

  const _ExploreOrb({
    required this.label,
    required this.icon,
    this.imageUrl,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasUrl = imageUrl != null && imageUrl!.isNotEmpty;
    final fullUrl = hasUrl && !imageUrl!.startsWith('http')
        ? '${AppConfig.imgBase}$imageUrl'
        : imageUrl;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: SizedBox(
            width: 68,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 280),
                  curve: Curves.easeOutCubic,
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: selected
                        ? const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Color(0xFFFF9EC0),
                              AppTheme.primary,
                              AppTheme.primaryDark,
                            ],
                          )
                        : null,
                    color: selected ? null : Colors.white,
                    border: Border.all(
                      color: selected
                          ? Colors.white.withValues(alpha: 0.75)
                          : const Color(0xFFFFD0E0),
                      width: selected ? 2 : 1.4,
                    ),
                    boxShadow: [
                      if (selected) ...[
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.45),
                          blurRadius: 16,
                          offset: const Offset(4, 3),
                        ),
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.28),
                          blurRadius: 22,
                          offset: const Offset(2, 4),
                          spreadRadius: -2,
                        ),
                      ] else
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                    ],
                  ),
                  padding: const EdgeInsets.all(3),
                  child: DecoratedBox(
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                    ),
                    child: ClipOval(
                      child: hasUrl && fullUrl != null
                          ? AppImage(
                              url: fullUrl,
                              width: 56,
                              height: 56,
                              fit: BoxFit.cover,
                            )
                          : Center(
                              child: Icon(
                                icon,
                                size: 26,
                                color: AppTheme.primary.withValues(alpha: 0.9),
                              ),
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                    color: selected ? AppTheme.primary : AppTheme.textSecondary,
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

class _ExploreShimmerGrid extends StatelessWidget {
  final double height;
  final int columns;
  final double aspect;
  final double paddingH;

  const _ExploreShimmerGrid({
    required this.height,
    required this.columns,
    required this.aspect,
    required this.paddingH,
  });

  @override
  Widget build(BuildContext context) {
    final count = (columns * 2).clamp(4, 12);
    return SizedBox(
      height: height,
      child: Padding(
        padding: EdgeInsets.fromLTRB(paddingH, 8, paddingH, 24),
        child: Shimmer.fromColors(
          baseColor: const Color(0xFFE4E4E4),
          highlightColor: const Color(0xFFF8F8F8),
          period: const Duration(milliseconds: 1100),
          child: GridView.builder(
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: aspect,
            ),
            itemCount: count,
            itemBuilder: (context, _) {
              return Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFEDEDED),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      flex: 3,
                      child: Container(
                        margin: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0E0E0),
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            height: 10,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: const Color(0xFFD8D8D8),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 10,
                            width: 80,
                            decoration: BoxDecoration(
                              color: const Color(0xFFD8D8D8),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _CategorySidebar extends StatelessWidget {
  final List<Category> categories;
  final List<Subcategory> subcategories;
  final int? selectedCategoryId;
  final int? selectedSubcategoryId;
  final ValueChanged<int?> onCategoryTap;
  final ValueChanged<int?> onSubcategoryTap;
  final VoidCallback onCollapse;

  const _CategorySidebar({
    required this.categories,
    required this.subcategories,
    required this.selectedCategoryId,
    required this.selectedSubcategoryId,
    required this.onCategoryTap,
    required this.onSubcategoryTap,
    required this.onCollapse,
  });

  @override
  Widget build(BuildContext context) {
    final dir = Directionality.of(context);
    final endRadius = BorderRadiusDirectional.only(
      topEnd: const Radius.circular(22),
      bottomEnd: const Radius.circular(22),
    ).resolve(dir);

    return Padding(
      padding: const EdgeInsets.only(left: 0, right: 2),
      child: SizedBox(
        width: double.infinity,
        height: double.infinity,
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: endRadius,
            border: Border.all(
              color: const Color(0xFFFFB8D0).withValues(alpha: 0.55),
              width: 1.1,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.14),
                blurRadius: 24,
                offset: const Offset(4, 0),
                spreadRadius: -10,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: endRadius,
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
                          const Color(0xFFFFF5F9),
                          const Color(0xFFFFE4EC),
                          AppTheme.primaryLight.withValues(alpha: 0.35),
                        ],
                        stops: const [0.0, 0.55, 1.0],
                      ),
                    ),
                  ),
                ),
                Positioned.fill(
                  child: SafeArea(
                    left: false,
                    right: false,
                    minimum: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(8, 6, 4, 2),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Text(
                                  'فئات',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.start,
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.primaryDark,
                                    height: 1.1,
                                  ),
                                ),
                              ),
                              Tooltip(
                                message: 'إخفاء الفئات',
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: onCollapse,
                                    customBorder: const CircleBorder(),
                                    child: SizedBox(
                                      width: 34,
                                      height: 34,
                                      child: Ink(
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.white.withValues(
                                            alpha: 0.92,
                                          ),
                                          border: Border.all(
                                            color: AppTheme.primary.withValues(
                                              alpha: 0.22,
                                            ),
                                          ),
                                        ),
                                        child: Icon(
                                          dir == TextDirection.rtl
                                              ? Icons.chevron_right_rounded
                                              : Icons.chevron_left_rounded,
                                          size: 18,
                                          color: AppTheme.primary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.only(bottom: 14),
                            physics: const BouncingScrollPhysics(),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _SidebarItem(
                                  icon: Icons.apps_rounded,
                                  iconUrl: null,
                                  selected: selectedCategoryId == null,
                                  onTap: () => onCategoryTap(null),
                                ),
                                const SizedBox(height: 8),
                                ...categories.map(
                                  (c) => Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: _SidebarItem(
                                      icon: _exploreCategoryIcon(c),
                                      iconUrl: c.icon ?? c.image,
                                      selected: selectedCategoryId == c.id,
                                      onTap: () => onCategoryTap(c.id),
                                    ),
                                  ),
                                ),
                                if (selectedCategoryId != null &&
                                    subcategories.isNotEmpty) ...[
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                      6,
                                      10,
                                      6,
                                      8,
                                    ),
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(8),
                                        gradient: LinearGradient(
                                          colors: [
                                            Colors.white.withValues(
                                              alpha: 0.0,
                                            ),
                                            Colors.white.withValues(
                                              alpha: 0.65,
                                            ),
                                            Colors.white.withValues(
                                              alpha: 0.0,
                                            ),
                                          ],
                                        ),
                                      ),
                                      child: const SizedBox(height: 1),
                                    ),
                                  ),
                                  const _SidebarRailLabel('فرعية'),
                                  const SizedBox(height: 6),
                                  _SidebarItem(
                                    icon: Icons.select_all_rounded,
                                    iconUrl: null,
                                    selected: selectedSubcategoryId == null,
                                    onTap: () => onSubcategoryTap(null),
                                    compact: true,
                                  ),
                                  const SizedBox(height: 6),
                                  ...subcategories.map(
                                    (s) => Padding(
                                      padding: const EdgeInsets.only(bottom: 6),
                                      child: _SidebarItem(
                                        icon: Icons.label_outline_rounded,
                                        iconUrl: s.image,
                                        selected: selectedSubcategoryId == s.id,
                                        onTap: () => onSubcategoryTap(s.id),
                                        compact: true,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                PositionedDirectional(
                  end: 0,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  child: IgnorePointer(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppTheme.primary.withValues(alpha: 0.0),
                            Colors.white.withValues(alpha: 0.55),
                            AppTheme.primary.withValues(alpha: 0.0),
                          ],
                          stops: const [0.0, 0.5, 1.0],
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
    );
  }
}

class _SidebarRailLabel extends StatelessWidget {
  final String text;

  const _SidebarRailLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Align(
        alignment: AlignmentDirectional.centerStart,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppTheme.primary.withValues(alpha: 0.18),
            ),
          ),
          child: Text(
            text,
            style: GoogleFonts.outfit(
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.15,
              color: AppTheme.primaryDark,
            ),
          ),
        ),
      ),
    );
  }
}

class _ExploreSidebarCollapsed extends StatelessWidget {
  final VoidCallback onExpand;

  const _ExploreSidebarCollapsed({required this.onExpand});

  @override
  Widget build(BuildContext context) {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final chevron = rtl
        ? Icons.chevron_left_rounded
        : Icons.chevron_right_rounded;

    return Tooltip(
      message: 'عرض الفئات',
      waitDuration: const Duration(milliseconds: 400),
      child: Semantics(
        button: true,
        label: 'عرض الفئات',
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: onExpand,
            customBorder: const CircleBorder(),
            splashColor: AppTheme.primary.withValues(alpha: 0.14),
            highlightColor: AppTheme.primary.withValues(alpha: 0.06),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                border: Border.all(
                  color: AppTheme.border.withValues(alpha: 0.95),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.07),
                    blurRadius: 14,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Icon(chevron, size: 22, color: AppTheme.primary),
            ),
          ),
        ),
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String? iconUrl;
  final bool selected;
  final VoidCallback onTap;

  final bool compact;

  const _SidebarItem({
    required this.icon,
    this.iconUrl,
    required this.selected,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final hasIconUrl = iconUrl != null && iconUrl!.isNotEmpty;
    final fullIconUrl = hasIconUrl && !iconUrl!.startsWith('http')
        ? '${AppConfig.imgBase}$iconUrl'
        : iconUrl;
    final outer = compact ? 36.0 : 40.0;
    final ringPad = compact ? 2.0 : 2.5;
    final iconSz = compact ? 17.0 : 19.0;
    final imgS = compact ? 22.0 : 24.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Semantics(
        button: true,
        selected: selected,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            customBorder: const CircleBorder(),
            splashColor: AppTheme.primary.withValues(alpha: 0.12),
            highlightColor: AppTheme.primary.withValues(alpha: 0.05),
            child: SizedBox(
              width: double.infinity,
              height: outer + 2,
              child: Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  width: outer,
                  height: outer,
                  padding: EdgeInsets.all(ringPad),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: selected
                        ? const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Color(0xFFFF9EC0),
                              AppTheme.primary,
                              AppTheme.primaryDark,
                            ],
                          )
                        : null,
                    color: selected ? null : Colors.white,
                    border: Border.all(
                      color: selected
                          ? Colors.white.withValues(alpha: 0.75)
                          : const Color(0xFFFFD0E0),
                      width: selected ? 2 : 1.15,
                    ),
                    boxShadow: selected
                        ? [
                            BoxShadow(
                              color: AppTheme.primary.withValues(alpha: 0.5),
                              blurRadius: 12,
                              offset: const Offset(4, 0),
                            ),
                            BoxShadow(
                              color: AppTheme.primary.withValues(alpha: 0.35),
                              blurRadius: 18,
                              offset: const Offset(4, 3),
                              spreadRadius: -2,
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                  ),
                  child: DecoratedBox(
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                    ),
                    child: ClipOval(
                      child: hasIconUrl && fullIconUrl != null
                          ? AppImage(
                              url: fullIconUrl,
                              fit: BoxFit.cover,
                              width: imgS,
                              height: imgS,
                            )
                          : Center(
                              child: Icon(
                                icon,
                                size: iconSz,
                                color: selected
                                    ? AppTheme.primary
                                    : AppTheme.textSecondary,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _FilterPill({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
            decoration: BoxDecoration(
              gradient: active
                  ? const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppTheme.primary, AppTheme.primaryDark],
                    )
                  : null,
              color: active ? null : Colors.white.withValues(alpha: 0.95),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: active
                    ? Colors.transparent
                    : AppTheme.border.withValues(alpha: 0.9),
                width: 1,
              ),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.3),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ]
                  : [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
            ),
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: active ? Colors.white : AppTheme.textPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SortOption extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SortOption({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            decoration: BoxDecoration(
              color: selected
                  ? AppTheme.primary.withValues(alpha: 0.1)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: selected
                    ? AppTheme.primary.withValues(alpha: 0.35)
                    : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: selected
                            ? FontWeight.w800
                            : FontWeight.w500,
                        color: selected
                            ? AppTheme.primary
                            : AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  if (selected)
                    Icon(
                      Icons.check_circle_rounded,
                      color: AppTheme.primary,
                      size: 22,
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyProductsState extends StatelessWidget {
  const _EmptyProductsState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 128,
              height: 128,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                border: Border.all(
                  color: AppTheme.border.withValues(alpha: 0.9),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 28,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Icon(
                Icons.inventory_2_outlined,
                size: 52,
                color: AppTheme.primary.withValues(alpha: 0.45),
              ),
            ),
            const SizedBox(height: 28),
            Text(
              'لا توجد منتجات',
              style: GoogleFonts.cormorantGaramond(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'جرّبي تغيير الفلاتر أو البحث بكلمات أخرى، أو ارجعي لعرض الكل.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 14,
                height: 1.55,
                fontWeight: FontWeight.w500,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: () => context.go('/explore'),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 15,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
                elevation: 0,
              ),
              icon: const Icon(Icons.grid_view_rounded, size: 21),
              label: Text(
                'عرض كل المنتجات',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
