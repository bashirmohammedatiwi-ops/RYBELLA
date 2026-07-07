import 'package:flutter/material.dart';
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
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(99))),
            const SizedBox(height: 20),
            CircleAvatar(
              radius: 34,
              backgroundColor: AppTheme.primarySoft,
              child: Text(
                (user?.name.isNotEmpty == true ? user!.name[0] : 'م').toUpperCase(),
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 12),
            Text(user?.name ?? 'موظف', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            if (user?.phone != null)
              Text(user!.phone!, style: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.person_add_outlined, color: AppTheme.primary),
              title: const Text('إنشاء حساب عميل'),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              onTap: () {
                Navigator.pop(ctx);
                Navigator.of(context).pushNamed('/create-customer');
              },
            ),
            ListTile(
              leading: const Icon(Icons.notifications_active_outlined, color: AppTheme.primary),
              title: const Text('تفعيل الإشعارات'),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              onTap: () async {
                Navigator.pop(ctx);
                await PushService.requestAndSubscribe();
              },
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () async {
                Navigator.pop(ctx);
                await context.read<AuthProvider>().logout();
              },
              icon: const Icon(Icons.logout_rounded),
              label: const Text('تسجيل الخروج'),
              style: FilledButton.styleFrom(backgroundColor: AppTheme.danger, minimumSize: const Size.fromHeight(48)),
            ),
          ],
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
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 10, 18, 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _index == 0 ? 'مرحباً، ${user?.name.split(' ').first ?? 'موظف'} 👋' : 'إدارة الطلبات',
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            pending > 0 ? '$pending طلب بانتظار التجهيز' : 'كل شيء تحت السيطرة',
                            style: const TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    IconButton.filledTonal(
                      style: IconButton.styleFrom(backgroundColor: AppTheme.primarySoft, foregroundColor: AppTheme.primary),
                      onPressed: loading ? null : () => context.read<OrdersProvider>().load(),
                      icon: loading
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.refresh_rounded),
                    ),
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: _openProfile,
                      borderRadius: BorderRadius.circular(16),
                      child: CircleAvatar(
                        radius: 22,
                        backgroundColor: AppTheme.primarySoft,
                        child: Text(
                          (user?.name.isNotEmpty == true ? user!.name[0] : 'م').toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primary),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
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
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          border: Border(top: BorderSide(color: AppTheme.borderLight)),
          boxShadow: [BoxShadow(color: Color(0x08000000), blurRadius: 12, offset: Offset(0, -4))],
        ),
        child: SafeArea(
          child: NavigationBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: [
              const NavigationDestination(icon: Icon(Icons.space_dashboard_outlined), selectedIcon: Icon(Icons.space_dashboard_rounded), label: 'الرئيسية'),
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
