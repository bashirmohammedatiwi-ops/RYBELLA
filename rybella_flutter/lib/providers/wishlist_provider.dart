import 'package:flutter/material.dart';
import '../services/api_service.dart';

class WishlistProvider extends ChangeNotifier {
  List<int> _ids = [];
  bool _loading = false;

  List<int> get ids => _ids;
  bool get loading => _loading;

  bool isInWishlist(int productId) => _ids.contains(productId);

  Future<void> loadWishlist() async {
    _loading = true;
    notifyListeners();
    _ids = await ApiService.getWishlist();
    _loading = false;
    notifyListeners();
  }

  Future<bool> toggle(int productId) async {
    if (_ids.contains(productId)) {
      final res = await ApiService.removeWishlist(productId);
      if (res.success) {
        _ids = _ids.where((id) => id != productId).toList();
        notifyListeners();
        return true;
      }
    } else {
      final res = await ApiService.addWishlist(productId);
      if (res.success) {
        _ids = [..._ids, productId];
        notifyListeners();
        return true;
      }
    }
    return false;
  }
}
