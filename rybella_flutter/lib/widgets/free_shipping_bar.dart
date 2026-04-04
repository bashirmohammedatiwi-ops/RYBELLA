import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../services/api_service.dart';

/// شريط التوصيل المجاني - يظهر عند عدم الوصول لحد التوصيل المجاني
class FreeShippingBar extends StatefulWidget {
  final double subtotal;

  const FreeShippingBar({super.key, required this.subtotal});

  @override
  State<FreeShippingBar> createState() => _FreeShippingBarState();
}

class _FreeShippingBarState extends State<FreeShippingBar> {
  double? _threshold;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final s = await ApiService.getWebSettings();
    if (mounted && s != null) {
      final t = double.tryParse((s['free_shipping_threshold'] ?? '50000').toString());
      if (t != null && t > 0) setState(() => _threshold = t);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_threshold == null || widget.subtotal >= _threshold!) return const SizedBox.shrink();

    final remaining = _threshold! - widget.subtotal;
    final pct = (widget.subtotal / _threshold!).clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      height: 40,
      decoration: BoxDecoration(
        color: AppTheme.primarySoft,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        child: Stack(
          children: [
            FractionallySizedBox(
              widthFactor: pct,
              child: Container(
                color: AppTheme.primary.withOpacity(0.3),
              ),
            ),
            Center(
              child: Text(
                'اضيفي ${remaining.toStringAsFixed(0)} د.ع لتحصلي على توصيل مجاني',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class FractionallySizedBox extends StatelessWidget {
  final double widthFactor;
  final Widget child;

  const FractionallySizedBox({super.key, required this.widthFactor, required this.child});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      widthFactor: widthFactor.clamp(0.0, 1.0),
      child: child,
    );
  }
}
