import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../models/category.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<Category> _categories = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await ApiService.getCategories();
    if (mounted) {
      setState(() {
        _categories = list;
        _loading = false;
      });
    }
  }

  String _img(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${AppConfig.imgBase}$path';
  }

  bool _iconIsImage(String? icon) {
    if (icon == null || icon.isEmpty) return false;
    return icon.startsWith('/') ||
        icon.startsWith('http') ||
        RegExp(r'\.(png|jpg|jpeg|gif|webp)$', caseSensitive: false).hasMatch(icon);
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
                // هيدر وردي مع زوايا مدورة
                SliverToBoxAdapter(
                  child: _buildHeader(context),
                ),
                if (_categories.isEmpty)
                  const SliverFillRemaining(
                    child: Center(
                      child: Text('لا توجد فئات', style: TextStyle(color: AppTheme.textMuted)),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) {
                          final c = _categories[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _CategoryCard(
                              category: c,
                              imageUrl: c.image != null ? _img(c.image) : null,
                              iconUrl: _iconIsImage(c.icon) ? _img(c.icon) : null,
                              onTap: () => context.go('/explore?category=${c.id}'),
                            ),
                          );
                        },
                        childCount: _categories.length,
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
                      const Text(
                        'الفئات',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_categories.length} تصنيف',
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

class _CategoryCard extends StatelessWidget {
  final Category category;
  final String? imageUrl;
  final String? iconUrl;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.category,
    required this.imageUrl,
    required this.iconUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null && imageUrl!.isNotEmpty;
    final hasOverlayText = category.overlayText != null && category.overlayText!.trim().isNotEmpty;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          height: 160,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
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
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // الصورة الأساسية
              if (hasImage)
                AppImage(url: imageUrl!, fit: BoxFit.cover)
              else
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.primaryLight.withOpacity(0.4),
                        AppTheme.primarySoft,
                      ],
                    ),
                  ),
                ),
              // تدرج داكن للأسفل
              if (hasImage)
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.4),
                          Colors.black.withOpacity(0.7),
                        ],
                      ),
                    ),
                  ),
                ),
              // المحتوى
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // الصف العلوي: اللوغو + نص الوصف
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // اللوغو/الأيقونة - أعلى يمين
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: hasImage ? Colors.white.withOpacity(0.35) : Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: iconUrl != null && iconUrl!.isNotEmpty
                              ? ClipOval(
                                  child: AppImage(url: iconUrl!, fit: BoxFit.cover),
                                )
                              : Icon(
                                  Icons.category_rounded,
                                  size: 24,
                                  color: hasImage ? Colors.white : AppTheme.primary,
                                ),
                        ),
                        // نص الوصف - أعلى يسار
                        if (hasOverlayText)
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: hasImage ? Colors.white.withOpacity(0.95) : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                category.overlayText!.trim(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const Spacer(),
                    // الصف السفلي: الاسم (يمين) + زر السهم (يسار)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // اسم الفئة - يمين (أولاً في RTL)
                        Expanded(
                          child: Text(
                            category.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: hasImage ? Colors.white : AppTheme.textPrimary,
                              shadows: hasImage
                                  ? [
                                      Shadow(
                                        color: Colors.black.withOpacity(0.4),
                                        offset: const Offset(0, 1),
                                        blurRadius: 3,
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // زر السهم - يسار
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.3),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.chevron_left,
                            size: 24,
                            color: hasImage ? Colors.white : AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
