import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/notifications_provider.dart';
import '../services/push_service.dart';
import '../widgets/push_permission_prompt.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isLoggedIn) {
        context.read<NotificationsProvider>().load();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final unread = context.watch<NotificationsProvider>().unreadCount;

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('حسابي')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('سجلي الدخول للوصول لحسابك'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.push('/login?from=${Uri.encodeComponent('/profile')}'),
                child: const Text('تسجيل الدخول'),
              ),
            ],
          ),
        ),
      );
    }

    final user = auth.user!;
    final name = user['name'] as String? ?? '';
    final phone = user['phone'] as String? ?? user['email'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('حسابي')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const PushPermissionPrompt(),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppTheme.primarySoft,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.primary),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        Text(phone, style: TextStyle(color: Colors.grey[600])),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _MenuItem(
            icon: Icons.notifications_outlined,
            title: 'الإشعارات',
            badge: unread > 0 ? '$unread' : null,
            onTap: () => context.push('/notifications'),
          ),
          _MenuItem(
            icon: Icons.receipt_long,
            title: 'طلباتي',
            onTap: () => context.push('/orders'),
          ),
          _MenuItem(
            icon: Icons.favorite,
            title: 'المفضلة',
            onTap: () => context.push('/wishlist'),
          ),
          const Divider(),
          _MenuItem(
            icon: Icons.privacy_tip_outlined,
            title: 'سياسة الخصوصية',
            onTap: () => context.push('/privacy-policy'),
          ),
          _MenuItem(
            icon: Icons.logout,
            title: 'تسجيل الخروج',
            textColor: AppTheme.error,
            onTap: () async {
              await PushService.clearOnLogout();
              await auth.logout();
              if (!context.mounted) return;
              context.read<NotificationsProvider>().load(loggedIn: false);
              await context.read<CartProvider>().loadCart();
              if (context.mounted) context.go('/');
            },
          ),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? textColor;
  final String? badge;

  const _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.textColor,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: textColor ?? AppTheme.primary),
      title: Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.w500)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(12)),
              child: Text(badge!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          const Icon(Icons.arrow_forward_ios, size: 16),
        ],
      ),
      onTap: onTap,
    );
  }
}
