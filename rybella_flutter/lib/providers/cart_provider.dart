import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CartProvider extends ChangeNotifier {
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

  Future<void> loadCart() async {
    _loading = true;
    notifyListeners();
    _items = await ApiService.getCart();
    _loading = false;
    notifyListeners();
  }

  Future<bool> addItem(int variantId, int quantity) async {
    final res = await ApiService.addToCart(variantId, quantity);
    if (res.success) {
      await loadCart();
      return true;
    }
    return false;
  }

  Future<bool> updateItem(int itemId, int quantity) async {
    final res = await ApiService.updateCartItem(itemId, quantity);
    if (res.success) {
      await loadCart();
      return true;
    }
    return false;
  }

  Future<bool> removeItem(int itemId) async {
    final res = await ApiService.removeCartItem(itemId);
    if (res.success) {
      await loadCart();
      return true;
    }
    return false;
  }
}
