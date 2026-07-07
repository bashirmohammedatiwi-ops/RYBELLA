import '../core/api_client.dart';
import '../models/order.dart';
import '../models/user.dart';

class ApiService {
  static final _client = ApiClient.instance;

  static Future<ApiResponse> login(String phone, String password) async {
    final res = await _client.post('/auth/login', body: {
      'phone': phone.trim(),
      'password': password,
    });
    if (res.success && res.data is Map) {
      final data = res.data as Map<String, dynamic>;
      final token = data['token'] as String?;
      if (token != null) await _client.setToken(token);
    }
    return res;
  }

  static Future<void> logout() => _client.setToken(null);

  static Future<StaffUser?> getProfile() async {
    final res = await _client.get('/auth/me');
    if (!res.success || res.data is! Map) return null;
    return StaffUser.fromJson(res.data as Map<String, dynamic>);
  }

  static Future<List<FulfillmentOrder>> getOrders() async {
    final res = await _client.get('/orders');
    if (!res.success || res.data is! List) return [];
    return (res.data as List)
        .map((e) => FulfillmentOrder.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<FulfillmentOrder?> getOrder(int id) async {
    final res = await _client.get('/orders/$id');
    if (!res.success || res.data is! Map) return null;
    return FulfillmentOrder.fromJson(res.data as Map<String, dynamic>);
  }

  static Future<OrderStats> getStats() async {
    final res = await _client.get('/staff/stats');
    if (!res.success || res.data is! Map) return const OrderStats();
    return OrderStats.fromJson(res.data as Map<String, dynamic>);
  }

  static Future<ApiResponse> updateOrderStatus(
    int orderId,
    String status, {
    String? cancelReason,
  }) async {
    return _client.put('/orders/$orderId/status', body: {
      'status': status,
      if (cancelReason != null) 'cancel_reason': cancelReason,
    });
  }

  static Future<ApiResponse> subscribePush({
    required String token,
    required String platform,
  }) {
    return _client.post('/staff/push/subscribe', body: {
      'token': token,
      'platform': platform,
    });
  }

  static Future<ApiResponse> unsubscribePush({String? token}) {
    return _client.post('/staff/push/unsubscribe', body: {
      if (token != null) 'token': token,
    });
  }
}
