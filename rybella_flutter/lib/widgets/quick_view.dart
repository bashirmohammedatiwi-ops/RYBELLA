import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/product.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import 'app_image.dart';

/// معاينة سريعة للمنتج - مطابق للويب
class QuickViewSheet extends StatefulWidget {
  final int productId;
  final VoidCallback onClose;

  const QuickViewSheet({super.key, required this.productId, required this.onClose});

  @override
  State<QuickViewSheet> createState() => _QuickViewSheetState();
}

class _QuickViewSheetState extends State<QuickViewSheet> {
  Product? _product;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final p = await ApiService.getProduct(widget.productId);
    if (mounted) {
      setState(() {
        _product = p;
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
    return GestureDetector(
      onTap: widget.onClose,
      behavior: HitTestBehavior.opaque,
      child: Container(
        color: Colors.black54,
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              constraints: const BoxConstraints(maxWidth: 400),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Align(
                      alignment: Alignment.topLeft,
                      child: IconButton(
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          widget.onClose();
                        },
                        icon: const Icon(Icons.close, size: 24),
                      ),
                    ),
                    if (_loading)
                      const Padding(
                        padding: EdgeInsets.all(40),
                        child: CircularProgressIndicator(color: AppTheme.primary),
                      )
                    else if (_product != null)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 1,
                              child: Container(
                                height: 180,
                                decoration: BoxDecoration(
                                  color: AppTheme.surface,
                                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                                  child: _product!.mainImage != null
                                      ? AppImage(url: _img(_product!.mainImage), fit: BoxFit.cover)
                                      : (() {
                                          final v = _product!.variants.firstWhere(
                                            (x) => x.image != null,
                                            orElse: () => _product!.variants.first,
                                          );
                                          return v.image != null
                                              ? AppImage(url: _img(v.image), fit: BoxFit.cover)
                                              : const Center(child: Icon(Icons.image, size: 48, color: AppTheme.textMuted));
                                        })(),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              flex: 1,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _product!.name,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textPrimary,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${(_product!.minPrice ?? 0).toStringAsFixed(0)} د.ع',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                  if (_product!.description != null && _product!.description!.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      '${_product!.description!.length > 120 ? _product!.description!.substring(0, 120) : _product!.description}...',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: AppTheme.textSecondary,
                                      ),
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: () {
                                            widget.onClose();
                                            context.push('/products/${widget.productId}');
                                          },
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: AppTheme.primary,
                                            side: const BorderSide(color: AppTheme.primary),
                                          ),
                                          child: const Text('عرض التفاصيل'),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () async {
                                            if (_product!.variants.isEmpty) return;
                                            final v = _product!.variants
                                                .firstWhere((x) => x.stock > 0, orElse: () => _product!.variants.first);
                                            if (v.stock > 0) {
                                              final pr = _product!;
                                              await context.read<CartProvider>().addItem(
                                                v.id,
                                                1,
                                                productName: pr.name,
                                                shadeName: v.shadeName,
                                                unitPrice: v.price,
                                                variantImage: v.image,
                                                productImage: pr.mainImage,
                                              );
                                              if (mounted) {
                                                HapticFeedback.mediumImpact();
                                                widget.onClose();
                                              }
                                            }
                                          },
                                          child: const Text('أضف للسلة'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      const Padding(
                        padding: EdgeInsets.all(40),
                        child: Text('المنتج غير موجود'),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
