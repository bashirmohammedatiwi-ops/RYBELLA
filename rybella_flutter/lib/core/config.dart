/// إعدادات التطبيق وروابط الـ API
class AppConfig {
  /// الدومين الإنتاجي — نفس الموقع (HTTPS)
  static const String productionBase = 'https://rybellairaq.com';

  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: productionBase,
  );

  static String get apiUrl => '$apiBase/api';
  static String get imgBase => apiBase;

  /// رابط سياسة الخصوصية (للمتاجر وللتطبيق)
  static String get privacyPolicyUrl => '$apiBase/privacy-policy.html';
}
