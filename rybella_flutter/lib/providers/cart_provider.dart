import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

/// السلة: من الخادم عند وجود جلسة، أو محلياً للزوار ثم دمجها بعد تسجيل الدخول.
class CartProvider extends ChangeNotifier {
  static const _tokenKey = 'rybella_token';
  static const _guestCartKey = 'rybella_guest_cart_v1';

  CartProvider() {
    Future.microtask(loadCart);
  }

  List<Map<String, dynamic>> _items = [];
  bool _loading = false;

  List<Map<String, dynamic>> get items => _items;
  bool get loading => _loading;

  int get totalCount => _items.fold(0, (s, i) => s + ((i['quantity'] as int?) ?? 0));
  double get totalPrice => _items.fold(0.0, (s, i) {
        final q = (i['quantity'] as int?) ?? 0;
        final p = (i['price'] as num?)?.toDouble() ?? 0;
        return s + (q * p);
      });

  Future<bool> _hasAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final t = prefs.getString(_tokenKey);
    return t != null && t.isNotEmpty;
  }

  Future<List<Map<String, dynamic>>> _readGuestCart() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_guestCartKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _saveGuestCart(List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_guestCartKey, jsonEncode(items));
  }

  Future<void> _clearGuestCartPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_guestCartKey);
  }

  static int _nextGuestLineId(List<Map<String, dynamic>> items) {
    var minId = 0;
    for (final e in items) {
      final id = e['id'];
      if (id is int && id < minId) minId = id;
    }
    return minId - 1;
  }

  Future<void> loadCart() async {
    _loading = true;
    notifyListeners();
    final authed = await _hasAuthToken();
    if (authed) {
      _items = await ApiService.getCart();
    } else {
      _items = await _readGuestCart();
    }
    _loading = false;
    notifyListeners();
  }

  /// بعد تسجيل الدخول أو إنشاء حساب: رفع عناصر السلة المحلية إلى الخادم ثم مسح التخزين المحلي.
  Future<void> mergeGuestCartAfterLogin() async {
    final guest = await _readGuestCart();
    if (guest.isEmpty) {
      await loadCart();
      return;
    }
    for (final line in guest) {
      final vid = line['variant_id'];
      final qty = (line['quantity'] as num?)?.toInt() ?? 1;
      if (vid is int && qty > 0) {
        await ApiService.addToCart(vid, qty);
      }
    }
    await _clearGuestCartPrefs();
    await loadCart();
  }

  Future<bool> addItem(
    int variantId,
    int quantity, {
    String? productName,
    String? shadeName,
    double? unitPrice,
    String? variantImage,
    String? productImage,
  }) async {
    final authed = await _hasAuthToken();
    if (authed) {
      final res = await ApiService.addToCart(variantId, quantity);
      if (res.success) {
        await loadCart();
        return true;
      }
      return false;
    }

    if (productName == null || unitPrice == null) return false;

    var list = await _readGuestCart();
    final idx = list.indexWhere((e) => e['variant_id'] == variantId);
    if (idx >= 0) {
      final prev = (list[idx]['quantity'] as num?)?.toInt() ?? 0;
      list[idx]['quantity'] = prev + quantity;
    } else {
      list = [
        ...list,
        {
          'id': _nextGuestLineId(list),
          'variant_id': variantId,
          'quantity': quantity,
          'product_name': productName,
          'shade_name': shadeName ?? '',
          'price': unitPrice,
          'variant_image': variantImage,
          'product_image': productImage ?? variantImage,
        },
      ];
    }
    await _saveGuestCart(list);
    _items = list;
    notifyListeners();
    return true;
  }

  Future<bool> updateItem(int itemId, int quantity) async {
    final authed = await _hasAuthToken();
    if (authed) {
      final res = await ApiService.updateCartItem(itemId, quantity);
      if (res.success) {
        await loadCart();
        return true;
      }
      return false;
    }

    if (quantity < 1) return removeItem(itemId);
    var list = await _readGuestCart();
    final idx = list.indexWhere((e) => e['id'] == itemId);
    if (idx < 0) return false;
    list[idx]['quantity'] = quantity;
    await _saveGuestCart(list);
    _items = list;
    notifyListeners();
    return true;
  }

  Future<bool> removeItem(int itemId) async {
    final authed = await _hasAuthToken();
    if (authed) {
      final res = await ApiService.removeCartItem(itemId);
      if (res.success) {
        await loadCart();
        return true;
      }
      return false;
    }

    var list = await _readGuestCart();
    list.removeWhere((e) => e['id'] == itemId);
    await _saveGuestCart(list);
    _items = list;
    notifyListeners();
    return true;
  }
}
