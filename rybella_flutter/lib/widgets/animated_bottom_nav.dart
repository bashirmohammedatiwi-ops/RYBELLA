import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/theme.dart';

/// شريط تنقل عائم بتصميم مطابق للصورة:
/// شريط أبيض بسيط + دائرة بيضاء نشطة + انحناء U متحرك.
class AnimatedBottomNav extends StatefulWidget {
  final String currentPath;
  final int cartCount;
  final bool isLoggedIn;
  final void Function(String) onNavigate;

  const AnimatedBottomNav({
    super.key,
    required this.currentPath,
    required this.cartCount,
    required this.isLoggedIn,
    required this.onNavigate,
  });

  @override
  State<AnimatedBottomNav> createState() => _AnimatedBottomNavState();
}

class _AnimatedBottomNavState extends State<AnimatedBottomNav> {
  static const _barHeight = 74.0;
  static const _bubbleRadius = 26.0;
  static const _notchRadius = 22.0;
  static const _notchHalfWidthFactor = 1.48;
  static const _edgeNotchPadding = 3.0;

  late List<_NavItemData> _items;
  double _targetCenterX = -100;

  @override
  void initState() {
    super.initState();
    _items = [
      _NavItemData(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'الرئيسية', path: '/'),
      _NavItemData(
        icon: Icons.grid_view_outlined,
        activeIcon: Icons.grid_view_rounded,
        label: 'الفئات',
        path: '/categories',
        matches: ['/explore', '/categories', '/brands'],
      ),
      _NavItemData(icon: Icons.shopping_cart_outlined, activeIcon: Icons.shopping_cart_rounded, label: 'السلة', path: '/cart', matches: ['/cart', '/wishlist'], isCart: true),
      _NavItemData(icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long_rounded, label: 'طلباتي', path: '/orders'),
      _NavItemData(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'حسابي', path: '/profile'),
    ];
  }

