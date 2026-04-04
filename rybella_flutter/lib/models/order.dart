class Order {
  final int id;
  final double totalPrice;
  final double deliveryFee;
  final double discount;
  final double finalPrice;
  final String status;
  final String? paymentMethod;
  final String address;
  final String city;
  final String? phone;
  final String? notes;
  final String createdAt;
  final List<OrderItem> items;

  Order({
    required this.id,
    required this.totalPrice,
    required this.deliveryFee,
    required this.discount,
    required this.finalPrice,
    required this.status,
    this.paymentMethod,
    required this.address,
    required this.city,
    this.phone,
    this.notes,
    required this.createdAt,
    this.items = const [],
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'] as List?;
    final items = itemsRaw
            ?.map((i) => OrderItem.fromJson(i as Map<String, dynamic>))
            .toList() ??
        [];
    return Order(
      id: json['id'] as int,
      totalPrice: (json['total_price'] as num).toDouble(),
      deliveryFee: (json['delivery_fee'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      finalPrice: (json['final_price'] as num).toDouble(),
      status: json['status'] as String? ?? 'pending',
      paymentMethod: json['payment_method'] as String?,
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      phone: json['phone'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      items: items,
    );
  }

  String get statusAr {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'processing':
        return 'قيد التجهيز';
      case 'shipped':
        return 'تم الشحن';
      case 'delivered':
        return 'تم التوصيل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }
}

class OrderItem {
  final int id;
  final int variantId;
  final String? productName;
  final String? shadeName;
  final int quantity;
  final double price;

  OrderItem({
    required this.id,
    required this.variantId,
    this.productName,
    this.shadeName,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] as int? ?? 0,
      variantId: json['variant_id'] as int,
      productName: json['product_name'] as String?,
      shadeName: json['shade_name'] as String?,
      quantity: json['quantity'] as int? ?? 1,
      price: (json['price'] as num).toDouble(),
    );
  }

  double get subtotal => price * quantity;
}
