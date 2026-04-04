import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../models/product.dart';
import '../widgets/app_image.dart';
import '../models/category.dart';
import '../models/brand.dart';
import '../providers/auth_provider.dart';
import '../providers/wishlist_provider.dart';
import '../services/api_service.dart';
import '../widgets/product_card.dart';

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

class _ExploreScreenState extends State<ExploreScreen> {
  List<Product> _products = [];
  List<Category> _categories = [];
  List<Subcategory> _subcategories = [];
  List<Brand> _brands = [];
  List<String> _tags = [];
  List<Map<String, dynamic>> _colors = [];
  bool _loading = true;
  String _sortBy = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.search ?? '';
    _loadFilters();
    _loadProducts();
  }

  @override
  void didUpdateWidget(covariant ExploreScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
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
    final f = await ApiService.getFilters();
    final cats = await ApiService.getCategories();
    final brs = await ApiService.getBrands();
    setState(() {
      _categories = cats;
      _brands = brs;
      _tags = List<String>.from(f['tags'] ?? []);
      _colors = (f['colors'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [];
    });
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    if (widget.categoryId != null) {
      _subcategories =
          await ApiService.getSubcategories(categoryId: widget.categoryId);
    }
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
      if (v.isEmpty)
        params.remove(k);
      else
        params[k] = v;
    });
    final q = params.isEmpty
        ? ''
        : '?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
    return '/explore$q';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final wishlist = context.watch<WishlistProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F9),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ─── الشريط الجانبي للفئات ───
          _CategorySidebar(
            categories: _categories,
            selectedCategoryId: widget.categoryId,
            onCategoryTap: (id) => context.go(id == null ? '/explore' : _buildUrl(overrides: {
              'category_id': id.toString(),
              'subcategory_id': '',
            })),
          ),
          // ─── المحتوى الرئيسي ───
          Expanded(
            child: CustomScrollView(
              slivers: [
                // ─── هيدر ───
                SliverAppBar(
                  expandedHeight: 120,
                  floating: false,
                  pinned: true,
                  backgroundColor: Colors.white,
                  elevation: 0,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppTheme.pastelPink.withOpacity(0.5),
                            Colors.white,
                          ],
                        ),
                      ),
                    ),
                    titlePadding: const EdgeInsets.only(right: 20, bottom: 14),
                    centerTitle: false,
                    title: Text(
                      'المنتجات',
                      style: GoogleFonts.cormorantGaramond(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  actions: [
                    IconButton(
                      onPressed: () => _showSortSheet(),
                      icon: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary.withOpacity(0.12),
                              blurRadius: 12,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.sort_rounded,
                          size: 20,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                ),
                // ─── شريط البحث ───
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'ابحثي عن أحمر الشفاه، ظلال العيون...',
                          hintStyle: TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 14,
                          ),
                          prefixIcon: Icon(
                            Icons.search_rounded,
                            color: AppTheme.primary.withOpacity(0.85),
                            size: 22,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              Icons.arrow_forward_rounded,
                              color: AppTheme.primary,
                              size: 20,
                            ),
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              context.go(_buildUrl(
                                  overrides: {'search': _searchController.text}));
                            },
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 16),
                        ),
                        onSubmitted: (v) =>
                            context.go(_buildUrl(overrides: {'search': v})),
                      ),
                    ),
                  ),
                ),
                // ─── فلاتر أفقية ───
                if (_categories.isNotEmpty || _brands.isNotEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: SizedBox(
                        height: 48,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          children: [
                            _FilterPill(
                              label: 'الكل',
                              active: widget.categoryId == null &&
                                  widget.brandId == null &&
                                  widget.tag == null &&
                                  widget.colorCode == null,
                              onTap: () => context.go('/explore'),
                            ),
                            ..._categories.map((c) => _FilterPill(
                                  label: c.name,
                                  active: widget.categoryId == c.id,
                                  onTap: () => context.go(_buildUrl(overrides: {
                                    'category_id': c.id.toString(),
                                    'subcategory_id': '',
                                  })),
                                )),
                            ..._brands.take(3).map((b) => _FilterPill(
                                  label: b.name,
                                  active: widget.brandId == b.id,
                                  onTap: () => context.go(_buildUrl(
                                      overrides: {'brand_id': b.id.toString()})),
                                )),
                          ],
                        ),
                      ),
                    ),
                  ),
                // ─── شبكة المنتجات ───
                _loading
                    ? const SliverFillRemaining(
                        child: Center(
                          child: SizedBox(
                            width: 40,
                            height: 40,
                            child: CircularProgressIndicator(
                              color: AppTheme.primary,
                              strokeWidth: 2.5,
                            ),
                          ),
                        ),
                      )
                    : _products.isEmpty
                        ? SliverFillRemaining(
                            child: _EmptyProductsState(),
                          )
                        : SliverPadding(
                            padding: const EdgeInsets.fromLTRB(12, 0, 12, 100),
                            sliver: SliverGrid(
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio: 0.62,
                              ),
                        delegate: SliverChildBuilderDelegate(
                          (_, i) {
                            final p = _products[i];
                            return GestureDetector(
                              onTap: () =>
                                  context.push('/products/${p.id}'),
                              child: ProductCard(
                                product: p,
                                inWishlist:
                                    auth.isLoggedIn &&
                                    wishlist.isInWishlist(p.id),
                                onWishlistTap: auth.isLoggedIn
                                    ? () => wishlist.toggle(p.id)
                                    : null,
                                onTap: () =>
                                    context.push('/products/${p.id}'),
                              ),
                            )
                                .animate()
                                .fadeIn(delay: (i * 35).ms)
                                .slideY(
                                    begin: 0.06,
                                    end: 0,
                                    curve: Curves.easeOutCubic);
                          },
                          childCount: _products.length,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
    );
  }

  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'ترتيب المنتجات',
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 20),
              _SortOption(
                label: 'الافتراضي',
                selected: _sortBy.isEmpty,
                onTap: () {
                  setState(() => _sortBy = '');
                  _loadProducts();
                  Navigator.pop(context);
                },
              ),
              _SortOption(
                label: 'السعر: من الأقل للأعلى',
                selected: _sortBy == 'price_asc',
                onTap: () {
                  setState(() => _sortBy = 'price_asc');
                  _loadProducts();
                  Navigator.pop(context);
                },
              ),
              _SortOption(
                label: 'السعر: من الأعلى للأقل',
                selected: _sortBy == 'price_desc',
                onTap: () {
                  setState(() => _sortBy = 'price_desc');
                  _loadProducts();
                  Navigator.pop(context);
                },
              ),
              _SortOption(
                label: 'الأحدث',
                selected: _sortBy == 'newest',
                onTap: () {
                  setState(() => _sortBy = 'newest');
                  _loadProducts();
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategorySidebar extends StatelessWidget {
  final List<Category> categories;
  final int? selectedCategoryId;
  final ValueChanged<int?> onCategoryTap;

  const _CategorySidebar({
    required this.categories,
    required this.selectedCategoryId,
    required this.onCategoryTap,
  });

  static IconData _iconForCategory(Category c) {
    final name = (c.name).toLowerCase();
    if (name.contains('شفاه') || name.contains('lip')) return Icons.face_rounded;
    if (name.contains('عطور') || name.contains('perfume')) return Icons.spa_rounded;
    if (name.contains('عناية') || name.contains('care')) return Icons.auto_awesome_rounded;
    if (name.contains('مكياج') || name.contains('makeup')) return Icons.brush_rounded;
    if (name.contains('بشرة') || name.contains('skin')) return Icons.dry_cleaning_rounded;
    return Icons.category_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      margin: const EdgeInsets.fromLTRB(10, 80, 0, 12),
      decoration: BoxDecoration(
        color: const Color(0xFFB84A6B),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 14),
          _SidebarItem(
            icon: Icons.grid_view_rounded,
            iconUrl: null,
            selected: selectedCategoryId == null,
            onTap: () => onCategoryTap(null),
          ),
          const SizedBox(height: 8),
          ...categories.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _SidebarItem(
                  icon: _iconForCategory(c),
                  iconUrl: c.icon ?? c.image,
                  selected: selectedCategoryId == c.id,
                  onTap: () => onCategoryTap(c.id),
                ),
              )),
          const SizedBox(height: 14),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String? iconUrl;
  final bool selected;
  final VoidCallback onTap;

  const _SidebarItem({
    required this.icon,
    this.iconUrl,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasIconUrl = iconUrl != null && iconUrl!.isNotEmpty;
    final fullIconUrl = hasIconUrl && !iconUrl!.startsWith('http')
        ? '${AppConfig.imgBase}$iconUrl'
        : iconUrl;

    const sidebarPrimary = Color(0xFFB84A6B);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        width: 42,
        height: 42,
        margin: const EdgeInsets.symmetric(horizontal: 11),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          shape: BoxShape.circle,
          border: selected
              ? Border.all(color: sidebarPrimary.withOpacity(0.4), width: 2)
              : null,
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: sidebarPrimary.withOpacity(0.4),
                    blurRadius: 12,
                    spreadRadius: 1,
                    offset: const Offset(0, 2),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.6),
                    blurRadius: 6,
                    spreadRadius: 0,
                    offset: Offset.zero,
                  ),
                  BoxShadow(
                    color: Colors.black.withOpacity(0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: ClipOval(
          child: hasIconUrl && fullIconUrl != null
              ? SizedBox(
                  width: 42,
                  height: 42,
                  child: AppImage(
                    url: fullIconUrl,
                    fit: BoxFit.cover,
                  ),
                )
              : Center(
                  child: Icon(
                    icon,
                    size: 20,
                    color: selected
                        ? const Color(0xFFB84A6B)
                        : Colors.white.withOpacity(0.95),
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
      padding: const EdgeInsets.symmetric(horizontal: 5),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: active ? AppTheme.primary : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: active ? AppTheme.primary : AppTheme.border,
                width: 1.5,
              ),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.22),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
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
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
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
    return ListTile(
      title: Text(
        label,
        style: TextStyle(
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? AppTheme.primary : AppTheme.textPrimary,
        ),
      ),
      trailing: selected
          ? Icon(Icons.check_rounded, color: AppTheme.primary, size: 22)
          : null,
      onTap: onTap,
    );
  }
}

class _EmptyProductsState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppTheme.pastelPink.withOpacity(0.5),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(
                Icons.auto_awesome_outlined,
                size: 44,
                color: AppTheme.primary.withOpacity(0.75),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'لا توجد منتجات',
              style: GoogleFonts.cormorantGaramond(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'جربي تغيير الفلاتر أو البحث عن منتج آخر',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
