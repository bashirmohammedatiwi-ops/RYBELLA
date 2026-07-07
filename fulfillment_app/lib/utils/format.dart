import 'package:intl/intl.dart';

String formatMoney(num value) {
  return '${NumberFormat.decimalPattern('ar_IQ').format(value)} د.ع';
}

String formatOrderDate(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  try {
    final dt = DateTime.parse(iso).toLocal();
    return DateFormat('d MMM yyyy • HH:mm', 'ar').format(dt);
  } catch (_) {
    return iso;
  }
}

String formatOrderTime(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  try {
    return DateFormat('HH:mm', 'ar').format(DateTime.parse(iso).toLocal());
  } catch (_) {
    return '';
  }
}

String timeAgoAr(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  try {
    final dt = DateTime.parse(iso).toLocal();
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'الآن';
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} د';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} س';
    if (diff.inDays < 7) return 'منذ ${diff.inDays} يوم';
    return formatOrderDate(iso);
  } catch (_) {
    return '';
  }
}
