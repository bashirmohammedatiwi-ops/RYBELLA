import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../services/api_service.dart';

/// تخطيط التطبيق: شريط إعلاني
class AppLayout extends StatefulWidget {
  final Widget child;
  final bool showBottomNav;

  const AppLayout({super.key, required this.child, this.showBottomNav = true});

  @override
  State<AppLayout> createState() => _AppLayoutState();
}

class _AppLayoutState extends State<AppLayout> {
  Map<String, dynamic>? _settings;

  @override
  void initState() {
    super.initState();
    ApiService.getWebSettings().then((s) {
      if (mounted) setState(() => _settings = s);
    });
  }

  bool get _showAnnouncement =>
      _settings?['announcement_bar_enabled'] == '1' &&
      (_settings?['announcement_bar'] ?? '').toString().trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_showAnnouncement) _buildAnnouncement(),
        Expanded(child: widget.child),
      ],
    );
  }

  Widget _buildAnnouncement() {
    final text = (_settings?['announcement_bar'] ?? '').toString().trim();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary, AppTheme.primaryDark],
          begin: Alignment.centerRight,
          end: Alignment.centerLeft,
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x20E85D7A),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

