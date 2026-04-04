import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
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
    final heroSubtitle = _settings?['hero_subtitle'] ?? 'الجمال الذي تستحقينه';
    final showRecent = _settings?['show_recently_viewed'] != '0' && _recentProducts.isNotEmpty;
    final quickViewEnabled = _settings?['quick_view_enabled'] != '0';
    final showOffers = _settings?['show_offers'] != '0' && _offers.isNotEmpty;

    final body = _loading
        ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
        : CustomScrollView(
            slivers: [
                        // 1. Hero + Header
                        SliverToBoxAdapter(
                          child: _buildHeader(context, heroTitle, cart.totalCount),
                        ),
                        // 2. الفئات (دوائر بيضاء بحدود وردية - مثل الصورة)
                        SliverToBoxAdapter(
                          child: _buildCategoryChips(),
                        ),
                        // 3. اليوميات (أسفل الفئات - مثل انستغرام)
                        const SliverToBoxAdapter(
                          child: StoriesBar(),
                        ),
                        // 4. البانرات (مرفوعة لأعلى لتقليل المسافة مع اليوميات)
                        if (_banners.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Transform.translate(
                              offset: const Offset(0, -50),
                              child: Padding(
                                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
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
                          ),
                        if (_banners.isEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Text(
                                heroTitle,
                                style: GoogleFonts.cormorantGaramond(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ),
                          ),
                        // 5. الفئات الثانوية
                        if (_subcategories.isNotEmpty)
                          SliverToBoxAdapter(
                            child: HomeSubcategoriesSection(
                              subcategories: _subcategories,
                              imageUrl: _img,
                              onSubcategoryTap: _goExplore,
                            ),
                          ),
                        // 6. العروض الحصرية
                        if (showOffers)
                          SliverToBoxAdapter(
                            child: _buildSectionHeader('عروض حصرية', () => context.push('/offers')),
                          ),
                        if (showOffers)
                          SliverToBoxAdapter(
                            child: SizedBox(
                              height: 180,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                physics: const BouncingScrollPhysics(),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                itemCount: _offers.length,
                                itemBuilder: (_, i) {
                                  final o = _offers[i];
                                  return Padding(
                                    padding: const EdgeInsets.only(left: 14),
                                    child: GestureDetector(
                                      onTap: () => o['product_ids'] != null
                                          ? context.push('/offers/${o['id']}')
                                          : context.go('/explore'),
                                      child: Container(
                                        width: 300,
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(22),
                                          boxShadow: [
                                            BoxShadow(
                                              color: AppTheme.primary.withOpacity(0.1),
                                              blurRadius: 20,
                                              offset: const Offset(0, 8),
                                            ),
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.05),
                                              blurRadius: 12,
                                              offset: const Offset(0, 4),
                                            ),
                                          ],
                                        ),
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(22),
                                          child: Stack(
                                            fit: StackFit.expand,
                                            children: [
                                              AppImage(url: _img(o['image']), fit: BoxFit.cover),
                                              Container(
                                                decoration: BoxDecoration(
                                                  gradient: LinearGradient(
                                                    begin: Alignment.topCenter,
                                                    end: Alignment.bottomCenter,
                                                    colors: [
                                                      Colors.transparent,
                                                      Colors.black.withOpacity(0.75),
                                                    ],
                                                    stops: const [0.4, 1.0],
                                                  ),
                                                ),
                                              ),
                                              Positioned(
                                                top: 12,
                                                right: 12,
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                                  decoration: BoxDecoration(
                                                    color: AppTheme.primary,
                                                    borderRadius: BorderRadius.circular(10),
                                                    boxShadow: [
                                                      BoxShadow(
                                                        color: AppTheme.primary.withOpacity(0.4),
                                                        blurRadius: 6,
                                                        offset: const Offset(0, 2),
                                                      ),
                                                    ],
                                                  ),
                                                  child: const Text(
                                                    'عرض حصري',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w700,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              Positioned(
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                child: Padding(
                                                  padding: const EdgeInsets.all(16),
                                                  child: Text(
                                                    o['discount_label'] ?? o['title'] ?? '',
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.w700,
                                                      height: 1.2,
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
                                },
                              ),
                            ),
                          ),
                        // 7. المنتجات المميزة
                        if (_featured.isNotEmpty)
                          SliverToBoxAdapter(
                            child: _buildSectionHeader('المنتجات المميزة', () => context.go('/explore?featured=1'), subtitle: 'اختياراتنا الخاصة لكِ'),
                          ),
                        if (_featured.isNotEmpty)
                          SliverPadding(
                            padding: const EdgeInsets.all(16),
                            sliver: SliverGrid(
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio: 0.65,
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
                        // 8. الأكثر مبيعاً
                        if (_bestSellers.isNotEmpty)
                          SliverToBoxAdapter(
                            child: _buildSectionHeader('الأكثر مبيعاً', () => context.go('/explore')),
                          ),
                        if (_bestSellers.isNotEmpty)
                          SliverPadding(
                            padding: const EdgeInsets.all(16),
                            sliver: SliverGrid(
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio: 0.65,
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
                        // 9. الماركات
                        if (_brands.isNotEmpty)
                          SliverToBoxAdapter(
                            child: _buildSectionHeader('الماركات', () => context.go('/brands')),
                          ),
                        if (_brands.isNotEmpty)
                          SliverToBoxAdapter(
                            child: SizedBox(
                              height: 80,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                itemCount: _brands.take(8).length,
                                itemBuilder: (_, i) {
                                  final b = _brands[i];
                                  return Padding(
                                    padding: const EdgeInsets.only(left: 12),
                                    child: GestureDetector(
                                      onTap: () => _goExplore(brandId: b.id),
                                      child: Container(
                                        width: 64,
                                        height: 64,
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(18),
                                          boxShadow: [
                                            BoxShadow(
                                              color: AppTheme.primary.withOpacity(0.06),
                                              blurRadius: 10,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                        ),
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(18),
                                          child: b.logo != null
                                              ? AppImage(url: _img(b.logo), fit: BoxFit.contain)
                                              : Center(
                                                  child: Text(
                                                    b.name.isNotEmpty ? b.name[0] : '?',
                                                    style: const TextStyle(
                                                      fontSize: 20,
                                                      fontWeight: FontWeight.w700,
                                                      color: AppTheme.primary,
                                                    ),
                                                  ),
                                                ),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        // 10. شاهدي مؤخراً
                        if (showRecent)
                          SliverToBoxAdapter(
                            child: _buildSectionHeader('شاهدي مؤخراً', () => context.go('/explore')),
                          ),
                        if (showRecent)
                          SliverPadding(
                            padding: const EdgeInsets.all(16),
                            sliver: SliverGrid(
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio: 0.65,
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
            ],
          );

    return Stack(
      children: [
        Scaffold(
          backgroundColor: Colors.white,
          body: SafeArea(
            child: RefreshIndicator(
              onRefresh: _load,
              color: AppTheme.primary,
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

  Widget _buildHeader(BuildContext context, String title, int cartCount) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => context.go('/categories'),
                icon: const Icon(Icons.grid_view_rounded, size: 24, color: AppTheme.textPrimary),
              ),
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    onPressed: () => context.go('/cart'),
                    icon: const Icon(Icons.shopping_bag_outlined, size: 24, color: AppTheme.textPrimary),
                  ),
                  if (cartCount > 0)
                    Positioned(
                      right: 4,
                      top: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          cartCount > 99 ? '99+' : '$cartCount',
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
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => context.go('/explore'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search, size: 22, color: AppTheme.textMuted),
                        const SizedBox(width: 12),
                        Text(
                          'ابحثي...',
                          style: TextStyle(fontSize: 15, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Material(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: () => context.go('/explore'),
                  borderRadius: BorderRadius.circular(14),
                  child: const Padding(
                    padding: EdgeInsets.all(14),
                    child: Icon(Icons.tune_rounded, color: Colors.white, size: 24),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChips() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 2, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // عنوان "الفئات" مع رابط "الكل" باللون الوردي
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'الفئات',
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _selectedCategoryIndex = 0),
                child: const Text(
                  'الكل',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // قائمة دوائر الفئات (بيضاء بحد وردي، صورة/أيقونة داخل الدائرة، اسم أسفلها)
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _categories.take(8).length + 1,
              itemBuilder: (_, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(left: 12),
                    child: _CategoryCircle(
                      label: 'الكل',
                      icon: Icons.apps_rounded,
                      imageUrl: null,
                      isActive: _selectedCategoryIndex == 0,
                      onTap: () => setState(() => _selectedCategoryIndex = 0),
                    ),
                  );
                }
                final c = _categories[i - 1];
                final img = _getCatImage(c);
                return Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: _CategoryCircle(
                    label: c.name,
                    icon: Icons.category_rounded,
                    imageUrl: img,
                    isActive: _selectedCategoryIndex == i,
                    onTap: () {
                      setState(() => _selectedCategoryIndex = i);
                      _goExplore(categoryId: c.id);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, VoidCallback onAll, {String? subtitle}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ],
          ),
          TextButton(
            onPressed: onAll,
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            child: const Text('الكل'),
          ),
        ],
      ),
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

/// دائرة فئة - مثل الصورة (خلفية بيضاء، حد وردي رفيع، صورة/أيقونة داخل الدائرة، اسم أسفلها)
class _CategoryCircle extends StatelessWidget {
  final String label;
  final IconData icon;
  final String? imageUrl;
  final bool isActive;
  final VoidCallback onTap;

  const _CategoryCircle({
    required this.label,
    required this.icon,
    this.imageUrl,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(
                color: isActive ? AppTheme.primary : AppTheme.primary.withOpacity(0.4),
                width: isActive ? 2 : 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipOval(
              child: imageUrl != null && imageUrl!.isNotEmpty
                  ? AppImage(url: imageUrl!, fit: BoxFit.cover, width: 64, height: 64)
                  : Center(
                      child: Icon(
                        icon,
                        size: 28,
                        color: isActive ? AppTheme.primary : AppTheme.textMuted,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: 72,
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
