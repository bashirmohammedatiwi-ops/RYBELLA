import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/orders_provider.dart';
import '../services/reminder_service.dart';
import '../services/push_service.dart';
import '../widgets/app_widgets.dart';
import 'dashboard_screen.dart';
import 'orders_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  final _reminder = ReminderService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().load();
      _reminder.onPendingChanged = (_) => context.read<OrdersProvider>().load(silent: true);
      _reminder.start();
    });
  }

  @override
  void dispose() {
    _reminder.stop();
    super.dispose();
  }

  void _openProfile() {
    final user = context.read<AuthProvider>().user;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [BoxShadow(color: Color(0x15000000), blurRadius: 24, offset: Offset(0, -4))],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(99))),
              const SizedBox(height: 22),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.3), blurRadius: 14)],
                ),
                child: Center(
                  child: Text(
                    (user?.name.isNotEmpty == true ? user!.name[0] : 'م').toUpperCase(),
                    style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(user?.name ?? 'موظف', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              if (user?.phone != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(user!.phone!, style: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                ),
              const SizedBox(height: 22),
              _ProfileTile(
                icon: Icons.person_add_rounded,
                label: 'إنشاء حساب عميل',
                color: AppTheme.primary,
                onTap: () {
                  Navigator.pop(ctx);
                  Navigator.of(context).pushNamed('/create-customer');
                },
              ),
              const SizedBox(height: 8),
              _ProfileTile(
                icon: Icons.notifications_active_rounded,
                label: 'تفعيل الإشعارات',
                color: AppTheme.info,
                onTap: () async {
                  Navigator.pop(ctx);
                  await PushService.requestAndSubscribe();
                },
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  await context.read<AuthProvider>().logout();
                },
                icon: const Icon(Icons.logout_rounded),
                label: const Text('تسجيل الخروج'),
                style: FilledButton.styleFrom(backgroundColor: AppTheme.danger, minimumSize: const Size.fromHeight(50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pending = context.watch<OrdersProvider>().stats.pending;
    final user = context.watch<AuthProvider>().user;
    final loading = context.watch<OrdersProvider>().loading;

    return Scaffold(
      body: AppBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // هيدر محسّن
              Container(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: AppTheme.heroGradient,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppTheme.borderLight),
                  boxShadow: const [AppTheme.cardShadowSoft],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _index == 0 ? 'مرحباً، ${user?.name.split(' ').first ?? 'موظف'} 👋' : 'إدارة الطلبات',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              if (pending > 0) ...[
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(color: AppTheme.warning, shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 6),
                              ],
                              Text(
                                pending > 0 ? '$pending طلب بانتظار التجهيز' : 'كل شيء تحت السيطرة ✨',
                                style: TextStyle(
                                  color: pending > 0 ? AppTheme.warning : AppTheme.textMuted,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton.filledTonal(
                      style: IconButton.styleFrom(backgroundColor: Colors.white.withValues(alpha: 0.8), foregroundColor: AppTheme.primary),
                      onPressed: loading ? null : () => context.read<OrdersProvider>().load(),
                      icon: loading
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.refresh_rounded),
                    ),
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: _openProfile,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.25), blurRadius: 8)],
                        ),
                        child: Center(
                          child: Text(
                            (user?.name.isNotEmpty == true ? user!.name[0] : 'م').toUpperCase(),
                            style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 18),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 300.ms),
              Expanded(
                child: IndexedStack(
                  index: _index,
                  children: const [DashboardScreen(), OrdersScreen()],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: const Border(top: BorderSide(color: AppTheme.borderLight)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: SafeArea(
          child: NavigationBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            height: 64,
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.space_dashboard_outlined),
                selectedIcon: Icon(Icons.space_dashboard_rounded),
                label: 'الرئيسية',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: pending > 0,
                  label: Text('$pending'),
                  backgroundColor: AppTheme.primary,
                  child: const Icon(Icons.receipt_long_outlined),
                ),
                selectedIcon: Badge(
                  isLabelVisible: pending > 0,
                  label: Text('$pending'),
                  backgroundColor: AppTheme.primary,
                  child: const Icon(Icons.receipt_long_rounded),
                ),
                label: 'الطلبات',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ProfileTile({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15))),
              Icon(Icons.chevron_left_rounded, color: color.withValues(alpha: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}
