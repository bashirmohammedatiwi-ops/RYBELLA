import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/push_service.dart';

class AuthProvider extends ChangeNotifier {
  StaffUser? _user;
  bool _loading = true;
  String? _error;

  StaffUser? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;
  String? get error => _error;

  Future<void> checkAuth() async {
    _loading = true;
    notifyListeners();
    final profile = await ApiService.getProfile();
    if (profile != null && profile.canUseFulfillment) {
      _user = profile;
      await PushService.syncAfterLogin();
    } else {
      _user = null;
      await ApiService.logout();
    }
    _loading = false;
    notifyListeners();
  }

  Future<bool> login(String phone, String password) async {
    _error = null;
    _loading = true;
    notifyListeners();

    final res = await ApiService.login(phone, password);
    if (!res.success) {
      _error = res.error ?? 'فشل تسجيل الدخول';
      _loading = false;
      notifyListeners();
      return false;
    }

    final data = res.data as Map<String, dynamic>?;
    final userJson = data?['user'] as Map<String, dynamic>?;
    if (userJson == null) {
      _error = 'استجابة غير صالحة من الخادم';
      _loading = false;
      notifyListeners();
      return false;
    }

    final user = StaffUser.fromJson(userJson);
    if (!user.canUseFulfillment) {
      await ApiService.logout();
      _error = 'هذا الحساب غير مصرح له باستخدام تطبيق التجهيز';
      _loading = false;
      notifyListeners();
      return false;
    }

    _user = user;
    await PushService.requestAndSubscribe();
    _loading = false;
    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    await ApiService.logout();
    _user = null;
    notifyListeners();
  }
}