  void _onTap(_NavItemData item) {
    HapticFeedback.lightImpact();
    if (item.path == '/orders' && !widget.isLoggedIn) {
      widget.onNavigate('/login?from=/orders');
    } else {
      widget.onNavigate(item.path);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 20),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth;
          final itemWidth = w / _items.length;
          int activeIndex = -1;
          for (var i = 0; i < _items.length; i++) {
            if (_items[i].isActive(widget.currentPath)) {
              activeIndex = i;
              break;
            }
          }
          final targetX = activeIndex >= 0 ? (activeIndex + 0.5) * itemWidth : -100.0;
          final edgeSafeInset = (_barHeight / 2) + _edgeNotchPadding;
          final minX = edgeSafeInset;
          final maxX = w - edgeSafeInset;
          final clampedTargetX = (w > 2 * edgeSafeInset)
              ? targetX.clamp(minX, maxX)
              : (w / 2);
          final beginX = _targetCenterX < 0 ? clampedTargetX : _targetCenterX;
          if (_targetCenterX != clampedTargetX) {
            _targetCenterX = clampedTargetX;
          }

          return SizedBox(
            height: _barHeight + _bubbleRadius + 12,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                // الشريط الأبيض مع انحناء U متحرك
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: _barHeight,
                  child: TweenAnimationBuilder<double>(
                    key: ValueKey('bar-$beginX-$clampedTargetX'),
                    tween: Tween(begin: beginX, end: clampedTargetX),
                    duration: const Duration(milliseconds: 500),
                    curve: Curves.easeInOutCubicEmphasized,
                    builder: (context, value, _) {
                      return CustomPaint(
                        size: Size(w, _barHeight),
                        painter: _NavBarPainter(
                          activeCenterX: value,
                          notchRadius: _notchRadius,
                          notchHalfWidthFactor: _notchHalfWidthFactor,
                          edgeSafeInset: edgeSafeInset,
                          barHeight: _barHeight,
                        ),
                      );
                    },
                  ),
                ),
                // الأيقونات والتسميات داخل الشريط
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: _barHeight,
                  child: Row(
                    children: List.generate(_items.length, (i) {
                      final item = _items[i];
                      final isActive = item.isActive(widget.currentPath);
                      return Expanded(
                        child: _NavItemWidget(
                          icon: item.icon,
                          activeIcon: item.activeIcon,
                          label: item.label,
                          isActive: isActive,
                          isCart: item.isCart,
                          cartCount: widget.cartCount,
                          onTap: () => _onTap(item),
                        ),
                      );
                    }),
                  ),
                ),
                // الدائرة النشطة العائمة
                TweenAnimationBuilder<double>(
                  key: ValueKey('bubble-$beginX-$clampedTargetX'),
                  tween: Tween(begin: beginX, end: clampedTargetX),
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeInOutCubicEmphasized,
                  builder: (context, value, _) {
                    final left = value - _bubbleRadius;
                    return Positioned(
                      left: left,
                      bottom: _barHeight - (_bubbleRadius * 0.55),
                      child: IgnorePointer(
                        child: _ActiveBubble(
                          radius: _bubbleRadius,
                          item: activeIndex >= 0 ? _items[activeIndex] : _items[0],
                          cartCount: widget.cartCount,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _NavBarPainter extends CustomPainter {
  final double activeCenterX;
  final double notchRadius;
  final double notchHalfWidthFactor;
  final double edgeSafeInset;
  final double barHeight;

  _NavBarPainter({
    required this.activeCenterX,
    required this.notchRadius,
    required this.notchHalfWidthFactor,
    required this.edgeSafeInset,
    required this.barHeight,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = barHeight;
    final r = h / 2;
    final notchHalfWidth = notchRadius * notchHalfWidthFactor;
    final notchDepth = notchRadius * 0.88;
    final safeInset = edgeSafeInset.clamp(r + 1, w / 2);
    final cx = activeCenterX.clamp(safeInset, w - safeInset);
    final left = cx - notchHalfWidth;
    final right = cx + notchHalfWidth;

    // الشريط المستطيل المستدير
    final barPath = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, w, h),
        Radius.circular(r),
      ));

    // انحناء U ناعم باستخدام Bezier بدل القطع الدائري الحاد.
    final notchPath = Path()
      ..moveTo(left, 0)
      ..cubicTo(
        left + (notchHalfWidth * 0.28),
        0,
        cx - (notchHalfWidth * 0.46),
        notchDepth,
        cx,
        notchDepth,
      )
      ..cubicTo(
        cx + (notchHalfWidth * 0.46),
        notchDepth,
        right - (notchHalfWidth * 0.28),
        0,
        right,
        0,
      )
      ..lineTo(right, -48)
      ..lineTo(left, -48)
      ..close();

    final path = Path.combine(PathOperation.difference, barPath, notchPath);

    // ظل خفيف وحدود ناعمة
    canvas.drawShadow(
      path,
      Colors.black.withOpacity(0.08),
      14,
      true,
    );
    canvas.drawPath(path, Paint()..color = Colors.white);
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = const Color(0x14000000),
    );
  }

  @override
  bool shouldRepaint(covariant _NavBarPainter old) =>
      old.activeCenterX != activeCenterX;
}

class _NavItemData {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String path;
  final List<String>? matches;
  final bool isCart;

  _NavItemData({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.path,
    this.matches,
    this.isCart = false,
  });

  bool isActive(String current) {
    if (path == current) return true;
    if (matches != null) return matches!.any((m) => current.startsWith(m));
    return false;
  }
}

class _NavItemWidget extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final bool isCart;
  final int cartCount;
  final VoidCallback onTap;

  const _NavItemWidget({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.isCart,
    required this.cartCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = isActive ? const Color(0x00000000) : const Color(0xFF7F7F7F);
    final textColor = isActive ? const Color(0xFF2A2A2A) : const Color(0xFF7F7F7F);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        splashColor: Colors.black.withOpacity(0.04),
        highlightColor: Colors.black.withOpacity(0.02),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 10, 4, 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Icon(
                    isActive ? activeIcon : icon,
                    size: 22,
                    color: iconColor,
                  ),
                  if (isCart && !isActive && cartCount > 0)
                    Positioned(
                      top: -5,
                      right: -6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: isActive ? Colors.white : const Color(0xFF7F7F7F),
                          borderRadius: BorderRadius.circular(999),
                          border: isActive ? Border.all(color: const Color(0xFF7F7F7F), width: 1) : null,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.07),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: Text(
                          cartCount > 99 ? '99+' : '$cartCount',
                          style: TextStyle(
                            color: isActive ? const Color(0xFF7F7F7F) : Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                    color: textColor,
                    height: 1.1,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActiveBubble extends StatelessWidget {
  final double radius;
  final _NavItemData item;
  final int cartCount;

  const _ActiveBubble({
    required this.radius,
    required this.item,
    required this.cartCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.18),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          Icon(
            item.activeIcon,
            size: 25,
            color: const Color(0xFF6D6D6D),
          ),
          if (item.isCart && cartCount > 0)
            Positioned(
              top: -3,
              right: -4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF6D6D6D),
                  borderRadius: BorderRadius.circular(999),
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
    );
  }
}
