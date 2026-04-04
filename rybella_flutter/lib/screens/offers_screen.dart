import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  List<Map<String, dynamic>> _offers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await ApiService.getOffers();
    if (mounted) {
      setState(() {
        _offers = list;
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
                  SliverToBoxAdapter(
                    child: _buildHeader(context),
                  ),
                  if (_offers.isEmpty)
                    const SliverFillRemaining(
                      child: Center(
                        child: Text('لا توجد عروض', style: TextStyle(color: AppTheme.textMuted)),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) {
                            final o = _offers[i];
                            final hasProducts = o['product_ids'] != null;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: _OfferCard(
                                imageUrl: _img(o['image']),
                                label: o['discount_label'] ?? o['title'] ?? 'عرض',
                                overlayText: o['title'] != o['discount_label'] ? o['title'] as String? : null,
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  if (hasProducts) {
                                    context.push('/offers/${o['id']}');
                                  } else {
                                    context.go('/explore');
                                  }
                                },
                              ),
                            );
                          },
                          childCount: _offers.length,
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
                        'العروض الحصرية',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_offers.length} عرض',
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

class _OfferCard extends StatelessWidget {
  final String imageUrl;
  final String label;
  final String? overlayText;
  final VoidCallback onTap;

  const _OfferCard({
    required this.imageUrl,
    required this.label,
    this.overlayText,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl.isNotEmpty;

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
              if (hasImage)
                AppImage(url: imageUrl, fit: BoxFit.cover)
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
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: hasImage ? Colors.white.withOpacity(0.35) : Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.local_offer_rounded,
                            size: 24,
                            color: hasImage ? Colors.white : AppTheme.primary,
                          ),
                        ),
                        if (overlayText != null && overlayText!.trim().isNotEmpty)
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: hasImage ? Colors.white.withOpacity(0.95) : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                overlayText!.trim(),
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Text(
                            label,
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
