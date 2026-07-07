import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class OrdersProvider extends ChangeNotifier {
  List<FulfillmentOrder> _orders = [];
  OrderStats _stats = const OrderStats();
  bool _loading = false;
  String? _error;
  String _filter = 'pending';

  List<FulfillmentOrder> get orders => _orders;
  OrderStats get stats => _stats;
  bool get loading => _loading;
  String? get error => _error;
  String get filter => _filter;

  List<FulfillmentOrder> get filteredOrders {
    if (_filter == 'all') return _orders;
    return _orders.where((o) => o.status == _filter).toList();
  }

  void setFilter(String value) {
    _filter = value;
    notifyListeners();
  }

  Future<void> load({bool silent = false}) async {
    if (!silent) {
      _loading = true;
      _error = null;
      notifyListeners();
    }

    final results = await Future.wait([
      ApiService.getOrders(),
      ApiService.getStats(),
    ]);

    _orders = results[0] as List<FulfillmentOrder>;
    _stats = results[1] as OrderStats;
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
    if (cached != null) return cached;
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

    final idx = _orders.indexWhere((o) => o.id == orderId);
    if (idx >= 0) {
      final old = _orders[idx];
      _orders[idx] = FulfillmentOrder(
        id: old.id,
        totalPrice: old.totalPrice,
        deliveryFee: old.deliveryFee,
        discount: old.discount,
        finalPrice: old.finalPrice,
        status: status,
        paymentMethod: old.paymentMethod,
        address: old.address,
        city: old.city,
        phone: old.phone,
        customerName: old.customerName,
        customerPhone: old.customerPhone,
        couponCode: old.couponCode,
        cancelReason: cancelReason ?? old.cancelReason,
        createdAt: old.createdAt,
        items: old.items,
        bundles: old.bundles,
      );
    }
    await load(silent: true);
    return true;
  }
}
