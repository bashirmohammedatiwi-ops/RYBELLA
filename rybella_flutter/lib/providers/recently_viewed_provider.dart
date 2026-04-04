import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _key = 'rybella_recent_ids';
const _maxCount = 20;

class RecentlyViewedProvider extends ChangeNotifier {
  List<int> _ids = [];

  List<int> get ids => _ids;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw != null) {
      _ids = raw.split(',').map((e) => int.tryParse(e)).whereType<int>().toList();
      notifyListeners();
    }
  }

  Future<void> add(int productId) async {
    _ids.remove(productId);
    _ids.insert(0, productId);
    if (_ids.length > _maxCount) _ids = _ids.sublist(0, _maxCount);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, _ids.join(','));
    notifyListeners();
  }
}
