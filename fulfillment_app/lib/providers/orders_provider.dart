import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../services/api_service.dart';

enum OrderSort { newest, oldest, amountHigh, amountLow }

class OrdersProvider extends ChangeNotifier {
  List<FulfillmentOrder> _orders = [];
  OrderStats _stats = const OrderStats();
  bool _loading = false;
  String? _error;
  String _filter = 'pending';
  String _search = '';
  OrderSort _sort = OrderSort.newest;

  List<FulfillmentOrder> get orders => _orders;
  OrderStats get stats => _stats;
  bool get loading => _loading;
  String? get error => _error;
  String get filter => _filter;
  String get search => _search;
  OrderSort get sort => _sort;

  List<FulfillmentOrder> get filteredOrders {
    var list = _orders.where((o) => o.status == _filter).toList();

    final q = _search.trim().toLowerCase();
    if (q.isNotEmpty) {
      list = list.where((o) {
        final hay = [
          o.id.toString(),
          o.customerName ?? '',
          o.city,
          o.address,
          o.displayPhone,
        ].join(' ').toLowerCase();
        return hay.contains(q);
      }).toList();
    }

    list.sort((a, b) {
      switch (_sort) {
        case OrderSort.oldest:
          return a.createdAt.compareTo(b.createdAt);
        case OrderSort.amountHigh:
          return b.finalPrice.compareTo(a.finalPrice);
        case OrderSort.amountLow:
          return a.finalPrice.compareTo(b.finalPrice);
        case OrderSort.newest:
          return b.createdAt.compareTo(a.createdAt);
      }
    });

    return list;
  }

  void setFilter(String value) {
    _filter = value;
    notifyListeners();
  }

  void setSearch(String value) {
    _search = value;
    notifyListeners();
  }

  void setSort(OrderSort value) {
    _sort = value;
    notifyListeners();
  }

  void goToOrdersTabWithFilter(String filter) {
    _filter = filter;
    notifyListeners();
  }

  Future<void> load({bool silent = false}) async {
    if (!silent) {
      _loading = true;
      _error = null;
      notifyListeners();
    }

    try {
      final results = await Future.wait([
        ApiService.getOrders(),
        ApiService.getStats(),
      ]);
      _orders = results[0] as List<FulfillmentOrder>;
      _stats = results[1] as OrderStats;
      _error = null;
    } catch (e) {
      _error = e is Exception ? e.toString().replaceFirst('Exception: ', '') : e.toString();
    }

    _loading = false;
    notifyListeners();
  }

  FulfillmentOrder? findById(int id) {
    try {
      return _orders.firstWhere((o) => o.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<FulfillmentOrder?> fetchOrder(int id) async {
    final cached = findById(id);
    if (cached != null && cached.items.isNotEmpty) return cached;
    final order = await ApiService.getOrder(id);
    if (order != null) {
      final idx = _orders.indexWhere((o) => o.id == id);
      if (idx >= 0) {
        _orders[idx] = order;
      } else {
        _orders = [order, ..._orders];
      }
      notifyListeners();
    }
    return order;
  }

  Future<bool> updateStatus(int orderId, String status, {String? cancelReason}) async {
    final res = await ApiService.updateOrderStatus(orderId, status, cancelReason: cancelReason);
    if (!res.success) {
      _error = res.error;
      notifyListeners();
      return false;
    }
    await load(silent: true);
    return true;
  }
}
