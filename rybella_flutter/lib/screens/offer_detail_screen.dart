import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';

class OfferDetailScreen extends StatefulWidget {
  final int offerId;

  const OfferDetailScreen({super.key, required this.offerId});

  @override
  State<OfferDetailScreen> createState() => _OfferDetailScreenState();
}

class _OfferDetailScreenState extends State<OfferDetailScreen> {
  Map<String, dynamic>? _offer;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final o = await ApiService.getOfferById(widget.offerId);
    setState(() {
      _offer = o;
      _loading = false;
    });
  }

  String _img(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.toString().startsWith('http')) return path.toString();
    return '${AppConfig.imgBase}$path';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: const Color(0xFFFAF8F9),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
          child: SizedBox(
            width: 36,
            height: 36,
            child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2.5),
          ),
        ),
      );
    }
    if (_offer == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFFAF8F9),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Text(
            'العرض غير موجود',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
          ),
        ),
      );
    }

    final products = _offer!['products'] as List? ?? [];
    final title = _offer!['title'] as String? ?? 'عرض';
    final discountLabel = _offer!['discount_label'] as String?;
    final image = _offer!['image'];

    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F9),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: Colors.white,
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.95),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                  onPressed: () => context.pop(),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: image != null
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        AppImage(url: _img(image), fit: BoxFit.cover),
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withOpacity(0.6),
                              ],
                              stops: const [0.5, 1.0],
                            ),
                          ),
                        ),
                      ],
                    )
                  : Container(
                      color: AppTheme.pastelPink.withOpacity(0.5),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Transform.translate(
              offset: const Offset(0, -24),
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFFAF8F9),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (discountLabel != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppTheme.primary, AppTheme.primaryDark],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary.withOpacity(0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Text(
                          discountLabel,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    const SizedBox(height: 20),
                    Text(
                      title,
                      style: GoogleFonts.cormorantGaramond(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    if (products.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text(
                        'المنتجات المشمولة',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ...products.map<Widget>((p) {
                        final id = p['id'] as int?;
                        final name = p['name'] as String? ?? '';
                        final img = p['main_image'] ?? p['images']?[0];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Material(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            elevation: 0,
                            child: InkWell(
                              onTap: id != null ? () => context.push('/products/$id') : null,
                              borderRadius: BorderRadius.circular(18),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    if (img != null)
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(14),
                                        child: AppImage(
                                          url: _img(img.toString()),
                                          width: 64,
                                          height: 64,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    if (img != null) const SizedBox(width: 16),
                                    Expanded(
                                      child: Text(
                                        name,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                    ),
                                    Icon(
                                      Icons.arrow_forward_ios,
                                      size: 16,
                                      color: AppTheme.primary,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
