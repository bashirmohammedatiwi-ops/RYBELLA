import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  static const _tokenKey = 'fulfillment_token';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> setToken(String? token) async {
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString(_tokenKey, token);
    } else {
      await prefs.remove(_tokenKey);
    }
  }

  Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<ApiResponse> get(String path, {Map<String, String>? params}) async {
    try {
      var uri = Uri.parse('${AppConfig.apiUrl}$path');
      if (params != null && params.isNotEmpty) {
        uri = uri.replace(queryParameters: params);
      }
      final res = await http.get(uri, headers: await _headers());
      return _handle(res);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }

  Future<ApiResponse> post(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await http.post(
        Uri.parse('${AppConfig.apiUrl}$path'),
        headers: await _headers(),
        body: body != null ? jsonEncode(body) : null,
      );
      return _handle(res);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }

  Future<ApiResponse> put(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await http.put(
        Uri.parse('${AppConfig.apiUrl}$path'),
        headers: await _headers(),
        body: body != null ? jsonEncode(body) : null,
      );
      return _handle(res);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }

  ApiResponse _handle(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        final data = res.body.isEmpty ? null : jsonDecode(res.body);
        return ApiResponse.success(data);
      } catch (_) {
        return ApiResponse.success(res.body);
      }
    }
    if (res.statusCode == 401) setToken(null);
    try {
      final err = jsonDecode(res.body);
      return ApiResponse.error(err['message']?.toString() ?? 'خطأ في الخادم');
    } catch (_) {
      return ApiResponse.error('خطأ في الخادم (${res.statusCode})');
    }
  }
}

class ApiResponse {
  final bool success;
  final dynamic data;
  final String? error;

  const ApiResponse._({required this.success, this.data, this.error});

  factory ApiResponse.success(dynamic data) => ApiResponse._(success: true, data: data);
  factory ApiResponse.error(String msg) => ApiResponse._(success: false, error: msg);
}
