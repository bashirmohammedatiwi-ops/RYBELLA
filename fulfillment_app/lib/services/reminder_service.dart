import 'dart:async';

import '../core/config.dart';
import 'api_service.dart';
import 'push_service.dart';

class ReminderService {
  Timer? _pollTimer;
  Timer? _reminderTimer;
  int _lastPending = 0;
  DateTime? _lastReminderAt;
  void Function(int pending)? onPendingChanged;

  void start() {
    stop();
    _pollTimer = Timer.periodic(AppConfig.ordersPollInterval, (_) => _check());
    _reminderTimer = Timer.periodic(AppConfig.localReminderInterval, (_) => _remindIfNeeded());
    _check();
  }

  void stop() {
    _pollTimer?.cancel();
    _reminderTimer?.cancel();
    _pollTimer = null;
    _reminderTimer = null;
  }

  Future<void> refreshNow() => _check();

  Future<void> _check() async {
    final stats = await ApiService.getStats();
    if (stats.pending != _lastPending) {
      _lastPending = stats.pending;
      onPendingChanged?.call(stats.pending);
    }
    if (stats.pending == 0) {
      await PushService.cancelAll();
    }
  }

  Future<void> _remindIfNeeded() async {
    final stats = await ApiService.getStats();
    _lastPending = stats.pending;
    if (stats.pending <= 0) {
      await PushService.cancelAll();
      return;
    }

    final now = DateTime.now();
    if (_lastReminderAt != null &&
        now.difference(_lastReminderAt!) < AppConfig.localReminderInterval) {
      return;
    }
    _lastReminderAt = now;

    final label = stats.pending == 1 ? 'طلب واحد' : '${stats.pending} طلبات';
    await PushService.showLocal(
      title: 'تذكير بالتجهيز ⏰',
      body: 'لديك $label بانتظار التجهيز — افتح التطبيق للمتابعة',
      ongoing: true,
    );
  }
}
