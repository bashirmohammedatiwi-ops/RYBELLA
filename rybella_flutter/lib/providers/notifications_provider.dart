import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NotificationsProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _items = [];
  int _unreadCount = 0;
  bool _loading = false;

  List<Map<String, dynamic>> get items => _items;
  int get unreadCount => _unreadCount;
  bool get loading => _loading;

  Future<void> load({bool loggedIn = true}) async {
    if (!loggedIn) {
      _items = [];
      _unreadCount = 0;
      notifyListeners();
      return;
    }
    _loading = true;
    notifyListeners();
    final results = await Future.wait([
      ApiService.getMyNotifications(),
      ApiService.getUnreadNotificationsCount(),
    ]);
    _items = results[0] as List<Map<String, dynamic>>;
    _unreadCount = results[1] as int;
    _loading = false;
    notifyListeners();
  }

  Future<void> markRead(int id) async {
    await ApiService.markNotificationRead(id);
    _items = _items.map((n) {
      if (n['id'] == id) {
        return {...n, 'is_read': 1, 'read_at': DateTime.now().toIso8601String()};
      }
      return n;
    }).toList();
    if (_unreadCount > 0) _unreadCount -= 1;
    notifyListeners();
  }

  Future<void> markAllRead() async {
    await ApiService.markAllNotificationsRead();
    _items = _items.map((n) => {...n, 'is_read': 1}).toList();
    _unreadCount = 0;
    notifyListeners();
  }
}
