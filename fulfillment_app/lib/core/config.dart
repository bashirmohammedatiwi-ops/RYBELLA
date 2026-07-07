class AppConfig {
  static const String productionBase = 'https://rybellairaq.com';

  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: productionBase,
  );

  static String get apiUrl => '$apiBase/api';
  static String get imgBase => apiBase;

  static const Duration ordersPollInterval = Duration(seconds: 30);
  static const Duration localReminderInterval = Duration(minutes: 3);
}
