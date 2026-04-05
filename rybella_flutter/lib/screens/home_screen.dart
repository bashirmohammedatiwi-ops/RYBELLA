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
import '../providers/cart_provider.dart';
import '../providers/recently_viewed_provider.dart';
import '../providers/wishlist_provider.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';
import '../widgets/home_subcategories_section.dart';
import '../widgets/product_card.dart';
import '../widgets/promo_banner.dart';
import '../widgets/quick_view.dart';
import '../widgets/stories_bar.dart';

// ─── Aurora — صفحة رئيسية تحريرية فاتحة ─────────────────────────────────────
abstract final class _Hl {
  static const Color canvas = Color(0xFFF4F1F6);
  static const Color canvasWarm = Color(0xFFFAF7FC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color heroA = Color(0xFFFFFCFD);
  static const Color heroB = Color(0xFFF5EDF3);
  static const Color heroC = Color(0xFFE8E0F2);
  static const Color orb = Color(0x14E85D7A);
  static const Color orbLavender = Color(0x334B3F8C);
  static const Color accentLine = Color(0xFFC4A574);
  static const Color cardEdge = Color(0xFFE2DCE6);
  static const Color chipBg = Color(0xFFFDF8FA);
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Category> _categories = [];
  List<Subcategory> _subcategories = [];
  List<Map> _banners = [];
  List<Map> _offers = [];
  List<Brand> _brands = [];
  List<Product> _featured = [];
  List<Product> _bestSellers = [];
  final List<Product> _recentProducts = [];
  Map<String, dynamic>? _settings;
  bool _loading = true;
  int _selectedCategoryIndex = 0;
  int? _quickViewId;
  final _homeSearchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  List<String> _recentSearches = [];
  List<String> _filterTags = [];
  List<Map<String, String>> _filterColors = [];

  @override
  void initState() {
    super.initState();
    _searchFocusNode.addListener(_onSearchFocusChanged);
    _loadRecentSearches();
    _load();
  }

  void _onSearchFocusChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _loadRecentSearches() async {
    final p = await SharedPreferences.getInstance();
    final list = p.getStringList('home_recent_searches');
    if (!mounted) return;
    setState(() => _recentSearches = list ?? []);
  }

  Future<void> _persistRecentSearches() async {
    final p = await SharedPreferences.getInstance();
    await p.setStringList('home_recent_searches', _recentSearches);
  }

  void _recordRecentSearch(String q) {
    if (q.length < 2) return;
    setState(() {
      _recentSearches.removeWhere((e) => e == q);
      _recentSearches.insert(0, q);
      if (_recentSearches.length > 10) {
        _recentSearches = _recentSearches.take(10).toList();
      }
    });
    _persistRecentSearches();
  }

  void _clearRecentSearches() {
    setState(() => _recentSearches.clear());
    _persistRecentSearches();
  }

  void _onRecentSearchTap(String q) {
    _homeSearchController.text = q;
    _submitHomeSearch();
  }

  @override
  void dispose() {
    _searchFocusNode.removeListener(_onSearchFocusChanged);
    _searchFocusNode.dispose();
    _homeSearchController.dispose();
    super.dispose();
  }

  String _buildExploreUrl({
    int? categoryId,
    int? subcategoryId,
    int? brandId,
    String? search,
    String? tag,
    String? color,
    double? minPrice,
    double? maxPrice,
    bool featured = false,
    String? sortBy,
  }) {
    final params = <String, String>{};
    if (categoryId != null) params['category'] = categoryId.toString();
    if (subcategoryId != null) params['subcategory'] = subcategoryId.toString();
    if (brandId != null) params['brand'] = brandId.toString();
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (tag != null && tag.isNotEmpty) params['tag'] = tag;
    if (color != null && color.isNotEmpty) params['color'] = color;
    if (minPrice != null) params['min_price'] = minPrice.toString();
    if (maxPrice != null) params['max_price'] = maxPrice.toString();
    if (featured) params['featured'] = '1';
    if (sortBy != null && sortBy.isNotEmpty) params['sort_by'] = sortBy;
    if (params.isEmpty) return '/explore';
    return '/explore?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
  }

  void _submitHomeSearch() {
    FocusManager.instance.primaryFocus?.unfocus();
    final q = _homeSearchController.text.trim();
    if (q.isEmpty) {
      context.go('/explore');
      return;
    }
    _recordRecentSearch(q);
    context.go(_buildExploreUrl(search: q));
  }

  void _showHomeFilterSheet() {
    HapticFeedback.lightImpact();
    final go = GoRouter.of(context);
    final minPriceCtrl = TextEditingController();
    final maxPriceCtrl = TextEditingController();

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.58,
          minChildSize: 0.38,
          maxChildSize: 0.94,
          expand: false,
          builder: (context, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x1A000000),
                    blurRadius: 24,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: AppTheme.border,
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.tune_rounded, color: AppTheme.primaryDark, size: 26),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'تصفية وترتيب',
                          style: GoogleFonts.cormorantGaramond(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'اخترِ ما يناسبك ثم انتقلي لصفحة الاستكشاف بنفس الإعدادات',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w600,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 18),
                  _HomeFilterSectionTitle(icon: Icons.star_rounded, title: 'وصول سريع'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _HomeFilterChip(
                        label: 'منتجات مميزة',
                        icon: Icons.auto_awesome,
                        onTap: () {
                          Navigator.pop(ctx);
                          go.go(_buildExploreUrl(featured: true));
                        },
                      ),
                      _HomeFilterChip(
                        label: 'كل المنتجات',
                        icon: Icons.inventory_2_outlined,
                        onTap: () {
                          Navigator.pop(ctx);
                          go.go('/explore');
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _HomeFilterSectionTitle(icon: Icons.sort_rounded, title: 'الترتيب الافتراضي للنتائج'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _HomeFilterChip(
                        label: 'الأحدث',
                        onTap: () {
                          Navigator.pop(ctx);
                          go.go(_buildExploreUrl(sortBy: 'newest'));
                        },
                      ),
                      _HomeFilterChip(
                        label: 'السعر: الأقل',
                        onTap: () {
                          Navigator.pop(ctx);
                          go.go(_buildExploreUrl(sortBy: 'price_asc'));
                        },
                      ),
                      _HomeFilterChip(
                        label: 'السعر: الأعلى',
                        onTap: () {
                          Navigator.pop(ctx);
                          go.go(_buildExploreUrl(sortBy: 'price_desc'));
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _HomeFilterSectionTitle(icon: Icons.payments_outlined, title: 'نطاق السعر (اختياري)'),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minPriceCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                            labelText: 'من',
                            filled: true,
                            fillColor: AppTheme.surfaceAlt,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: maxPriceCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                            labelText: 'إلى',
                            filled: true,
                            fillColor: AppTheme.surfaceAlt,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        final minV = double.tryParse(minPriceCtrl.text.replaceAll(',', '').trim());
                        final maxV = double.tryParse(maxPriceCtrl.text.replaceAll(',', '').trim());
                        Navigator.pop(ctx);
                        go.go(_buildExploreUrl(minPrice: minV, maxPrice: maxV));
                      },
                      icon: const Icon(Icons.check_rounded, size: 20),
                      label: const Text('تطبيق نطاق السعر', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                  if (_subcategories.isNotEmpty) ...[
                    const SizedBox(height: 22),
                    _HomeFilterSectionTitle(icon: Icons.label_outline_rounded, title: 'الفئات الفرعية'),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 96,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _subcategories.length.clamp(0, 16),
                        separatorBuilder: (context, _) => const SizedBox(width: 10),
                        itemBuilder: (_, i) {
                          final sc = _subcategories[i];
                          return _HomeSubcategoryFilterTile(
                            name: sc.name,
                            imageUrl: sc.image != null ? _img(sc.image) : null,
                            onTap: () {
                              Navigator.pop(ctx);
                              go.go(_buildExploreUrl(subcategoryId: sc.id));
                            },
                          );
                        },
                      ),
                    ),
                  ],
                  if (_categories.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _HomeFilterSectionTitle(icon: Icons.category_rounded, title: 'الفئات الرئيسية'),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _categories.map((c) {
                        final img = _getCatImage(c);
                        return ActionChip(
                          avatar: SizedBox(
                            width: 28,
                            height: 28,
                            child: ClipOval(
                              child: img != null && img.isNotEmpty
                                  ? AppImage(url: img, fit: BoxFit.cover, width: 28, height: 28)
                                  : ColoredBox(
                                      color: AppTheme.pastelPink,
                                      child: Icon(Icons.category_rounded, size: 16, color: AppTheme.primaryDark),
                                    ),
                            ),
                          ),
                          label: Text(c.name),
                          onPressed: () {
                            Navigator.pop(ctx);
                            go.go(_buildExploreUrl(categoryId: c.id));
                          },
                        );
                      }).toList(),
                    ),
                  ],
                  if (_brands.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _HomeFilterSectionTitle(icon: Icons.workspace_premium_outlined, title: 'الماركات'),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _brands.take(18).map((b) {
                        return ActionChip(
                          label: Text(b.name),
                          onPressed: () {
                            Navigator.pop(ctx);
                            go.go(_buildExploreUrl(brandId: b.id));
                          },
                        );
                      }).toList(),
                    ),
                  ],
                  if (_filterTags.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _HomeFilterSectionTitle(icon: Icons.sell_outlined, title: 'وسوم'),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _filterTags.map((t) {
                        return ActionChip(
                          label: Text(t),
                          onPressed: () {
                            Navigator.pop(ctx);
                            go.go(_buildExploreUrl(tag: t));
                          },
                        );
                      }).toList(),
                    ),
                  ],
                  if (_filterColors.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _HomeFilterSectionTitle(icon: Icons.palette_outlined, title: 'الألوان'),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: _filterColors.map((m) {
                        final code = m['code'] ?? '';
                        final name = m['name'] ?? code;
                        Color? swatch;
                        if (code.startsWith('#') && code.length >= 7) {
                          try {
                            swatch = Color(int.parse(code.replaceFirst('#', ''), radix: 16) + 0xFF000000);
                          } catch (_) {}
                        }
                        return InkWell(
                          onTap: () {
                            Navigator.pop(ctx);
                            go.go(_buildExploreUrl(color: code));
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              border: Border.all(color: _Hl.cardEdge),
                              borderRadius: BorderRadius.circular(20),
                              color: Colors.white,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (swatch != null)
                                  Container(
                                    width: 22,
                                    height: 22,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: swatch,
                                      border: Border.all(color: AppTheme.border),
                                    ),
                                  )
                                else
                                  const Icon(Icons.circle, size: 18, color: AppTheme.textMuted),
                                const SizedBox(width: 8),
                                Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                  if (_categories.isEmpty && _brands.isEmpty && _subcategories.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Text(
                        'حمّلي التصفيات من الاستكشاف بعد اتصال الشبكة.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                      ),
                    ),
                  const SizedBox(height: 20),
                  Center(
                    child: FilledButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        go.go('/explore');
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('فتح الاستكشاف', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      minPriceCtrl.dispose();
      maxPriceCtrl.dispose();
    });
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    _recentProducts.clear();
    final recentIds = context.read<RecentlyViewedProvider>().ids;

    await Future.wait([
      ApiService.getCategories().then((c) => _categories = c),
      ApiService.getSubcategories().then((s) => _subcategories = s),
      ApiService.getBanners().then((b) => _banners = b),
      ApiService.getOffers().then((o) => _offers = o),
      ApiService.getBrands().then((b) => _brands = b),
      ApiService.getProducts(featured: '1').then((p) => _featured = p.take(10).toList()),
      ApiService.getProducts().then((p) {
        _bestSellers = p.where((x) => x.isBestSeller).take(10).toList();
      }),
      ApiService.getWebSettings().then((s) => _settings = s),
      ApiService.getFilters().then((f) {
        _filterTags = _parseFilterTags(f['tags']);
        _filterColors = _parseFilterColors(f['colors']);
      }),
    ]);

    if (recentIds.isNotEmpty) {
      for (final id in recentIds.take(6)) {
        final p = await ApiService.getProduct(id);
        if (p != null) _recentProducts.add(p);
      }
    }

    if (mounted) setState(() => _loading = false);
  }

  String _img(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${AppConfig.imgBase}$path';
  }

  String? _getCatImage(Category c) {
    if (c.image != null && c.image!.isNotEmpty) {
      return _img(c.image);
    }
    final icon = c.icon;
    if (icon != null && icon.isNotEmpty) {
      if (icon.startsWith('http') ||
          icon.startsWith('/') ||
          RegExp(r'\.(png|jpg|jpeg|gif|webp)$', caseSensitive: false).hasMatch(icon)) {
        return _img(icon);
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final wishlist = context.watch<WishlistProvider>();
    final heroTitle = _settings?['hero_title'] ?? 'Rybella';
    final heroSubtitle = _settings?['hero_subtitle'] ?? '';
    final showRecent = _settings?['show_recently_viewed'] != '0' && _recentProducts.isNotEmpty;
    final quickViewEnabled = _settings?['quick_view_enabled'] != '0';
    final showOffers = _settings?['show_offers'] != '0' && _offers.isNotEmpty;

    final ph = Responsive.pagePaddingH(context);
    final gridCols = Responsive.productGridColumns(context);
    final gridAspect = Responsive.productChildAspectRatio(context);

    final body = _loading
        ? _HomeLoadingShimmer(ph: ph)
        : CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _HomeHeroLight(
                  title: heroTitle,
                  subtitle: heroSubtitle,
                  cartCount: cart.totalCount,
                  horizontalPadding: ph,
                  onCategories: () => context.go('/categories'),
                  onCart: () => context.go('/cart'),
                  searchController: _homeSearchController,
                  searchFocusNode: _searchFocusNode,
                  recentSearches: _recentSearches,
                  onSubmitSearch: _submitHomeSearch,
                  onFilterTap: _showHomeFilterSheet,
                  onRecentSearchTap: _onRecentSearchTap,
                  onClearRecentSearches: _clearRecentSearches,
                )
                    .animate()
                    .fadeIn(duration: 650.ms, curve: Curves.easeOutCubic)
                    .slideY(begin: 0.06, end: 0, duration: 650.ms, curve: Curves.easeOutCubic),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(ph, 8, ph, 0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _Hl.surface,
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(color: _Hl.cardEdge.withValues(alpha: 0.85)),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.05),
                          blurRadius: 28,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: const StoriesBar(),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 140.ms, duration: 500.ms)
                    .slideY(begin: 0.03, end: 0, delay: 140.ms, duration: 500.ms, curve: Curves.easeOutCubic),
              ),
              if (_banners.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(ph, 16, ph, 8),
                    child: PromoBanner(
                      banners: _banners.cast<Map<String, dynamic>>(),
                      imageUrl: _img,
                      onTap: (route) {
                        if (route.startsWith('/products/')) {
                          context.push(route);
                        } else {
                          context.go(route);
                        }
                      },
                    ),
                  ).animate().fadeIn(delay: 180.ms, duration: 600.ms).scale(begin: const Offset(0.98, 0.98), curve: Curves.easeOutCubic),
                ),
              if (_banners.isEmpty) const SliverToBoxAdapter(child: SizedBox(height: 8)),
              if (_subcategories.isNotEmpty)
                SliverToBoxAdapter(
                  child: HomeSubcategoriesSection(
                    subcategories: _subcategories,
                    imageUrl: _img,
                    onSubcategoryTap: _goExplore,
                  ).animate().fadeIn(delay: 220.ms, duration: 520.ms),
                ),
              if (_categories.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeCategoriesLight(
                    horizontalPadding: ph,
                    categories: _categories,
                    selectedIndex: _selectedCategoryIndex,
                    getCatImage: _getCatImage,
                    onSeeAll: () => context.push('/categories'),
                    onSelectAll: () => setState(() => _selectedCategoryIndex = 0),
                    onCategoryTap: (c, idx) {
                      setState(() => _selectedCategoryIndex = idx);
                      _goExplore(categoryId: c.id);
                    },
                  )
                      .animate()
                      .fadeIn(delay: 250.ms, duration: 560.ms)
                      .slideY(begin: 0.04, end: 0, delay: 250.ms, duration: 560.ms, curve: Curves.easeOutCubic),
                ),
              if (showOffers)
                SliverToBoxAdapter(
                  child: _HomeSectionLight(
                    title: 'عروض حصرية',
                    icon: Icons.auto_fix_high_rounded,
                    onSeeAll: () => context.push('/offers'),
                    horizontalPadding: ph,
                  ).animate().fadeIn(delay: 260.ms, duration: 480.ms),
                ),
              if (showOffers)
                SliverToBoxAdapter(
                  child: _HomeOffersLight(
                    offers: _offers,
                    imageUrl: _img,
                    horizontalPadding: ph,
                    cardWidth: Responsive.homeOfferCardWidth(context),
                    onOfferTap: (o) {
                      if (o['product_ids'] != null) {
                        context.push('/offers/${o['id']}');
                      } else {
                        context.go('/explore');
                      }
                    },
                  ).animate().fadeIn(delay: 300.ms, duration: 560.ms),
                ),
              if (_featured.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeSectionLight(
                    title: 'مختارات المحرر',
                    subtitle: 'المنتجات المميزة',
                    icon: Icons.diamond_outlined,
                    onSeeAll: () => context.go('/explore?featured=1'),
                    horizontalPadding: ph,
                  ),
                ),
              if (_featured.isNotEmpty)
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(ph, 0, ph, 6),
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: gridCols,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: gridAspect,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => ProductCard(
                        product: _featured[i],
                        colorIndex: i,
                        inWishlist: auth.isLoggedIn && wishlist.isInWishlist(_featured[i].id),
                        onWishlistTap: auth.isLoggedIn ? () => wishlist.toggle(_featured[i].id) : null,
                        onTap: () => context.push('/products/${_featured[i].id}'),
                        onQuickView: quickViewEnabled ? () => setState(() => _quickViewId = _featured[i].id) : null,
                      )
                          .animate()
                          .fadeIn(delay: (320 + i * 28).ms, duration: 400.ms)
                          .scale(begin: const Offset(0.94, 0.94), delay: (320 + i * 28).ms, duration: 400.ms, curve: Curves.easeOutBack),
                      childCount: _featured.length,
                    ),
                  ),
                ),
              if (_bestSellers.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeSectionLight(
                    title: 'الأكثر رواجاً',
                    icon: Icons.local_fire_department_outlined,
                    onSeeAll: () => context.go('/explore'),
                    horizontalPadding: ph,
                  ),
                ),
              if (_bestSellers.isNotEmpty)
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(ph, 0, ph, 6),
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: gridCols,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: gridAspect,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => ProductCard(
                        product: _bestSellers[i],
                        colorIndex: i,
                        inWishlist: auth.isLoggedIn && wishlist.isInWishlist(_bestSellers[i].id),
                        onWishlistTap: auth.isLoggedIn ? () => wishlist.toggle(_bestSellers[i].id) : null,
                        onTap: () => context.push('/products/${_bestSellers[i].id}'),
                        onQuickView: quickViewEnabled ? () => setState(() => _quickViewId = _bestSellers[i].id) : null,
                      ),
                      childCount: _bestSellers.length,
                    ),
                  ),
                ),
              if (_brands.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeSectionLight(
                    title: 'بيوت الجمال',
                    subtitle: 'الماركات',
                    icon: Icons.workspace_premium_outlined,
                    onSeeAll: () => context.go('/brands'),
                    horizontalPadding: ph,
                  ),
                ),
              if (_brands.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeBrandsLight(
                    brands: _brands.take(14).toList(),
                    imageUrl: _img,
                    horizontalPadding: ph,
                    onBrandTap: (b) => _goExplore(brandId: b.id),
                  ),
                ),
              if (showRecent)
                SliverToBoxAdapter(
                  child: _HomeSectionLight(
                    title: 'لمسة أخيرة',
                    subtitle: 'شاهدي مؤخراً',
                    icon: Icons.schedule_outlined,
                    onSeeAll: () => context.go('/explore'),
                    horizontalPadding: ph,
                  ),
                ),
              if (showRecent)
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(ph, 0, ph, 6),
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: gridCols,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: gridAspect,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => ProductCard(
                        product: _recentProducts[i],
                        colorIndex: i,
                        inWishlist: auth.isLoggedIn && wishlist.isInWishlist(_recentProducts[i].id),
                        onWishlistTap: auth.isLoggedIn ? () => wishlist.toggle(_recentProducts[i].id) : null,
                        onTap: () => context.push('/products/${_recentProducts[i].id}'),
                        onQuickView: quickViewEnabled ? () => setState(() => _quickViewId = _recentProducts[i].id) : null,
                      ),
                      childCount: _recentProducts.length,
                    ),
                  ),
                ),
              SliverToBoxAdapter(child: SizedBox(height: Responsive.isTablet(context) ? 44 : 32)),
            ],
          );

    return Stack(
      children: [
        Scaffold(
          backgroundColor: Colors.transparent,
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [_Hl.canvas, _Hl.canvasWarm],
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: RefreshIndicator(
                onRefresh: _load,
                color: AppTheme.primary,
                backgroundColor: _Hl.surface,
                edgeOffset: 10,
                child: body,
              ),
            ),
          ),
        ),
        if (_quickViewId != null)
          QuickViewSheet(
            productId: _quickViewId!,
            onClose: () => setState(() => _quickViewId = null),
          ),
      ],
    );
  }

  void _goExplore({int? categoryId, int? subcategoryId, int? brandId, String? search}) {
    final params = <String, String>{};
    if (categoryId != null) params['category'] = categoryId.toString();
    if (subcategoryId != null) params['subcategory'] = subcategoryId.toString();
    if (brandId != null) params['brand'] = brandId.toString();
    if (search != null && search.isNotEmpty) params['search'] = search;
    final q = params.isEmpty ? '' : '?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
    context.go('/explore$q');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// بطل — تدرج فاتح + دوائر لطيفة + بحث أبيض مرتفع
// ═══════════════════════════════════════════════════════════════════════════

class _HomeHeroLight extends StatelessWidget {
  final String title;
  final String subtitle;
  final int cartCount;
  final double horizontalPadding;
  final VoidCallback onCategories;
  final VoidCallback onCart;
  final TextEditingController searchController;
  final FocusNode searchFocusNode;
  final List<String> recentSearches;
  final VoidCallback onSubmitSearch;
  final VoidCallback onFilterTap;
  final ValueChanged<String> onRecentSearchTap;
  final VoidCallback onClearRecentSearches;

  const _HomeHeroLight({
    required this.title,
    required this.subtitle,
    required this.cartCount,
    required this.horizontalPadding,
    required this.onCategories,
    required this.onCart,
    required this.searchController,
    required this.searchFocusNode,
    required this.recentSearches,
    required this.onSubmitSearch,
    required this.onFilterTap,
    required this.onRecentSearchTap,
    required this.onClearRecentSearches,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(44),
        bottomRight: Radius.circular(44),
      ),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [_Hl.heroA, _Hl.heroB, _Hl.heroC],
                  stops: [0.0, 0.42, 1.0],
                ),
              ),
            ),
          ),
          Positioned(
            top: -60,
            right: -40,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [AppTheme.primary.withValues(alpha: 0.12), Colors.transparent],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 20,
            left: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [_Hl.orbLavender.withValues(alpha: 0.35), Colors.transparent],
                ),
              ),
            ),
          ),
          Positioned(
            top: 64,
            left: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _Hl.orb,
              ),
            ),
          ),
          Positioned(
            top: 120,
            right: 20,
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _Hl.accentLine.withValues(alpha: 0.65),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(horizontalPadding, 12, horizontalPadding, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: _Hl.surface.withValues(alpha: 0.92),
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(color: _Hl.cardEdge.withValues(alpha: 0.9)),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primary.withValues(alpha: 0.06),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Text(
                              'تسوّقي بأناقة',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primaryDark,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                          Container(
                            width: 52,
                            height: 4,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(3),
                              gradient: LinearGradient(
                                colors: [AppTheme.primary, _Hl.accentLine, AppTheme.primaryLight],
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            title,
                            style: GoogleFonts.cormorantGaramond(
                              fontSize: 36,
                              fontWeight: FontWeight.w700,
                              height: 1.02,
                              color: AppTheme.textPrimary,
                              letterSpacing: -0.6,
                            ),
                          ),
                          if (subtitle.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              subtitle,
                              style: TextStyle(
                                fontSize: 14.5,
                                height: 1.45,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    _HlRoundIconButton(icon: Icons.grid_view_rounded, onTap: onCategories),
                    const SizedBox(width: 10),
                    _HlRoundCartButton(count: cartCount, onTap: onCart),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    color: _Hl.surface,
                    border: Border.all(color: _Hl.cardEdge.withValues(alpha: 0.95), width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.11),
                        blurRadius: 32,
                        offset: const Offset(0, 14),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsetsDirectional.only(start: 10, end: 6, top: 8, bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _Hl.chipBg,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: _Hl.cardEdge.withValues(alpha: 0.7)),
                          ),
                          child: Icon(Icons.search_rounded, color: AppTheme.primaryDark, size: 22),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: searchController,
                            focusNode: searchFocusNode,
                            textInputAction: TextInputAction.search,
                            textAlignVertical: TextAlignVertical.center,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                            ),
                            decoration: InputDecoration(
                              isDense: true,
                              filled: false,
                              border: InputBorder.none,
                              hintText: 'ابحثي عن منتج، ماركة أو لمسة جمال…',
                              hintStyle: TextStyle(
                                fontSize: 14.5,
                                color: AppTheme.textMuted,
                                fontWeight: FontWeight.w500,
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                            ),
                            onSubmitted: (_) => onSubmitSearch(),
                          ),
                        ),
                        ValueListenableBuilder<TextEditingValue>(
                          valueListenable: searchController,
                          builder: (context, value, _) {
                            if (value.text.isEmpty) {
                              return const SizedBox.shrink();
                            }
                            return IconButton(
                              tooltip: 'مسح',
                              onPressed: () => searchController.clear(),
                              icon: Icon(Icons.close_rounded, size: 20, color: AppTheme.textMuted),
                            );
                          },
                        ),
                        IconButton(
                          tooltip: 'تصفية متقدمة',
                          onPressed: onFilterTap,
                          icon: Icon(
                            Icons.tune_rounded,
                            color: AppTheme.primaryDark.withValues(alpha: 0.9),
                            size: 24,
                          ),
                        ),
                        IconButton(
                          tooltip: 'بحث',
                          onPressed: onSubmitSearch,
                          icon: Icon(
                            Icons.arrow_forward_ios_rounded,
                            color: AppTheme.primary,
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                AnimatedSize(
                  duration: const Duration(milliseconds: 240),
                  curve: Curves.easeOutCubic,
                  alignment: Alignment.topCenter,
                  child: searchFocusNode.hasFocus && recentSearches.isNotEmpty
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(Icons.history_rounded, size: 18, color: AppTheme.textMuted),
                                const SizedBox(width: 6),
                                Text(
                                  'البحث الأخير',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                                const Spacer(),
                                TextButton(
                                  onPressed: onClearRecentSearches,
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: const Text('مسح الكل', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: recentSearches.take(6).map((s) {
                                return Material(
                                  color: _Hl.surface,
                                  borderRadius: BorderRadius.circular(20),
                                  child: InkWell(
                                    onTap: () => onRecentSearchTap(s),
                                    borderRadius: BorderRadius.circular(20),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: _Hl.cardEdge.withValues(alpha: 0.9)),
                                      ),
                                      constraints: const BoxConstraints(maxWidth: 200),
                                      child: Text(
                                        s,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HlRoundIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _HlRoundIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Ink(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _Hl.surface,
            border: Border.all(color: _Hl.cardEdge),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.08),
                blurRadius: 14,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: SizedBox(
            width: 48,
            height: 48,
            child: Icon(icon, size: 22, color: AppTheme.primaryDark),
          ),
        ),
      ),
    );
  }
}

class _HlRoundCartButton extends StatelessWidget {
  final int count;
  final VoidCallback onTap;

  const _HlRoundCartButton({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 0,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Ink(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _Hl.surface,
            border: Border.all(color: _Hl.cardEdge),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.08),
                blurRadius: 14,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: SizedBox(
            width: 48,
            height: 48,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                Icon(Icons.shopping_bag_outlined, size: 22, color: AppTheme.primaryDark),
                if (count > 0)
                  Positioned(
                    right: 0,
                    top: 2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Text(
                        count > 99 ? '99+' : '$count',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
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

// ═══════════════════════════════════════════════════════════════════════════
// فئات — أسفل الفئات الثانوية: شبكة عمودين + شريط «الكل»
// ═══════════════════════════════════════════════════════════════════════════

class _HomeCategoriesLight extends StatelessWidget {
  final double horizontalPadding;
  final List<Category> categories;
  final int selectedIndex;
  final String? Function(Category) getCatImage;
  final VoidCallback onSeeAll;
  final VoidCallback onSelectAll;
  final void Function(Category c, int index) onCategoryTap;

  const _HomeCategoriesLight({
    required this.horizontalPadding,
    required this.categories,
    required this.selectedIndex,
    required this.getCatImage,
    required this.onSeeAll,
    required this.onSelectAll,
    required this.onCategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    final cats = categories.take(4).toList();
    final moreCount = categories.length > 4 ? categories.length - 4 : 0;
    return Padding(
      padding: EdgeInsets.fromLTRB(horizontalPadding, 6, horizontalPadding, 8),
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
        decoration: BoxDecoration(
          color: _Hl.surface,
          borderRadius: BorderRadius.circular(36),
          border: Border.all(color: _Hl.cardEdge.withValues(alpha: 0.88)),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withValues(alpha: 0.05),
              blurRadius: 26,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: _Hl.chipBg,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _Hl.cardEdge),
                ),
                child: Icon(Icons.category_rounded, color: AppTheme.primaryDark, size: 21),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الفئات الرئيسية',
                      style: GoogleFonts.cormorantGaramond(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                        height: 1.05,
                      ),
                    ),
                    Text(
                      categories.length > 4
                          ? 'أربع فئات مختارة — المزيد في صفحة الفئات'
                          : 'اختيار سريع حسب القسم',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onSeeAll,
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primaryDark,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  backgroundColor: _Hl.chipBg,
                  side: BorderSide(color: _Hl.cardEdge),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                child: const Text('عرض الكل', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onSelectAll,
              borderRadius: BorderRadius.circular(20),
              child: Ink(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: selectedIndex == 0 ? _Hl.chipBg : _Hl.surface,
                  border: Border.all(
                    color: selectedIndex == 0 ? AppTheme.primary.withValues(alpha: 0.5) : _Hl.cardEdge,
                    width: selectedIndex == 0 ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: selectedIndex == 0 ? 0.14 : 0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _Hl.cardEdge),
                        ),
                        child: Icon(Icons.apps_rounded, color: AppTheme.primaryDark, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          'كل الفئات',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 16,
                        color: AppTheme.textMuted,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: cats.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.04,
            ),
            itemBuilder: (context, i) {
              final c = cats[i];
              final idx = i + 1;
              return _CategoryGridTile(
                category: c,
                imageUrl: getCatImage(c),
                active: selectedIndex == idx,
                onTap: () => onCategoryTap(c, idx),
              );
            },
          ),
          if (moreCount > 0) ...[
            const SizedBox(height: 12),
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onSeeAll,
                borderRadius: BorderRadius.circular(16),
                child: Ink(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: _Hl.chipBg,
                    border: Border.all(color: _Hl.cardEdge),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        Icon(Icons.layers_outlined, color: AppTheme.primaryDark, size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                moreCount == 1
                                    ? 'فئة إضافية واحدة'
                                    : '$moreCount فئات إضافية',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'انتقلي إلى صفحة الفئات لعرض الكل',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textMuted,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: AppTheme.primary),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
        ),
      ),
    );
  }
}

class _CategoryGridTile extends StatelessWidget {
  final Category category;
  final String? imageUrl;
  final bool active;
  final VoidCallback onTap;

  const _CategoryGridTile({
    required this.category,
    required this.imageUrl,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: _Hl.surface,
            border: Border.all(
              color: active ? AppTheme.primary.withValues(alpha: 0.55) : _Hl.cardEdge,
              width: active ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: active ? 0.16 : 0.05),
                blurRadius: active ? 18 : 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ColoredBox(
                        color: _Hl.chipBg,
                        child: imageUrl != null && imageUrl!.isNotEmpty
                            ? AppImage(url: imageUrl!, fit: BoxFit.cover)
                            : Center(
                                child: Icon(
                                  Icons.spa_rounded,
                                  size: 36,
                                  color: AppTheme.primary.withValues(alpha: 0.45),
                                ),
                              ),
                      ),
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Container(
                          height: 36,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.white.withValues(alpha: 0.95),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Text(
                  category.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: active ? FontWeight.w900 : FontWeight.w700,
                    color: active ? AppTheme.primaryDark : AppTheme.textPrimary,
                    height: 1.25,
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
// عنوان قسم — أيقونة في مربع فاتح
// ═══════════════════════════════════════════════════════════════════════════

class _HomeSectionLight extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback onSeeAll;
  final double horizontalPadding;

  const _HomeSectionLight({
    required this.title,
    this.subtitle,
    required this.icon,
    required this.onSeeAll,
    required this.horizontalPadding,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(horizontalPadding, 28, horizontalPadding, 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: _Hl.cardEdge.withValues(alpha: 0.7), width: 1),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              width: 4,
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [AppTheme.primary, _Hl.accentLine],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: _Hl.chipBg,
                border: Border.all(color: _Hl.cardEdge),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, color: AppTheme.primaryDark, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.cormorantGaramond(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      height: 1.05,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 3),
                    Text(
                      subtitle!,
                      style: TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.15,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            TextButton.icon(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.primaryDark,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              ),
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 12),
              label: const Text('الكل', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// عروض — بطاقات بإطار فاتح + تدرج ناعم على الصورة
// ═══════════════════════════════════════════════════════════════════════════

class _HomeOffersLight extends StatelessWidget {
  final List<Map> offers;
  final String Function(String?) imageUrl;
  final double horizontalPadding;
  final double cardWidth;
  final void Function(Map o) onOfferTap;

  const _HomeOffersLight({
    required this.offers,
    required this.imageUrl,
    required this.horizontalPadding,
    required this.cardWidth,
    required this.onOfferTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 218,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(horizontalPadding, 4, horizontalPadding, 22),
        itemCount: offers.length,
        itemBuilder: (_, i) {
          final o = offers[i];
          return Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 16),
            child: GestureDetector(
              onTap: () => onOfferTap(o),
              child: Container(
                width: cardWidth,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: _Hl.cardEdge.withValues(alpha: 0.95), width: 1.2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.12),
                      blurRadius: 26,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(26),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      AppImage(url: imageUrl(o['image']), fit: BoxFit.cover),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.white.withValues(alpha: 0.0),
                              AppTheme.primaryDark.withValues(alpha: 0.48),
                            ],
                            stops: const [0.35, 1.0],
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        left: 20,
                        right: 20,
                        child: Container(
                          height: 2,
                          decoration: BoxDecoration(
                            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(2)),
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                _Hl.accentLine.withValues(alpha: 0.9),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 14,
                        right: 14,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.92),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _Hl.cardEdge),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.auto_awesome_rounded, size: 14, color: AppTheme.primaryDark),
                              const SizedBox(width: 5),
                              Text(
                                'عرض',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.primaryDark,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 16,
                        right: 16,
                        bottom: 16,
                        child: Text(
                          o['discount_label'] ?? o['title'] ?? '',
                          style: GoogleFonts.cormorantGaramond(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                            height: 1.2,
                            shadows: const [
                              Shadow(color: Color(0x66000000), blurRadius: 8, offset: Offset(0, 2)),
                            ],
                          ),
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
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ماركات — دوائر بيضاء بحدود وردية خفيفة (سلايدر أفقي)
// ═══════════════════════════════════════════════════════════════════════════

class _HomeBrandsLight extends StatelessWidget {
  final List<Brand> brands;
  final String Function(String?) imageUrl;
  final double horizontalPadding;
  final void Function(Brand b) onBrandTap;

  const _HomeBrandsLight({
    required this.brands,
    required this.imageUrl,
    required this.horizontalPadding,
    required this.onBrandTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 114,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(horizontalPadding, 6, horizontalPadding, 24),
        itemCount: brands.length,
        itemBuilder: (_, i) {
          final b = brands[i];
          return Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 14),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => onBrandTap(b),
                borderRadius: BorderRadius.circular(28),
                child: Ink(
                  width: 86,
                  height: 86,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    color: _Hl.surface,
                    border: Border.all(color: _Hl.cardEdge, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.07),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _Hl.chipBg,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.all(10),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: b.logo != null
                          ? AppImage(url: imageUrl(b.logo), fit: BoxFit.contain)
                          : Center(
                              child: Text(
                                b.name.isNotEmpty ? b.name[0] : '?',
                                style: GoogleFonts.cormorantGaramond(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primaryDark,
                                ),
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// شيمر
// ═══════════════════════════════════════════════════════════════════════════

class _HomeLoadingShimmer extends StatelessWidget {
  final double ph;

  const _HomeLoadingShimmer({required this.ph});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(ph, 12, ph, 20),
            child: Shimmer.fromColors(
              baseColor: const Color(0xFFE4DFE8),
              highlightColor: const Color(0xFFFDFBFF),
              period: const Duration(milliseconds: 1200),
              child: Column(
                children: [
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD9D2DC),
                      borderRadius: BorderRadius.circular(44),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2DCE6),
                      borderRadius: BorderRadius.circular(32),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE5DFE8),
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

List<String> _parseFilterTags(dynamic raw) {
  if (raw is! List) return [];
  return raw
      .map((e) {
        if (e is Map) {
          return e['name']?.toString() ?? e['slug']?.toString() ?? e['tag']?.toString() ?? '';
        }
        return e.toString();
      })
      .where((s) => s.trim().isNotEmpty)
      .map((s) => s.trim())
      .take(24)
      .toList();
}

List<Map<String, String>> _parseFilterColors(dynamic raw) {
  if (raw is! List) return [];
  final out = <Map<String, String>>[];
  for (final e in raw) {
    if (e is Map) {
      final code = e['code']?.toString() ?? e['slug']?.toString() ?? '';
      final name = e['name']?.toString() ?? code;
      if (code.isNotEmpty) out.add({'name': name, 'code': code});
    }
  }
  return out.take(16).toList();
}

class _HomeFilterSectionTitle extends StatelessWidget {
  final IconData icon;
  final String title;

  const _HomeFilterSectionTitle({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primaryDark),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.cormorantGaramond(
            fontSize: 21,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _HomeFilterChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;

  const _HomeFilterChip({required this.label, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.pastelPink.withValues(alpha: 0.65),
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: AppTheme.primaryDark),
                const SizedBox(width: 6),
              ],
              Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeSubcategoryFilterTile extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final VoidCallback onTap;

  const _HomeSubcategoryFilterTile({
    required this.name,
    this.imageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: 88,
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _Hl.cardEdge),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 48,
                width: 48,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: imageUrl != null && imageUrl!.isNotEmpty
                      ? AppImage(url: imageUrl!, fit: BoxFit.cover, width: 48, height: 48)
                      : Center(child: Icon(Icons.layers_rounded, color: AppTheme.primary, size: 26)),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                name,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, height: 1.15),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
