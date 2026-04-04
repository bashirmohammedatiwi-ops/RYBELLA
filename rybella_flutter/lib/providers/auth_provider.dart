import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _loading = true;
  bool _checked = false;

  Map<String, dynamic>? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get loading => _loading;
  bool get checked => _checked;

  Future<void> checkAuth() async {
    if (_checked) return;
    _loading = true;
    notifyListeners();
    final res = await ApiService.getProfile();
    _loading = false;
    _checked = true;
    if (res.success && res.data != null) {
      _user = Map<String, dynamic>.from(res.data as Map);
    } else {
      _user = null;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    final res = await ApiService.login(email, password);
    if (res.success) {
      await checkAuth();
      return true;
    }
    return false;
  }

  Future<String?> register(Map<String, String> data) async {
    final res = await ApiService.register(data);
    if (res.success) {
      await checkAuth();
      return null;
    }
    return res.error ?? 'حدث خطأ';
  }

  Future<void> logout() async {
    await ApiService.logout();
    _user = null;
    notifyListeners();
  }
}
