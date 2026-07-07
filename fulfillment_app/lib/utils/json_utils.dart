/// تحويل آمن لقيم JSON القادمة من PostgreSQL (أرقام كنصوص أحياناً).
int jsonInt(dynamic value, [int fallback = 0]) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

double jsonDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is double) return value;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

String jsonString(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  return value.toString();
}
