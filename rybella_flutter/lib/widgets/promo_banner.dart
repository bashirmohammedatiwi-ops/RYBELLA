import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../core/config.dart';
import 'app_image.dart';

// ─────────────────────────────────────────────────────────────────────────────
// ثوابت البانر
// ─────────────────────────────────────────────────────────────────────────────

/// ارتفاع البانر المرئي (المستطيل المستدير)
const double _kBannerHeight = 167.0;

/// مساحة خروج الصورة الأمامية من أعلى البانر
const double _kOverflowTop = 112.0;

/// نسبة امتداد الصورة نحو الأطراف لاقتصاص قليل من الجوانب (مثل لوحة التحكم)
const double _kImageEdgeBleed = 1.08;

/// إجمالي ارتفاع الحاوية
double get _kTotalHeight => _kBannerHeight + _kOverflowTop;

// ─────────────────────────────────────────────────────────────────────────────
// PromoBanner - البانر الترويجي الرئيسي
// ─────────────────────────────────────────────────────────────────────────────

/// بانر ترويجي مطابق للتصميم المرجعي
/// - الصورة الأمامية تبدأ من الحافة السفلية وتخرج من الأعلى فقط
/// - الموضع والحجم من لوحة التحكم (image_pos_x, image_pos_y, image_size)
class PromoBanner extends StatefulWidget {
  final List<Map<String, dynamic>> banners;
  final String Function(String?)? imageUrl;
  final void Function(String)? onTap;

  const PromoBanner({
    super.key,
    required this.banners,
    this.imageUrl,
    this.onTap,
  });

  @override
  State<PromoBanner> createState() => _PromoBannerState();
}

class _PromoBannerState extends State<PromoBanner> {
  int _currentIndex = 0;
  final _carouselController = CarouselSliderController();

  String _img(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return widget.imageUrl != null ? widget.imageUrl!(path) : '${AppConfig.imgBase}$path';
  }

