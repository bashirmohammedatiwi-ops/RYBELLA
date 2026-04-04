class Product {
  final int id;
  final String name;
  final String? description;
  final String? mainImage;
  final int brandId;
  final String? brandName;
  final int categoryId;
  final String? categoryName;
  final int? subcategoryId;
  final String? subcategoryName;
  final List<ProductVariant> variants;
  final List<String> images;
  final List<String>? tags;
  final double? minPrice;
  final double? maxPrice;
  final bool isFeatured;
  final bool isBestSeller;
  final int? availableVariants;

  Product({
    required this.id,
    required this.name,
    this.description,
    this.mainImage,
    required this.brandId,
    this.brandName,
    required this.categoryId,
    this.categoryName,
    this.subcategoryId,
    this.subcategoryName,
    this.variants = const [],
    this.images = const [],
    this.tags,
    this.minPrice,
    this.maxPrice,
    this.isFeatured = false,
    this.isBestSeller = false,
    this.availableVariants,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final variantsRaw = json['variants'] as List?;
    final variants = variantsRaw
            ?.map((v) => ProductVariant.fromJson(v as Map<String, dynamic>))
            .toList() ??
        [];
    final imagesRaw = json['images'];
    List<String> images = [];
    if (imagesRaw is List) {
      images = imagesRaw.map((e) => e.toString()).toList();
    }
    final tagsRaw = json['tags'];
    List<String>? tags;
    if (tagsRaw is List) {
      tags = tagsRaw.map((e) => e.toString()).toList();
    } else if (tagsRaw is String && tagsRaw.isNotEmpty) {
      tags = tagsRaw.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList();
    }
    return Product(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      mainImage: json['main_image'] as String?,
      brandId: json['brand_id'] as int,
      brandName: json['brand_name'] as String?,
      categoryId: json['category_id'] as int,
      categoryName: json['category_name'] as String?,
      subcategoryId: json['subcategory_id'] as int?,
      subcategoryName: json['subcategory_name'] as String?,
      variants: variants,
      images: images,
      tags: tags,
      minPrice: _parseDouble(json['min_price']),
      maxPrice: _parseDouble(json['max_price']),
      isFeatured: json['is_featured'] == 1 || json['is_featured'] == true,
      isBestSeller: json['is_best_seller'] == 1 || json['is_best_seller'] == true,
      availableVariants: json['available_variants'] as int?,
    );
  }

  static double? _parseDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  String? get displayPrice {
    if (minPrice != null) {
      if (maxPrice != null && maxPrice != minPrice) {
        return '$minPrice - $maxPrice';
      }
      return minPrice.toString();
    }
    return null;
  }
}

class ProductVariant {
  final int id;
  final String shadeName;
  final String? colorCode;
  final double price;
  final int stock;
  final String? image;

  ProductVariant({
    required this.id,
    required this.shadeName,
    this.colorCode,
    required this.price,
    required this.stock,
    this.image,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id'] as int,
      shadeName: json['shade_name'] as String? ?? '',
      colorCode: json['color_code'] as String?,
      price: (json['price'] as num).toDouble(),
      stock: json['stock'] as int? ?? 0,
      image: json['image'] as String?,
    );
  }

  bool get inStock => stock > 0;
}
