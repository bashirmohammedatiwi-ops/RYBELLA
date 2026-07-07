class OrderStats {
  final int pending;
  final int preparing;
  final int delivered;
  final int cancelled;
  final int total;

  const OrderStats({
    this.pending = 0,
    this.preparing = 0,
    this.delivered = 0,
    this.cancelled = 0,
    this.total = 0,
  });

  factory OrderStats.fromJson(Map<String, dynamic> json) {
    return OrderStats(
      pending: (json['pending'] as num?)?.toInt() ?? 0,
      preparing: (json['preparing'] as num?)?.toInt() ?? 0,
      delivered: (json['delivered'] as num?)?.toInt() ?? 0,
      cancelled: (json['cancelled'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toInt() ?? 0,
    );
  }
}

class FulfillmentOrder {
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
  final String? customerName;
  final String? customerPhone;
  final String? couponCode;
  final String? cancelReason;
  final String createdAt;
  final List<OrderLine> items;
  final List<OrderBundle> bundles;

  const FulfillmentOrder({
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
    this.customerName,
    this.customerPhone,
    this.couponCode,
    this.cancelReason,
    required this.createdAt,
    this.items = const [],
    this.bundles = const [],
  });

  factory FulfillmentOrder.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'] as List? ?? [];
    final bundlesRaw = json['bundles'] as List? ?? [];
    return FulfillmentOrder(
      id: json['id'] as int,
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0,
      deliveryFee: (json['delivery_fee'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      finalPrice: (json['final_price'] as num?)?.toDouble() ?? 0,
      status: _normalizeStatus(json['status'] as String? ?? 'pending'),
      paymentMethod: json['payment_method'] as String?,
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      phone: json['phone'] as String?,
      customerName: json['customer_name'] as String?,
      customerPhone: json['customer_phone'] as String?,
      couponCode: json['coupon_code'] as String?,
      cancelReason: json['cancel_reason'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      items: itemsRaw.map((e) => OrderLine.fromJson(e as Map<String, dynamic>)).toList(),
      bundles: bundlesRaw.map((e) => OrderBundle.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  static String _normalizeStatus(String status) {
    const legacy = {
      'confirmed': 'preparing_shipping',
      'processing': 'preparing_shipping',
      'shipped': 'preparing_shipping',
    };
    return legacy[status] ?? status;
  }

  int get lineCount => items.length + bundles.fold(0, (s, b) => s + b.items.length);

  String get displayPhone => phone ?? customerPhone ?? '—';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'preparing_shipping':
        return 'قيد التجهيز';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }
}

class OrderLine {
  final int id;
  final int variantId;
  final String? productName;
  final String? shadeName;
  final String? barcode;
  final String? image;
  final int quantity;
  final double price;

  const OrderLine({
    required this.id,
    required this.variantId,
    this.productName,
    this.shadeName,
    this.barcode,
    this.image,
    required this.quantity,
    required this.price,
  });

  factory OrderLine.fromJson(Map<String, dynamic> json) {
    final image = json['variant_image'] as String? ?? json['product_image'] as String?;
    return OrderLine(
      id: json['id'] as int? ?? 0,
      variantId: json['variant_id'] as int? ?? 0,
      productName: json['product_name'] as String?,
      shadeName: json['shade_name'] as String?,
      barcode: json['barcode'] as String?,
      image: image,
      quantity: json['quantity'] as int? ?? 1,
      price: (json['price'] as num?)?.toDouble() ?? 0,
    );
  }

  double get subtotal => price * quantity;
}

class OrderBundle {
  final int id;
  final String offerTitle;
  final int quantity;
  final double totalPrice;
  final List<OrderLine> items;

  const OrderBundle({
    required this.id,
    required this.offerTitle,
    required this.quantity,
    required this.totalPrice,
    this.items = const [],
  });

  factory OrderBundle.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'] as List? ?? [];
    return OrderBundle(
      id: json['id'] as int? ?? 0,
      offerTitle: json['offer_title'] as String? ?? 'عرض',
      quantity: json['quantity'] as int? ?? 1,
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0,
      items: itemsRaw.map((e) => OrderLine.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}