  static Color _parseColor(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    if (hex.length != 8) return fallback;
    return Color(int.parse(hex, radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.banners.take(5).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: _kTotalHeight,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          CarouselSlider.builder(
            carouselController: _carouselController,
            itemCount: items.length,
            itemBuilder: (_, i, __) => _BannerSlide(
              banner: items[i],
              img: _img,
              parseColor: _parseColor,
              onTap: widget.onTap,
            ),
            options: CarouselOptions(
              height: _kTotalHeight,
              viewportFraction: 1,
              autoPlay: items.length > 1,
              autoPlayInterval: const Duration(seconds: 4),
              enlargeCenterPage: true,
              onPageChanged: (i, _) => setState(() => _currentIndex = i),
            ),
          ),
          if (items.length > 1)
            Positioned(
              left: 0,
              right: 0,
              bottom: 10,
              child: _BannerDots(
                count: items.length,
                current: _currentIndex,
                onTap: (i) => _carouselController.animateToPage(i),
              ),
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _BannerSlide - شريحة البانر الواحدة
// ─────────────────────────────────────────────────────────────────────────────

class _BannerSlide extends StatelessWidget {
  final Map<String, dynamic> banner;
  final String Function(String?) img;
  final Color Function(String?, Color) parseColor;
  final void Function(String)? onTap;

  const _BannerSlide({
    required this.banner,
    required this.img,
    required this.parseColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = parseColor(banner['background_color']?.toString(), const Color(0xFFF5F5F5));
    final borderColor = parseColor(banner['border_color']?.toString(), AppTheme.primary);
    final buttonColor = parseColor(banner['button_color']?.toString(), const Color(0xFF1A1A1A));
    final borderRadius = ((banner['border_radius'] as num?)?.toDouble() ?? 24.0).clamp(12.0, 40.0);
    final title = banner['title']?.toString();
    final subtitle = banner['subtitle']?.toString();
    final buttonText = banner['button_text']?.toString();
    final discountPercent = banner['discount_percent'];
    final discountLabel = banner['discount_label']?.toString() ?? 'خصم';
    final imagePath = banner['image']?.toString();
    final backgroundImage = banner['background_image']?.toString();
    final linkUrl = banner['link_url'] ?? banner['link_value'];

    final isLightBg = bgColor.computeLuminance() > 0.85;
    final textColor = isLightBg ? AppTheme.textPrimary : Colors.white;
    final subtitleColor = isLightBg ? AppTheme.textSecondary : Colors.white.withOpacity(0.95);

    return GestureDetector(
      onTap: () {
        final s = linkUrl?.toString();
        if (s != null && s.isNotEmpty && s.startsWith('/')) {
          onTap?.call(s);
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // 1. البطاقة الرئيسية (المستطيل المستدير)
            Positioned(
              top: _kOverflowTop,
              left: 0,
              right: 0,
              height: _kBannerHeight,
              child: _BannerCard(
                borderRadius: borderRadius,
                borderColor: borderColor,
                bgColor: bgColor,
                backgroundImage: backgroundImage,
                img: img,
                title: title,
                subtitle: subtitle,
                buttonText: buttonText,
                buttonColor: buttonColor,
                discountPercent: discountPercent,
                discountLabel: discountLabel,
                textColor: textColor,
                subtitleColor: subtitleColor,
              ),
            ),
            // 2. الصورة الأمامية - تبدأ من الحافة السفلية، تخرج من الأعلى فقط
            if (imagePath != null && imagePath.isNotEmpty)
              _FrontImage(
                imagePath: imagePath,
                img: img,
                banner: banner,
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _BannerCard - البطاقة المستطيلة (الخلفية + النص + الزر + شارة الخصم)
// ─────────────────────────────────────────────────────────────────────────────

class _BannerCard extends StatelessWidget {
  final double borderRadius;
  final Color borderColor;
  final Color bgColor;
  final String? backgroundImage;
  final String Function(String?) img;
  final String? title;
  final String? subtitle;
  final String? buttonText;
  final Color buttonColor;
  final dynamic discountPercent;
  final String discountLabel;
  final Color textColor;
  final Color subtitleColor;

  const _BannerCard({
    required this.borderRadius,
    required this.borderColor,
    required this.bgColor,
    this.backgroundImage,
    required this.img,
    this.title,
    this.subtitle,
    this.buttonText,
    required this.buttonColor,
    this.discountPercent,
    required this.discountLabel,
    required this.textColor,
    required this.subtitleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: borderColor.withOpacity(0.5), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // الخلفية
            if (backgroundImage != null && backgroundImage!.isNotEmpty)
              Positioned.fill(child: AppImage(url: img(backgroundImage), fit: BoxFit.cover))
            else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [bgColor, Color.lerp(bgColor, const Color(0xFFF0F0F0), 0.2)!],
                  ),
                ),
              ),
            // النص والزر (يسار - RTL)
            if (title != null || subtitle != null || (buttonText != null && buttonText!.isNotEmpty))
              Positioned(
                right: 14,
                left: 0,
                top: 0,
                bottom: 0,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 14),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (title != null && title!.isNotEmpty)
                          Text(
                            title!,
                            style: GoogleFonts.roboto(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: textColor,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        if (subtitle != null && subtitle!.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(
                            subtitle!,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: subtitleColor),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (buttonText != null && buttonText!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: buttonColor,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              buttonText!,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            // شارة الخصم
            if (discountPercent != null && (discountPercent as num) > 0)
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(left: 80),
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFE85D7A), Color(0xFFF08FA6)],
                      ),
                      border: Border.all(color: Colors.white.withOpacity(0.9), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        discountLabel.isNotEmpty ? '$discountLabel $discountPercent%' : '$discountPercent%',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// _FrontImage - الصورة الأمامية (تخرج من الأعلى، مُقتطعة من الجوانب والأسفل)
// ─────────────────────────────────────────────────────────────────────────────

class _FrontImage extends StatelessWidget {
  final String imagePath;
  final String Function(String?) img;
  final Map<String, dynamic> banner;

  const _FrontImage({
    required this.imagePath,
    required this.img,
    required this.banner,
  });

  @override
  Widget build(BuildContext context) {
    final posX = (banner['image_pos_x'] as num?)?.toDouble() ?? 80.0;
    final sizeVal = (banner['image_size'] as num?) ?? 0.0;
    final displaySize = sizeVal > 0 ? sizeVal : 62.0;
    final borderRadius = ((banner['border_radius'] as num?)?.toDouble() ?? 24.0).clamp(12.0, 40.0);

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      height: _kTotalHeight,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth;
          // الصورة أوسع قليلاً لتمتد نحو الأطراف ويُقتطع منها قليل من الجوانب (مثل لوحة التحكم)
          final imgW = w * (displaySize / 100) * _kImageEdgeBleed;
          final centerX = w * (posX / 100);
          final imgLeft = centerX - imgW / 2;
          // الصورة تبدأ من الحافة السفلية للبانر وتنتهي معها (لا تمتد للأسفل)
          const imgBottom = 0.0;

          return ClipPath(
            clipper: _BannerEdgeClipper(
              overflow: _kOverflowTop,
              bannerTop: _kOverflowTop,
              bannerHeight: _kBannerHeight,
              borderRadius: borderRadius,
            ),
            child: Stack(
              children: [
                Positioned(
                  left: imgLeft,
                  bottom: imgBottom,
                  width: imgW,
                  height: 240,
                  child: Align(
                    alignment: Alignment.bottomCenter,
                    child: AppImage(
                      url: img(imagePath),
                      fit: BoxFit.contain,
                      height: 240,
                      alignment: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// اقتصاص: تخرج من الأعلى فقط، تُقتطع من الجوانب والأسفل مع حافة البانر (زوايا مستديرة)
class _BannerEdgeClipper extends CustomClipper<Path> {
  final double overflow;
  final double bannerTop;
  final double bannerHeight;
  final double borderRadius;

  _BannerEdgeClipper({
    required this.overflow,
    required this.bannerTop,
    required this.bannerHeight,
    required this.borderRadius,
  });

  @override
  Path getClip(Size size) {
    final w = size.width;
    final r = borderRadius.clamp(0.0, (bannerHeight / 2).clamp(0.0, w / 2));
    final bottom = bannerTop + bannerHeight;
    return Path()
      ..moveTo(0, -overflow)
      ..lineTo(0, bottom - r)
      ..arcToPoint(Offset(r, bottom), radius: Radius.circular(r))
      ..lineTo(w - r, bottom)
      ..arcToPoint(Offset(w, bottom - r), radius: Radius.circular(r))
      ..lineTo(w, -overflow)
      ..lineTo(0, -overflow)
      ..close();
  }

  @override
  bool shouldReclip(covariant _BannerEdgeClipper oldClipper) =>
      oldClipper.overflow != overflow ||
      oldClipper.borderRadius != borderRadius;
}

// ─────────────────────────────────────────────────────────────────────────────
// _BannerDots - نقاط التنقل
// ─────────────────────────────────────────────────────────────────────────────

class _BannerDots extends StatelessWidget {
  final int count;
  final int current;
  final void Function(int) onTap;

  const _BannerDots({required this.count, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == current;
        return GestureDetector(
          onTap: () => onTap(i),
          behavior: HitTestBehavior.opaque,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: active ? Colors.white : Colors.white.withOpacity(0.5),
            ),
          ),
        );
      }),
    );
  }
}
