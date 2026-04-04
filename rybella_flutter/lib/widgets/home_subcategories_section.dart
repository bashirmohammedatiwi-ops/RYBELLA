import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../models/category.dart';
import 'app_image.dart';

/// قسم الفئات الثانوية في الصفحة الرئيسية.
/// يحتوي على الإصلاحات: overflow + زر الكل يفتح /subcategories
class HomeSubcategoriesSection extends StatelessWidget {
  final List<Subcategory> subcategories;
  final String Function(String?) imageUrl;
  final void Function({int? subcategoryId}) onSubcategoryTap;

  const HomeSubcategoriesSection({
    super.key,
    required this.subcategories,
    required this.imageUrl,
    required this.onSubcategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    if (subcategories.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'تسوقي حسب النوع',
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              TextButton(
                onPressed: () => context.push('/subcategories'),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                child: const Text('الكل'),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 130,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            itemCount: subcategories.take(10).length,
            itemBuilder: (_, i) {
              final sc = subcategories[i];
              return Padding(
                padding: const EdgeInsets.only(left: 12),
                child: GestureDetector(
                  onTap: () => onSubcategoryTap(subcategoryId: sc.id),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary.withOpacity(0.06),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: sc.image != null
                              ? AppImage(url: imageUrl(sc.image), fit: BoxFit.cover)
                              : const Center(
                                  child: Text('✦', style: TextStyle(fontSize: 18, color: AppTheme.primary)),
                                ),
                        ),
                      ),
                      const SizedBox(height: 3),
                      SizedBox(
                        width: 60,
                        child: Text(
                          sc.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
