import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient _instance = ApiClient._();
  static ApiClient get instance => _instance;

  static const _tokenKey = 'rybella_token';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> _setToken(String? token) async {
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString(_tokenKey, token);
    } else {
      await prefs.remove(_tokenKey);
    }
  }

  Future<Map<String, String>> _headers({bool jsonContent = true}) async {
    final token = await _getToken();
    final headers = <String, String>{
      if (jsonContent) 'Content-Type': 'application/json',
    };
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  Future<ApiResponse> get(String path, {Map<String, String>? params}) async {
    try {
      var uri = Uri.parse('${AppConfig.apiUrl}$path');
      if (params != null && params.isNotEmpty) {
        uri = uri.replace(queryParameters: params);
      }
      final res = await http.get(uri, headers: await _headers());
      return _handleResponse(res);
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
      return _handleResponse(res);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }

  Future<ApiResponse> postMultipart(
    String path, {
    required Map<String, String> fields,
    List<http.MultipartFile>? files,
  }) async {
    try {
      final req = http.MultipartRequest(
        'POST',
        Uri.parse('${AppConfig.apiUrl}$path'),
      );
      final token = await _getToken();
      if (token != null) req.headers['Authorization'] = 'Bearer $token';
      req.fields.addAll(fields);
      if (files != null) req.files.addAll(files);
      final stream = await req.send();
      final res = await http.Response.fromStream(stream);
      return _handleResponse(res);
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
      return _handleResponse(res);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }

  Future<ApiResponse> delete(String path) async {
    try {
      final res = await http.delete(
        Uri.parse('${AppConfig.apiUrl}$path'),
        headers: await _headers(),
      );
      return _handleResponse(res);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }

  ApiResponse _handleResponse(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        final data = res.body.isEmpty ? null : jsonDecode(res.body);
        return ApiResponse.success(data);
      } catch (_) {
        return ApiResponse.success(res.body);
      }
    }
    if (res.statusCode == 401) {
      _setToken(null);
    }
    try {
      final err = jsonDecode(res.body);
      return ApiResponse.error(err['message'] ?? 'خطأ في الخادم');
    } catch (_) {
      return ApiResponse.error('خطأ في الخادم');
    }
  }

  Future<void> setToken(String? token) => _setToken(token);
}

class ApiResponse {
  final bool success;
  final dynamic data;
  final String? error;

  ApiResponse._({required this.success, this.data, this.error});

  factory ApiResponse.success(dynamic data) =>
      ApiResponse._(success: true, data: data);

  factory ApiResponse.error(String msg) =>
      ApiResponse._(success: false, error: msg);
}
