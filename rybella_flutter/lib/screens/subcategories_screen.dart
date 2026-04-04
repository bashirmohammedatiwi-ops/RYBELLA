import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/responsive.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../models/category.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';

class SubcategoriesScreen extends StatefulWidget {
  const SubcategoriesScreen({super.key});

  @override
  State<SubcategoriesScreen> createState() => _SubcategoriesScreenState();
}

class _SubcategoriesScreenState extends State<SubcategoriesScreen> {
  List<Subcategory> _subcategories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await ApiService.getSubcategories();
    if (mounted) {
      setState(() {
        _subcategories = list;
        _loading = false;
      });
    }
  }

  String _img(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${AppConfig.imgBase}$path';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFFBFB), Color(0xFFFDF8F9)],
          ),
        ),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(child: _buildHeader(context)),
                  if (_subcategories.isEmpty)
                    const SliverFillRemaining(
                      child: Center(
                        child: Text(
                          'لا توجد أنواع',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: EdgeInsets.fromLTRB(
                        Responsive.pagePaddingH(context),
                        0,
                        Responsive.pagePaddingH(context),
                        100,
                      ),
                      sliver: SliverGrid(
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: Responsive.categoryGridColumns(context),
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: Responsive.categoryChildAspectRatio(context),
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (_, i) {
                            final sc = _subcategories[i];
                            return _SubcategoryCard(
                              subcategory: sc,
                              imageUrl: sc.image != null ? _img(sc.image) : null,
                              onTap: () => context.go('/explore?subcategory=${sc.id}'),
                            );
                          },
                          childCount: _subcategories.length,
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.primary,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.arrow_forward,
                        size: 20,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'تسوقي حسب النوع',
                        style: GoogleFonts.cormorantGaramond(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_subcategories.length} نوع',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SubcategoryCard extends StatelessWidget {
  final Subcategory subcategory;
  final String? imageUrl;
  final VoidCallback onTap;

  const _SubcategoryCard({
    required this.subcategory,
    required this.imageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppTheme.primary.withOpacity(0.15),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
              BoxShadow(
                color: AppTheme.primary.withOpacity(0.06),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Expanded(
                flex: 3,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: imageUrl != null && imageUrl!.isNotEmpty
                        ? AppImage(url: imageUrl!, fit: BoxFit.cover)
                        : Container(
                            decoration: BoxDecoration(
                              color: AppTheme.primarySoft,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              Icons.category_rounded,
                              size: 36,
                              color: AppTheme.primary,
                            ),
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
                child: Text(
                  subcategory.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
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
