/// مطابقة تقريب الأسعار في الويب (أقرب 250 د.ع)
const int displayPriceRoundStep = 250;

double? roundDisplayPrice(num? value) {
  final n = value?.toDouble();
  if (n == null || !n.isFinite || n <= 0) return null;
  final rounded = (n / displayPriceRoundStep).round() * displayPriceRoundStep;
  return rounded > 0 ? rounded.toDouble() : displayPriceRoundStep.toDouble();
}

class BundlePricing {
  final List<Map<String, dynamic>> lines;
  final double subtotal;
  final double discount;
  final double unitTotal;
  final double total;

  const BundlePricing({
    required this.lines,
    required this.subtotal,
    required this.discount,
    required this.unitTotal,
    required this.total,
  });
}

BundlePricing calcBundlePricing(
  List<Map<String, dynamic>> lines, {
  num discountPercent = 0,
  int quantity = 1,
}) {
  final normalized = lines.map((line) {
    final price = roundDisplayPrice(line['price'] as num?) ?? ((line['price'] as num?)?.toDouble() ?? 0);
    return {...line, 'price': price};
  }).toList();

  final subtotal = normalized.fold<double>(0, (sum, line) {
    final price = (line['price'] as num?)?.toDouble() ?? 0;
    final qty = (line['quantity'] as num?)?.toInt() ?? 1;
    return sum + price * qty;
  });

  final discount = subtotal * ((discountPercent.toDouble()) / 100);
  final unitTotal = roundDisplayPrice(subtotal - discount) ?? (subtotal - discount).clamp(0, double.infinity);
  return BundlePricing(
    lines: normalized,
    subtotal: subtotal,
    discount: discount,
    unitTotal: unitTotal,
    total: unitTotal * quantity,
  );
}
