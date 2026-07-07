class StaffUser {
  final int id;
  final String name;
  final String? email;
  final String? phone;
  final String role;

  const StaffUser({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    required this.role,
  });

  factory StaffUser.fromJson(Map<String, dynamic> json) {
    return StaffUser(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'staff',
    );
  }

  bool get canUseFulfillment => role == 'staff' || role == 'admin';
}
