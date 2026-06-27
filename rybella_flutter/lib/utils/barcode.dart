/// مطابقة منطق البحث بالباركود في الويب
bool isBarcodeLikeQuery(String value) {
  final raw = value.trim();
  if (raw.isEmpty) return false;
  final normalized = raw.replaceAll(RegExp(r'[\s\-]'), '');
  if (RegExp(r'^\d{4,}$').hasMatch(normalized)) return true;
  if (raw.contains(' ')) return false;
  return RegExp(r'^[A-Za-z0-9\-_]{5,24}$').hasMatch(raw);
}
