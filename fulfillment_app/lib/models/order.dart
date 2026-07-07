import '../utils/json_utils.dart';

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
      pending: jsonInt(json['pending']),
      preparing: jsonInt(json['preparing']),
      delivered: jsonInt(json['delivered']),
      cancelled: jsonInt(json['cancelled']),
      total: jsonInt(json['total']),
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
      id: jsonInt(json['id']),
      totalPrice: jsonDouble(json['total_price']),
      deliveryFee: jsonDouble(json['delivery_fee']),
      discount: jsonDouble(json['discount']),
      finalPrice: jsonDouble(json['final_price']),
      status: _normalizeStatus(jsonString(json['status'], 'pending')),
      paymentMethod: json['payment_method'] as String?,
      address: jsonString(json['address']),
      city: jsonString(json['city']),
      phone: json['phone'] as String?,
      customerName: json['customer_name'] as String?,
      customerPhone: json['customer_phone'] as String?,
      couponCode: json['coupon_code'] as String?,
      cancelReason: json['cancel_reason'] as String?,
      createdAt: jsonString(json['created_at']),
      items: itemsRaw
          .map((e) => OrderLine.fromJson(
                e is Map<String, dynamic> ? e : Map<String, dynamic>.from(e as Map),
              ))
          .toList(),
      bundles: bundlesRaw
          .map((e) => OrderBundle.fromJson(
                e is Map<String, dynamic> ? e : Map<String, dynamic>.from(e as Map),
              ))
          .toList(),
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
      id: jsonInt(json['id']),
      variantId: jsonInt(json['variant_id']),
      productName: json['product_name'] as String?,
      shadeName: json['shade_name'] as String?,
      barcode: json['barcode'] as String?,
      image: image,
      quantity: jsonInt(json['quantity'], 1),
      price: jsonDouble(json['price']),
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
      id: jsonInt(json['id']),
      offerTitle: jsonString(json['offer_title'], 'عرض'),
      quantity: jsonInt(json['quantity'], 1),
      totalPrice: jsonDouble(json['total_price']),
      items: itemsRaw
          .map((e) => OrderLine.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
