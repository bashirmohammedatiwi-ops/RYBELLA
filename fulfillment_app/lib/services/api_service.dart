import '../core/api_client.dart';
import '../models/order.dart';
import '../models/user.dart';
import '../utils/phone.dart';

class ApiService {
  static final _client = ApiClient.instance;

  static Future<ApiResponse> login(String phone, String password) async {
    final normalized = normalizeIraqiPhone(phone);
    if (!isValidIraqiPhone(normalized)) {
      return ApiResponse.error('رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقم');
    }
    final res = await _client.post('/auth/login', body: {
      'phone': normalized,
      'password': password,
      'as': 'staff',
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
    if (!res.success) {
      throw Exception(res.error ?? 'فشل تحميل الطلبات');
    }
    if (res.data is! List) return [];
    final list = <FulfillmentOrder>[];
    for (final raw in res.data as List) {
      if (raw is Map<String, dynamic>) {
        list.add(FulfillmentOrder.fromJson(raw));
      } else if (raw is Map) {
        list.add(FulfillmentOrder.fromJson(Map<String, dynamic>.from(raw)));
      }
    }
    return list;
  }

  static Future<FulfillmentOrder?> getOrder(int id) async {
    final res = await _client.get('/orders/$id');
    if (!res.success || res.data is! Map) return null;
    final data = res.data is Map<String, dynamic>
        ? res.data as Map<String, dynamic>
        : Map<String, dynamic>.from(res.data as Map);
    return FulfillmentOrder.fromJson(data);
  }

  static Future<OrderStats> getStats() async {
    final res = await _client.get('/staff/stats');
    if (!res.success) {
      throw Exception(res.error ?? 'فشل تحميل الإحصائيات');
    }
    if (res.data is! Map) return const OrderStats();
    final data = res.data is Map<String, dynamic>
        ? res.data as Map<String, dynamic>
        : Map<String, dynamic>.from(res.data as Map);
    return OrderStats.fromJson(data);
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

  static Future<ApiResponse> createCustomer({
    required String name,
    required String phone,
    required String password,
  }) {
    return _client.post('/staff/customers', body: {
      'name': name,
      'phone': normalizeIraqiPhone(phone),
      'password': password,
    });
  }
}
