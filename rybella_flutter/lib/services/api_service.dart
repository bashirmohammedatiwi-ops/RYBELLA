import 'package:http/http.dart' as http;
import '../core/api_client.dart';
import '../core/config.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../models/brand.dart';
import '../models/order.dart';

class ApiService {
  static final _client = ApiClient.instance;

  // Auth
  static Future<ApiResponse> login(String email, String password) async {
    final res = await _client.post('/auth/login', body: {'email': email, 'password': password});
    if (res.success && res.data != null) {
      final token = res.data['token'] as String?;
      if (token != null) await _client.setToken(token);
    }
    return res;
  }

  static Future<ApiResponse> register(Map<String, String> data) async {
    final res = await _client.post('/auth/register', body: data);
    if (res.success && res.data != null) {
      final token = res.data['token'] as String?;
      if (token != null) await _client.setToken(token);
    }
    return res;
  }

  static Future<ApiResponse> getProfile() async {
    return _client.get('/auth/me');
  }

  static Future<void> logout() async {
    await _client.setToken(null);
  }

  // Products
  static Future<List<Product>> getProducts({
    int? categoryId,
    int? subcategoryId,
    int? brandId,
    String? search,
    String? tags,
    String? colorCode,
    double? minPrice,
    double? maxPrice,
    String? featured,
    String? sortBy,
  }) async {
    final params = <String, String>{
      'status': 'published',
      if (categoryId != null) 'category_id': categoryId.toString(),
      if (subcategoryId != null) 'subcategory_id': subcategoryId.toString(),
      if (brandId != null) 'brand_id': brandId.toString(),
      if (search != null && search.isNotEmpty) 'search': search,
      if (tags != null && tags.isNotEmpty) 'tags': tags,
      if (colorCode != null && colorCode.isNotEmpty) 'color_code': colorCode,
      if (minPrice != null) 'min_price': minPrice.toString(),
      if (maxPrice != null) 'max_price': maxPrice.toString(),
      if (featured == '1') 'featured': '1',
      if (sortBy != null && sortBy.isNotEmpty) 'sort_by': sortBy,
    };
    final res = await _client.get('/products', params: params);
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<Product?> getProduct(int id) async {
    final res = await _client.get('/products/$id');
    if (!res.success || res.data == null) return null;
    return Product.fromJson(res.data as Map<String, dynamic>);
  }

  static Future<Map<String, dynamic>> getFilters() async {
    final res = await _client.get('/products/filters');
    if (!res.success || res.data == null) return {'tags': [], 'colors': []};
    return Map<String, dynamic>.from(res.data as Map);
  }

  // Categories & Brands
  static Future<List<Category>> getCategories() async {
    final res = await _client.get('/categories');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<List<Subcategory>> getSubcategories({int? categoryId}) async {
    final params = categoryId != null ? {'category_id': categoryId.toString()} : null;
    final res = await _client.get('/subcategories', params: params);
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Subcategory.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<List<Brand>> getBrands() async {
    final res = await _client.get('/brands');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Brand.fromJson(e as Map<String, dynamic>)).toList();
  }

  // Stories
  static Future<List<Map<String, dynamic>>> getStories() async {
    final res = await _client.get('/stories');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  // Banners & Offers
  static Future<List<Map<String, dynamic>>> getBanners() async {
    final res = await _client.get('/banners');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<List<Map<String, dynamic>>> getOffers() async {
    final res = await _client.get('/offers');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<Map<String, dynamic>?> getOfferById(int id) async {
    final res = await _client.get('/offers/$id');
    if (!res.success || res.data == null) return null;
    return Map<String, dynamic>.from(res.data as Map);
  }

  // Cart
  static Future<List<Map<String, dynamic>>> getCart() async {
    final res = await _client.get('/cart');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<ApiResponse> addToCart(int variantId, int quantity) async {
    return _client.post('/cart/add', body: {'variant_id': variantId, 'quantity': quantity});
  }

  static Future<ApiResponse> updateCartItem(int itemId, int quantity) async {
    return _client.put('/cart/$itemId', body: {'quantity': quantity});
  }

  static Future<ApiResponse> clearCart() async {
    return _client.delete('/cart');
  }

  static Future<ApiResponse> removeCartItem(int itemId) async {
    return _client.delete('/cart/$itemId');
  }

  // Wishlist
  static Future<List<int>> getWishlist() async {
    final res = await _client.get('/wishlist');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => (e['product_id'] ?? e['id']) as int).toList();
  }

  static Future<ApiResponse> addWishlist(int productId) async {
    return _client.post('/wishlist/$productId');
  }

  static Future<ApiResponse> removeWishlist(int productId) async {
    return _client.delete('/wishlist/$productId');
  }

  // Orders
  static Future<List<Order>> getOrders() async {
    final res = await _client.get('/orders');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Order.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<Order?> getOrder(int id) async {
    final res = await _client.get('/orders/$id');
    if (!res.success || res.data == null) return null;
    return Order.fromJson(res.data as Map<String, dynamic>);
  }

  static Future<ApiResponse> createOrder(Map<String, dynamic> data) async {
    return _client.post('/orders', body: data);
  }

  // Delivery & Coupons
  static Future<List<Map<String, dynamic>>> getDeliveryZones() async {
    final res = await _client.get('/delivery-zones');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<ApiResponse> applyCoupon(String code, double total) async {
    return _client.post('/coupons/apply', body: {'code': code, 'total': total});
  }

  // Reviews
  static Future<List<Map<String, dynamic>>> getProductReviews(int productId) async {
    final res = await _client.get('/reviews/products/$productId');
    if (!res.success || res.data == null) return [];
    final list = res.data is List ? res.data as List : [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<ApiResponse> createReview({
    required int productId,
    required int rating,
    String? comment,
    List<http.MultipartFile>? images,
  }) async {
    if (images != null && images.isNotEmpty) {
      final fields = {
        'product_id': productId.toString(),
        'rating': rating.toString(),
        if (comment != null) 'comment': comment,
      };
      return _client.postMultipart('/reviews', fields: fields, files: images);
    }
    return _client.post('/reviews', body: {
      'product_id': productId,
      'rating': rating,
      if (comment != null) 'comment': comment,
    });
  }

  // Web settings
  static Future<Map<String, dynamic>?> getWebSettings() async {
    final res = await _client.get('/web-settings');
    if (!res.success || res.data == null) return null;
    return Map<String, dynamic>.from(res.data as Map);
  }
}
