import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../core/app_animations.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/app_image.dart';
import '../widgets/free_shipping_bar.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartDigits {
  static TextStyle outfit({
    required double size,
    FontWeight weight = FontWeight.w600,
    Color? color,
    double? height,
  }) {
    return GoogleFonts.outfit(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
    );
  }
}

String? _cartImageUrl(dynamic v) {
  if (v == null) return null;
  final s = v.toString().trim();
  return s.isEmpty ? null : s;
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().loadCart();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final bottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      extendBody: true,
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'السلة',
          style: GoogleFonts.cormorantGaramond(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
      ),
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFFFCFC),
              Color(0xFFFFF5F7),
              Color(0xFFFDF8F9),
            ],
          ),
        ),
        child: cart.loading
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(
                        color: AppTheme.primary,
                        strokeWidth: 2.5,
                        strokeCap: StrokeCap.round,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'جاري تحميل السلة',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              )
            : cart.items.isEmpty
                ? _CartEmpty(onExplore: () => context.go('/explore'))
                : RefreshIndicator(
                    color: AppTheme.primary,
                    onRefresh: cart.loadCart,
                    child: ListView(
                      padding: EdgeInsets.fromLTRB(16, 4, 16, cart.items.isNotEmpty ? bottom + 168 : 24),
                      children: [
                        _CartSectionHeader(
                          lines: cart.items.length,
                          pieces: cart.totalCount,
                        ),
                        const SizedBox(height: 12),
                        FreeShippingBar(subtotal: cart.totalPrice),
                        const SizedBox(height: 8),
                        ...cart.items.map(
                          (item) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _CartLineCard(
                              item: item,
                              onQty: (q) {
                                HapticFeedback.selectionClick();
                                cart.updateItem(
                                  item['id'] as int? ?? 0,
                                  q,
                                );
                              },
                              onRemove: () {
                                HapticFeedback.lightImpact();
                                cart.removeItem(item['id'] as int? ?? 0);
                              },
                            ),
                          ),
                        ),
                        _CartSummaryBlock(total: cart.totalPrice),
                      ],
                    ),
                  ),
      ),
      bottomNavigationBar: cart.items.isEmpty
          ? null
          : ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(
                  padding: EdgeInsets.fromLTRB(18, 14, 18, bottom + 14),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.92),
                    border: Border(
                      top: BorderSide(color: Colors.white.withValues(alpha: 0.95)),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 20,
                        offset: const Offset(0, -6),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    top: false,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (!auth.isLoggedIn)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: AppTheme.pastelPink.withValues(alpha: 0.45),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.12)),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.info_outline_rounded, size: 18, color: AppTheme.primary.withValues(alpha: 0.85)),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'لإتمام الطلب سجّلي الدخول أو أنشئي حساباً',
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      height: 1.35,
                                      color: AppTheme.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'الإجمالي',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text.rich(
                                    TextSpan(
                                      children: [
                                        TextSpan(
                                          text: cart.totalPrice.toStringAsFixed(0),
                                          style: _CartDigits.outfit(
                                            size: 22,
                                            weight: FontWeight.w700,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                        TextSpan(
                                          text: ' د.ع',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textPrimary.withValues(alpha: 0.85),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              flex: 2,
                              child: ScaleOnTap(
                                onTap: () => context.push('/checkout'),
                                child: Container(
                                  height: 52,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    gradient: const LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [AppTheme.primary, AppTheme.primaryDark],
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppTheme.primary.withValues(alpha: 0.35),
                                        blurRadius: 14,
                                        offset: const Offset(0, 6),
                                      ),
                                    ],
                                  ),
                                  child: Text(
                                    'إتمام الطلب',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white.withValues(alpha: 0.98),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}

// ─── حالة فارغة ───

class _CartEmpty extends StatelessWidget {
  final VoidCallback onExplore;

  const _CartEmpty({required this.onExplore});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                border: Border.all(color: AppTheme.border),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.08),
                    blurRadius: 32,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Icon(
                Icons.shopping_bag_outlined,
                size: 52,
                color: AppTheme.primary.withValues(alpha: 0.45),
              ),
            ),
            const SizedBox(height: 28),
            Text(
              'السلة فارغة',
              style: GoogleFonts.cormorantGaramond(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'أضيفي منتجاتك المفضلة وستظهر هنا',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                height: 1.5,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 28),
            ScaleOnTap(
              onTap: onExplore,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.primaryDark],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Text(
                  'تصفحي المتجر',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white.withValues(alpha: 0.98),
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

// ─── رأس القائمة ───

class _CartSectionHeader extends StatelessWidget {
  final int lines;
  final int pieces;

  const _CartSectionHeader({
    required this.lines,
    required this.pieces,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            'منتجاتك',
            style: GoogleFonts.cormorantGaramond(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.border),
          ),
          child: Text.rich(
            TextSpan(
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textMuted,
              ),
              children: [
                TextSpan(
                  text: '$pieces ',
                  style: _CartDigits.outfit(
                    size: 12,
                    weight: FontWeight.w700,
                    color: AppTheme.textMuted,
                  ),
                ),
                TextSpan(text: pieces == 1 ? 'قطعة' : 'قطع'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── بطاقة سطر ───

class _CartLineCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final void Function(int) onQty;
  final VoidCallback onRemove;

  const _CartLineCard({
    required this.item,
    required this.onQty,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final name = item['product_name'] ?? '';
    final shade = item['shade_name'] ?? '';
    final price = (item['price'] as num?)?.toDouble() ?? 0;
    final qty = item['quantity'] as int? ?? 1;
    final lineTotal = price * qty;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: AppImage(
                    url: _cartImageUrl(item['variant_image'] ?? item['product_image']),
                    width: 88,
                    height: 88,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          height: 1.25,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      if (shade.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          shade,
                          style: TextStyle(
                            fontSize: 12.5,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(
                            price.toStringAsFixed(0),
                            style: _CartDigits.outfit(
                              size: 12,
                              weight: FontWeight.w600,
                              color: AppTheme.textMuted,
                            ),
                          ),
                          Text(
                            ' د.ع × ',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                            ),
                          ),
                          Text(
                            '$qty',
                            style: _CartDigits.outfit(
                              size: 12,
                              weight: FontWeight.w700,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'المجموع',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted,
                  ),
                ),
                const Spacer(),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: lineTotal.toStringAsFixed(0),
                        style: _CartDigits.outfit(
                          size: 17,
                          weight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                      ),
                      TextSpan(
                        text: ' د.ع',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary.withValues(alpha: 0.9),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _CartQtyChip(
                  qty: qty,
                  onDec: () => onQty(qty - 1),
                  onInc: () => onQty(qty + 1),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: onRemove,
                  icon: Icon(Icons.delete_outline_rounded, size: 20, color: AppTheme.error.withValues(alpha: 0.9)),
                  label: Text(
                    'حذف',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.error.withValues(alpha: 0.9),
                    ),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    foregroundColor: AppTheme.error,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CartQtyChip extends StatelessWidget {
  final int qty;
  final VoidCallback onDec;
  final VoidCallback onInc;

  const _CartQtyChip({
    required this.qty,
    required this.onDec,
    required this.onInc,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onDec,
              borderRadius: BorderRadius.circular(22),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Icon(Icons.remove_rounded, size: 20, color: AppTheme.primary),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              '$qty',
              style: _CartDigits.outfit(
                size: 16,
                weight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onInc,
              borderRadius: BorderRadius.circular(22),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Icon(Icons.add_rounded, size: 20, color: AppTheme.primary),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── ملخص أسفل القائمة ───

class _CartSummaryBlock extends StatelessWidget {
  final double total;

  const _CartSummaryBlock({required this.total});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: LinearGradient(
            colors: [
              AppTheme.pastelPink.withValues(alpha: 0.35),
              Colors.white,
            ],
          ),
          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'المجموع الكلي',
              style: GoogleFonts.cormorantGaramond(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: total.toStringAsFixed(0),
                    style: _CartDigits.outfit(
                      size: 22,
                      weight: FontWeight.w800,
                      color: AppTheme.primary,
                    ),
                  ),
                  TextSpan(
                    text: ' د.ع',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
