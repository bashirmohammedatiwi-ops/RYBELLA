/// إعدادات التطبيق وروابط الـ API
class AppConfig {
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://187.124.23.65:4000',
  );

  static String get apiUrl => '$apiBase/api';
  static String get imgBase => apiBase;
}
