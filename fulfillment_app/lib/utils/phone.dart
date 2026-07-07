/// توحيد رقم الهاتف العراقي — 07xxxxxxxxx
String normalizeIraqiPhone(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return '';

  if (digits.startsWith('9647') && digits.length >= 13) {
    return '0${digits.substring(3, 13)}';
  }
  if (digits.startsWith('07') && digits.length >= 11) {
    return digits.substring(0, 11);
  }
  if (digits.startsWith('7') && digits.length >= 10) {
    return '0${digits.substring(0, 10)}';
  }
  return digits;
}

bool isValidIraqiPhone(String value) {
  final n = normalizeIraqiPhone(value);
  return RegExp(r'^07\d{9}$').hasMatch(n);
}
