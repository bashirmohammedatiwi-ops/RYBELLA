import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/orders_provider.dart';
import '../services/reminder_service.dart';
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

  @override
  Widget build(BuildContext context) {
    final pending = context.watch<OrdersProvider>().stats.pending;
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: Text(_index == 0 ? 'لوحة التجهيز' : 'الطلبات'),
        actions: [
          if (pending > 0)
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 8),
              child: Chip(
                label: Text('$pending معلّق'),
                backgroundColor: AppTheme.warning.withValues(alpha: 0.15),
                labelStyle: const TextStyle(color: AppTheme.warning, fontWeight: FontWeight.w800),
              ),
            ),
          PopupMenuButton<String>(
            onSelected: (v) async {
              if (v == 'logout') await context.read<AuthProvider>().logout();
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Text(user?.name ?? 'موظف', style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(value: 'logout', child: Text('تسجيل الخروج')),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          DashboardScreen(),
          OrdersScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.dashboard_rounded), label: 'الرئيسية'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: pending > 0,
              label: Text('$pending'),
              child: const Icon(Icons.list_alt_rounded),
            ),
            label: 'الطلبات',
          ),
        ],
      ),
    );
  }
}
