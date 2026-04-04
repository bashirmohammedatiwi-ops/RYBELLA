class Brand {
  final int id;
  final String name;
  final String? logo;

  Brand({
    required this.id,
    required this.name,
    this.logo,
  });

  factory Brand.fromJson(Map<String, dynamic> json) {
    return Brand(
      id: json['id'] as int,
      name: json['name'] as String,
      logo: json['logo'] as String?,
    );
  }
}
