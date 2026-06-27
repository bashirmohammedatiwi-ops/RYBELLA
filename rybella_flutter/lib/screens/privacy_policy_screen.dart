import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/config.dart';
import '../core/theme.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  Future<void> _openWeb() async {
    final uri = Uri.parse(AppConfig.privacyPolicyUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('سياسة الخصوصية')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'سياسة الخصوصية',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.primary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text('Rybella Iraq — يونيو 2025', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 24),
          _section('1. مقدمة', 'متجر Rybella وتطبيق Rybella Iraq يحترمان خصوصيتك ويوضحان كيفية جمع واستخدام بياناتك.'),
          _section('2. البيانات التي نجمعها', 'الاسم، الهاتف، العناوين، الطلبات، المفضلة، ورمز الإشعارات (بموافقتك).'),
          _section('3. الاستخدام', 'تنفيذ الطلبات، إدارة حسابك، إرسال العروض والتنبيهات (بموافقتك)، وتحسين الخدمة.'),
          _section('4. الحماية', 'نستخدم HTTPS وإجراءات أمنية لحماية بياناتك.'),
          _section('5. حقوقك', 'يمكنك طلب حذف بياناتك أو إيقاف الإشعارات في أي وقت.'),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _openWeb,
            icon: const Icon(Icons.open_in_new),
            label: const Text('عرض النسخة الكاملة على الموقع'),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, String body) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.primaryDark)),
          const SizedBox(height: 6),
          Text(body, style: const TextStyle(height: 1.6)),
        ],
      ),
    );
  }
}
