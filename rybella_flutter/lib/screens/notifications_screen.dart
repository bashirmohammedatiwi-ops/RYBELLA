import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../providers/notifications_provider.dart';
import '../widgets/push_permission_prompt.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationsProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationsProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        actions: [
          if (provider.unreadCount > 0)
            TextButton(
              onPressed: () => provider.markAllRead(),
              child: const Text('تعليم الكل كمقروء'),
            ),
        ],
      ),
      body: provider.loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : provider.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('🔔', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 12),
                      Text('لا توجد إشعارات بعد', style: TextStyle(color: Colors.grey[600])),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: () => context.go('/explore'), child: const Text('تسوق الآن')),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.items.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    if (i == 0) return const PushPermissionPrompt();
                    final n = provider.items[i - 1];
                    final isUnread = (n['is_read'] ?? 0) == 0 && n['read_at'] == null;
                    final created = n['created_at']?.toString() ?? '';
                    String dateStr = created;
                    try {
                      dateStr = DateFormat('d MMM y', 'ar').format(DateTime.parse(created));
                    } catch (_) {}

                    return Material(
                      color: isUnread ? AppTheme.primarySoft : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: isUnread ? () => provider.markRead(n['id'] as int) : null,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isUnread ? AppTheme.primary.withValues(alpha: 0.3) : AppTheme.border,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      n['title']?.toString() ?? '',
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                    ),
                                  ),
                                  if (isUnread)
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(n['message']?.toString() ?? '', style: TextStyle(color: Colors.grey[700], height: 1.5)),
                              const SizedBox(height: 8),
                              Text(dateStr, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
