import '../firebase_options.dart';

/// هل Firebase مُهيّأ بمفاتيح حقيقية (وليس REPLACE_ME)؟
class FirebaseConfig {
  FirebaseConfig._();

  static bool get isConfigured {
    final key = DefaultFirebaseOptions.ios.apiKey;
    return key.isNotEmpty && !key.contains('REPLACE_ME');
  }
}
