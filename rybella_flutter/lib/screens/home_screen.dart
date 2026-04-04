import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import '../core/responsive.dart';
import '../core/theme.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../models/brand.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../providers/recently_viewed_provider.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import '../widgets/app_image.dart';
import '../widgets/product_card.dart';
import '../widgets/promo_banner.dart';
import '../widgets/quick_view.dart';
import '../widgets/stories_bar.dart';
import '../widgets/home_subcategories_section.dart';

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
  List<Product> _recentProducts = [];
  Map<String, dynamic>? _settings;
  bool _loading = true;
  int _selectedCategoryIndex = 0;
  int? _quickViewId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
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
    final icon = c.icon;
    if (icon != null && icon.isNotEmpty) {
      if (icon.startsWith('http') || icon.startsWith('/') || RegExp(r'\.(png|jpg|jpeg|gif|webp)$', caseSensitive: false).hasMatch(icon)) {
        return _img(icon);
      }
    }
    return c.image != null ? _img(c.image) : null;
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
                child: _HomeHeroHeader(
                  title: heroTitle,
                  subtitle: heroSubtitle,
                  cartCount: cart.totalCount,
                  horizontalPadding: ph,
                  onCategories: () => context.go('/categories'),
                  onCart: () => context.go('/cart'),
                  onSearch: () => context.go('/explore'),
                ),
              ),
              SliverToBoxAdapter(
                child: _HomeCategoriesPanel(
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
                ),
              ),
              const SliverToBoxAdapter(child: StoriesBar()),
              if (_banners.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(ph, 10, ph, 4),
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
                  ),
                ),
              if (_banners.isEmpty) const SliverToBoxAdapter(child: SizedBox(height: 6)),
              if (_subcategories.isNotEmpty)
                SliverToBoxAdapter(
                  child: HomeSubcategoriesSection(
                    subcategories: _subcategories,
                    imageUrl: _img,
                    onSubcategoryTap: _goExplore,
                  ),
                ),
              if (showOffers)
                SliverToBoxAdapter(
                  child: _HomeSectionTitle(
                    title: 'عروض حصرية',
                    icon: Icons.local_offer_rounded,
                    onSeeAll: () => context.push('/offers'),
                    horizontalPadding: ph,
                  ),
                ),
              if (showOffers)
                SliverToBoxAdapter(
                  child: _HomeOffersSlider(
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
                  ),
                ),
              if (_featured.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeSectionTitle(
                    title: 'المنتجات المميزة',
                    subtitle: 'اختياراتنا الخاصة لكِ',
                    icon: Icons.auto_awesome_rounded,
                    onSeeAll: () => context.go('/explore?featured=1'),
                    horizontalPadding: ph,
                  ),
                ),
              if (_featured.isNotEmpty)
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(ph, 0, ph, 8),
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: gridCols,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: gridAspect,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => ProductCard(
                        product: _featured[i],
                        colorIndex: i,
                        inWishlist: auth.isLoggedIn && wishlist.isInWishlist(_featured[i].id),
                        onWishlistTap: auth.isLoggedIn ? () => wishlist.toggle(_featured[i].id) : null,
                        onTap: () => context.push('/products/${_featured[i].id}'),
                        onQuickView: quickViewEnabled ? () => setState(() => _quickViewId = _featured[i].id) : null,
                      ),
                      childCount: _featured.length,
                    ),
                  ),
                ),
              if (_bestSellers.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeSectionTitle(
                    title: 'الأكثر مبيعاً',
                    icon: Icons.trending_up_rounded,
                    onSeeAll: () => context.go('/explore'),
                    horizontalPadding: ph,
                  ),
                ),
              if (_bestSellers.isNotEmpty)
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(ph, 0, ph, 8),
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
                  child: _HomeSectionTitle(
                    title: 'الماركات',
                    icon: Icons.workspace_premium_rounded,
                    onSeeAll: () => context.go('/brands'),
                    horizontalPadding: ph,
                  ),
                ),
              if (_brands.isNotEmpty)
                SliverToBoxAdapter(
                  child: _HomeBrandsSlider(
                    brands: _brands.take(12).toList(),
                    imageUrl: _img,
                    horizontalPadding: ph,
                    onBrandTap: (b) => _goExplore(brandId: b.id),
                  ),
                ),
              if (showRecent)
                SliverToBoxAdapter(
                  child: _HomeSectionTitle(
                    title: 'شاهدي مؤخراً',
                    icon: Icons.history_rounded,
                    onSeeAll: () => context.go('/explore'),
                    horizontalPadding: ph,
                  ),
                ),
              if (showRecent)
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(ph, 0, ph, 8),
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
              SliverToBoxAdapter(child: SizedBox(height: Responsive.isTablet(context) ? 40 : 28)),
            ],
          );

    return Stack(
      children: [
        Scaffold(
          backgroundColor: const Color(0xFFF5F3F4),
          body: SafeArea(
            bottom: false,
            child: RefreshIndicator(
              onRefresh: _load,
              color: AppTheme.primary,
              edgeOffset: 8,
              child: body,
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

// ─────────────────────────────────────────────────────────────────────────────
// رأس الصفحة — منحنٍ سفليّ + بحث
// ─────────────────────────────────────────────────────────────────────────────

class _HomeHeroHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final int cartCount;
  final double horizontalPadding;
  final VoidCallback onCategories;
  final VoidCallback onCart;
  final VoidCallback onSearch;

  const _HomeHeroHeader({
    required this.title,
    required this.subtitle,
    required this.cartCount,
    required this.horizontalPadding,
    required this.onCategories,
    required this.onCart,
    required this.onSearch,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(32),
        bottomRight: Radius.circular(32),
      ),
      child: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFFFFFFF),
              Color(0xFFFFF5F8),
              Color(0xFFFFEEF3),
            ],
            stops: [0.0, 0.45, 1.0],
          ),
        ),
        child: Padding(
          padding: EdgeInsets.fromLTRB(horizontalPadding, 12, horizontalPadding, 22),
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
                        Text(
                          title,
                          style: GoogleFonts.cormorantGaramond(
                            fontSize: 32,
                            fontWeight: FontWeight.w700,
                            height: 1.05,
                            color: AppTheme.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        if (subtitle.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            subtitle,
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.4,
                              color: AppTheme.textSecondary.withValues(alpha: 0.92),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  _HomeIconCircle(icon: Icons.grid_view_rounded, onTap: onCategories),
                  const SizedBox(width: 10),
                  _HomeCartBadge(count: cartCount, onTap: onCart),
                ],
              ),
              const SizedBox(height: 18),
              Material(
                color: Colors.white,
                elevation: 0,
                borderRadius: BorderRadius.circular(26),
                child: InkWell(
                  onTap: onSearch,
                  borderRadius: BorderRadius.circular(26),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(26),
                      border: Border.all(color: AppTheme.border),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.08),
                          blurRadius: 24,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primarySoft,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.search_rounded, color: AppTheme.primary, size: 22),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'ابحثي عن منتج أو ماركة…',
                            style: TextStyle(
                              fontSize: 15,
                              color: AppTheme.textMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Icon(Icons.tune_rounded, color: AppTheme.primary.withValues(alpha: 0.85), size: 22),
                      ],
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

class _HomeIconCircle extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _HomeIconCircle({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 46,
          height: 46,
          child: Icon(icon, size: 22, color: AppTheme.textPrimary),
        ),
      ),
    );
  }
}

class _HomeCartBadge extends StatelessWidget {
  final int count;
  final VoidCallback onTap;

  const _HomeCartBadge({required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 46,
          height: 46,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              const Icon(Icons.shopping_bag_outlined, size: 22, color: AppTheme.textPrimary),
              if (count > 0)
                Positioned(
                  right: 2,
                  top: 5,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.35),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Text(
                      count > 99 ? '99+' : '$count',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
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

// ─────────────────────────────────────────────────────────────────────────────
// لوحة الفئات — أفقي (سلايدر)
// ─────────────────────────────────────────────────────────────────────────────

class _HomeCategoriesPanel extends StatelessWidget {
  final double horizontalPadding;
  final List<Category> categories;
  final int selectedIndex;
  final String? Function(Category) getCatImage;
  final VoidCallback onSeeAll;
  final VoidCallback onSelectAll;
  final void Function(Category c, int index) onCategoryTap;

  const _HomeCategoriesPanel({
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
    final cats = categories.take(8).toList();
    return Padding(
      padding: EdgeInsets.fromLTRB(horizontalPadding, 16, horizontalPadding, 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        elevation: 0,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppTheme.border.withValues(alpha: 0.85)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'الفئات',
                    style: GoogleFonts.cormorantGaramond(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: onSeeAll,
                    style: TextButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    ),
                    child: const Text('الكل', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 102,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: 1 + cats.length,
                  itemBuilder: (_, i) {
                    if (i == 0) {
                      return Padding(
                        padding: const EdgeInsets.only(left: 2),
                        child: _CategoryOrb(
                          label: 'الكل',
                          icon: Icons.apps_rounded,
                          imageUrl: null,
                          active: selectedIndex == 0,
                          onTap: onSelectAll,
                        ),
                      );
                    }
                    final c = cats[i - 1];
                    final idx = i;
                    return Padding(
                      padding: const EdgeInsets.only(left: 12),
                      child: _CategoryOrb(
                        label: c.name,
                        icon: Icons.category_rounded,
                        imageUrl: getCatImage(c),
                        active: selectedIndex == idx,
                        onTap: () => onCategoryTap(c, idx),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryOrb extends StatelessWidget {
  final String label;
  final IconData icon;
  final String? imageUrl;
  final bool active;
  final VoidCallback onTap;

  const _CategoryOrb({
    required this.label,
    required this.icon,
    this.imageUrl,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            width: 66,
            height: 66,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: active ? AppTheme.primarySoft : Colors.white,
              border: Border.all(
                color: active ? AppTheme.primary : AppTheme.border,
                width: active ? 2.5 : 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: active ? AppTheme.primary.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.05),
                  blurRadius: active ? 16 : 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipOval(
              child: imageUrl != null && imageUrl!.isNotEmpty
                  ? AppImage(url: imageUrl!, fit: BoxFit.cover, width: 66, height: 66)
                  : Center(
                      child: Icon(
                        icon,
                        size: 28,
                        color: active ? AppTheme.primary : AppTheme.textMuted,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: 76,
            height: 16,
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                color: active ? AppTheme.primaryDark : AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// عناوين الأقسام
// ─────────────────────────────────────────────────────────────────────────────

class _HomeSectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback onSeeAll;
  final double horizontalPadding;

  const _HomeSectionTitle({
    required this.title,
    this.subtitle,
    required this.icon,
    required this.onSeeAll,
    required this.horizontalPadding,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(horizontalPadding, 26, horizontalPadding, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppTheme.primary.withValues(alpha: 0.12),
                  AppTheme.primary.withValues(alpha: 0.06),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.15)),
            ),
            child: Icon(icon, color: AppTheme.primary, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.cormorantGaramond(
                    fontSize: 23,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                    height: 1.15,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: TextStyle(
                      fontSize: 12.5,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
          TextButton(
            onPressed: onSeeAll,
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            ),
            child: const Text('الكل', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// سلايدر العروض (ListView أفقي)
// ─────────────────────────────────────────────────────────────────────────────

class _HomeOffersSlider extends StatelessWidget {
  final List<Map> offers;
  final String Function(String?) imageUrl;
  final double horizontalPadding;
  final double cardWidth;
  final void Function(Map o) onOfferTap;

  const _HomeOffersSlider({
    required this.offers,
    required this.imageUrl,
    required this.horizontalPadding,
    required this.cardWidth,
    required this.onOfferTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 196,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(horizontalPadding, 4, horizontalPadding, 16),
        itemCount: offers.length,
        itemBuilder: (_, i) {
          final o = offers[i];
          return Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 14),
            child: GestureDetector(
              onTap: () => onOfferTap(o),
              child: Container(
                width: cardWidth,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.12),
                      blurRadius: 22,
                      offset: const Offset(0, 12),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
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
                              Colors.black.withValues(alpha: 0.05),
                              Colors.black.withValues(alpha: 0.78),
                            ],
                            stops: const [0.35, 1.0],
                          ),
                        ),
                      ),
                      Positioned(
                        top: 14,
                        right: 14,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.star_rounded, size: 16, color: AppTheme.primary),
                              const SizedBox(width: 4),
                              Text(
                                'عرض',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.primary,
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
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            height: 1.25,
                            shadows: [Shadow(color: Colors.black45, blurRadius: 8, offset: Offset(0, 2))],
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

// ─────────────────────────────────────────────────────────────────────────────
// سلايدر الماركات (ListView أفقي)
// ─────────────────────────────────────────────────────────────────────────────

class _HomeBrandsSlider extends StatelessWidget {
  final List<Brand> brands;
  final String Function(String?) imageUrl;
  final double horizontalPadding;
  final void Function(Brand b) onBrandTap;

  const _HomeBrandsSlider({
    required this.brands,
    required this.imageUrl,
    required this.horizontalPadding,
    required this.onBrandTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(horizontalPadding, 4, horizontalPadding, 20),
        itemCount: brands.length,
        itemBuilder: (_, i) {
          final b = brands[i];
          return Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 12),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              elevation: 0,
              child: InkWell(
                onTap: () => onBrandTap(b),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 76,
                  height: 76,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.border),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: b.logo != null
                        ? AppImage(url: imageUrl(b.logo), fit: BoxFit.contain)
                        : Center(
                            child: Text(
                              b.name.isNotEmpty ? b.name[0] : '?',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primary,
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

// ─────────────────────────────────────────────────────────────────────────────
// شيمر التحميل
// ─────────────────────────────────────────────────────────────────────────────

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
            padding: EdgeInsets.fromLTRB(ph, 16, ph, 16),
            child: Shimmer.fromColors(
              baseColor: const Color(0xFFE6E6E6),
              highlightColor: const Color(0xFFF8F8F8),
              period: const Duration(milliseconds: 1100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDDDDDD),
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    height: 52,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDDDDDD),
                      borderRadius: BorderRadius.circular(26),
                    ),
                  ),
                  const SizedBox(height: 22),
                  Container(
                    height: 140,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDDDDDD),
                      borderRadius: BorderRadius.circular(22),
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
