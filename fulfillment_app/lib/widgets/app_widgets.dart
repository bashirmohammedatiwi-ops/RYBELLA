import 'package:flutter/material.dart';
import '../core/theme.dart';

class AppBackground extends StatelessWidget {
  final Widget child;
  final bool showGradient;

  const AppBackground({super.key, required this.child, this.showGradient = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: showGradient ? AppTheme.pageGradient : null,
        color: showGradient ? null : AppTheme.bg,
      ),
      child: child,
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;

  const SectionHeader({super.key, required this.title, this.action, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 12),
      child: Row(
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.textPrimary)),
          const Spacer(),
          if (action != null && onAction != null)
            TextButton(onPressed: onAction, child: Text(action!, style: const TextStyle(fontWeight: FontWeight.w800))),
        ],
      ),
    );
  }
}

class SoftCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Gradient? gradient;
  final List<BoxShadow>? shadows;

  const SoftCard({
    super.key,
    required this.child,
    this.padding,
    this.gradient,
    this.shadows,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: gradient,
        color: gradient == null ? AppTheme.surface : null,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: shadows ?? const [AppTheme.cardShadowSoft],
      ),
      child: child,
    );
  }
}

class LoadingOverlay extends StatelessWidget {
  final String? message;

  const LoadingOverlay({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 36,
            height: 36,
            child: CircularProgressIndicator(strokeWidth: 3, color: AppTheme.primary),
          ),
          if (message != null) ...[
            const SizedBox(height: 14),
            Text(message!, style: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
          ],
        ],
      ),
    );
  }
}
