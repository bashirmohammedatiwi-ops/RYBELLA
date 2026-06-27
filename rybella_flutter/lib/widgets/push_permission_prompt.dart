import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../services/push_service.dart';

/// بطاقة تحفيزية لطلب إذن الإشعارات — مطابقة لفكرة الويب
class PushPermissionPrompt extends StatefulWidget {
  const PushPermissionPrompt({super.key});

  @override
  State<PushPermissionPrompt> createState() => _PushPermissionPromptState();
}

class _PushPermissionPromptState extends State<PushPermissionPrompt> {
  bool _busy = false;
  bool _enabled = false;
  bool _checked = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final enabled = await PushService.isEnabled();
    if (mounted) setState(() {
      _enabled = enabled;
      _checked = true;
    });
  }

  Future<void> _enable() async {
    setState(() => _busy = true);
    final ok = await PushService.requestAndSubscribe();
    if (mounted) {
      setState(() {
        _busy = false;
        _enabled = ok;
      });
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم تفعيل الإشعارات بنجاح')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || !_checked || _enabled) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primarySoft, Colors.white],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('🔔', textAlign: TextAlign.center, style: TextStyle(fontSize: 32)),
          const SizedBox(height: 8),
          const Text(
            'لا تفوتي العروض!',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.primaryDark),
          ),
          const SizedBox(height: 6),
          Text(
            'فعّلي الإشعارات لتصلك أحدث العروض والتخفيضات الحصرية على ${Platform.isIOS ? 'آيفون' : 'هاتفك'}.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[700], height: 1.5),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _busy ? null : _enable,
            child: _busy
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('أرسلي العروض'),
          ),
        ],
      ),
    );
  }
}
