class Category {
  final int id;
  final String name;
  final String? image;
  final String? icon;
  final String? overlayText;

  Category({
    required this.id,
    required this.name,
    this.image,
    this.icon,
    this.overlayText,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as int,
      name: json['name'] as String,
      image: json['image'] as String?,
      icon: json['icon'] as String?,
      overlayText: json['overlay_text'] as String?,
    );
  }
}

class Subcategory {
  final int id;
  final int categoryId;
  final String name;
  final String? image;

  Subcategory({
    required this.id,
    required this.categoryId,
    required this.name,
    this.image,
  });

  factory Subcategory.fromJson(Map<String, dynamic> json) {
    return Subcategory(
      id: json['id'] as int,
      categoryId: json['category_id'] as int,
      name: json['name'] as String,
      image: json['image'] as String?,
    );
  }
}
