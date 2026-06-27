import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

/// السلة: من الخادم عند وجود جلسة، أو محلياً للزوار ثم دمجها بعد تسجيل الدخول.
class CartProvider extends ChangeNotifier {
  static const _tokenKey = 'rybella_token';
  static const _guestCartKey = 'rybella_guest_cart_v2';

  CartProvider() {
    Future.microtask(loadCart);
  }

  List<Map<String, dynamic>> _items = [];
  List<Map<String, dynamic>> _bundles = [];
  bool _loading = false;

  List<Map<String, dynamic>> get items => _items;
  List<Map<String, dynamic>> get bundles => _bundles;
  bool get loading => _loading;

  int get totalCount =>
      _items.fold(0, (s, i) => s + ((i['quantity'] as int?) ?? 0)) +
      _bundles.fold(0, (s, b) => s + ((b['quantity'] as int?) ?? 0));

  double get totalPrice {
    final itemsTotal = _items.fold(0.0, (s, i) {
      final q = (i['quantity'] as int?) ?? 0;
      final p = (i['price'] as num?)?.toDouble() ?? 0;
      return s + (q * p);
    });
    final bundlesTotal = _bundles.fold(0.0, (s, b) {
      final q = (b['quantity'] as num?)?.toInt() ?? 1;
      final unit = (b['unit_price'] as num?)?.toDouble() ?? (b['total_price'] as num?)?.toDouble() ?? 0;
      return s + unit * q;
    });
    return itemsTotal + bundlesTotal;
  }

  Future<bool> _hasAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final t = prefs.getString(_tokenKey);
    return t != null && t.isNotEmpty;
  }

  Future<Map<String, dynamic>> _readGuestCart() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_guestCartKey);
    if (raw == null || raw.isEmpty) {
      return {'items': <Map<String, dynamic>>[], 'bundles': <Map<String, dynamic>>[]};
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return {
          'items': decoded.map((e) => Map<String, dynamic>.from(e as Map)).toList(),
          'bundles': <Map<String, dynamic>>[],
        };
      }
      final map = Map<String, dynamic>.from(decoded as Map);
      return {
        'items': (map['items'] as List? ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
        'bundles': (map['bundles'] as List? ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
      };
    } catch (_) {
      return {'items': <Map<String, dynamic>>[], 'bundles': <Map<String, dynamic>>[]};
    }
  }

  Future<void> _saveGuestCart(List<Map<String, dynamic>> items, List<Map<String, dynamic>> bundles) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_guestCartKey, jsonEncode({'items': items, 'bundles': bundles}));
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
      final data = await ApiService.getCartData();
      _items = data['items'] as List<Map<String, dynamic>>;
      _bundles = data['bundles'] as List<Map<String, dynamic>>;
    } else {
      final guest = await _readGuestCart();
      _items = guest['items'] as List<Map<String, dynamic>>;
      _bundles = guest['bundles'] as List<Map<String, dynamic>>;
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> mergeGuestCartAfterLogin() async {
    final guest = await _readGuestCart();
    final guestItems = guest['items'] as List<Map<String, dynamic>>;
    final guestBundles = guest['bundles'] as List<Map<String, dynamic>>;
    if (guestItems.isEmpty && guestBundles.isEmpty) {
      await loadCart();
      return;
    }
    for (final line in guestItems) {
      final vid = line['variant_id'];
      final qty = (line['quantity'] as num?)?.toInt() ?? 1;
      if (vid is int && qty > 0) {
        await ApiService.addToCart(vid, qty);
      }
    }
    for (final bundle in guestBundles) {
      final offerId = bundle['offer_id'];
      final qty = (bundle['quantity'] as num?)?.toInt() ?? 1;
      final lines = (bundle['lines'] as List? ?? [])
          .map((l) => {'variant_id': (l as Map)['variant_id'], 'quantity': 1})
          .toList();
      if (offerId is int && lines.isNotEmpty) {
        await ApiService.addBundleToCart(offerId, lines, quantity: qty);
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

    final guest = await _readGuestCart();
    var list = guest['items'] as List<Map<String, dynamic>>;
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
    await _saveGuestCart(list, guest['bundles'] as List<Map<String, dynamic>>);
    _items = list;
    notifyListeners();
    return true;
  }

  Future<bool> addBundle({
    required int offerId,
    required String offerTitle,
    String? offerImage,
    required num discountPercent,
    String? discountLabel,
    required List<Map<String, dynamic>> lines,
    required double unitPrice,
    required double subtotal,
    int quantity = 1,
  }) async {
    final authed = await _hasAuthToken();
    if (authed) {
      final apiLines = lines.map((l) => {'variant_id': l['variant_id'], 'quantity': 1}).toList();
      final res = await ApiService.addBundleToCart(offerId, apiLines, quantity: quantity);
      if (res.success) {
        await loadCart();
        return true;
      }
      return false;
    }

    final guest = await _readGuestCart();
    var bundles = guest['bundles'] as List<Map<String, dynamic>>;
    final bundleKey = 'offer_$offerId';
    bundles = [
      ...bundles.where((b) => b['offer_id'] != offerId),
      {
        'type': 'bundle',
        'bundle_key': bundleKey,
        'offer_id': offerId,
        'offer_title': offerTitle,
        'offer_image': offerImage,
        'discount_percent': discountPercent,
        'discount_label': discountLabel,
        'quantity': quantity,
        'lines': lines,
        'unit_price': unitPrice,
        'subtotal': subtotal,
        'total_price': unitPrice * quantity,
      },
    ];
    await _saveGuestCart(guest['items'] as List<Map<String, dynamic>>, bundles);
    _bundles = bundles;
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
    final guest = await _readGuestCart();
    var list = guest['items'] as List<Map<String, dynamic>>;
    final idx = list.indexWhere((e) => e['id'] == itemId);
    if (idx < 0) return false;
    list[idx]['quantity'] = quantity;
    await _saveGuestCart(list, guest['bundles'] as List<Map<String, dynamic>>);
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

    final guest = await _readGuestCart();
    var list = guest['items'] as List<Map<String, dynamic>>;
    list.removeWhere((e) => e['id'] == itemId);
    await _saveGuestCart(list, guest['bundles'] as List<Map<String, dynamic>>);
    _items = list;
    notifyListeners();
    return true;
  }

  Future<bool> removeBundle(dynamic bundleId) async {
    final authed = await _hasAuthToken();
    if (authed) {
      final res = await ApiService.removeCartBundle(bundleId is int ? bundleId : int.tryParse('$bundleId') ?? 0);
      if (res.success) {
        await loadCart();
        return true;
      }
      return false;
    }

    final guest = await _readGuestCart();
    var bundles = guest['bundles'] as List<Map<String, dynamic>>;
    bundles.removeWhere((b) => b['id'] == bundleId || b['bundle_key'] == bundleId || b['offer_id'] == bundleId);
    await _saveGuestCart(guest['items'] as List<Map<String, dynamic>>, bundles);
    _bundles = bundles;
    notifyListeners();
    return true;
  }
}
