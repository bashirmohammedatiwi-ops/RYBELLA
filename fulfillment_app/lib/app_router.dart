import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_widgets.dart';
import 'screens/create_customer_screen.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'screens/order_detail_screen.dart';

class FulfillmentApp extends StatelessWidget {
  const FulfillmentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.loading) {
          return const Scaffold(
            backgroundColor: AppTheme.bg,
            body: LoadingOverlay(message: 'جاري التحميل...'),
          );
        }
        if (!auth.isLoggedIn) return const LoginScreen();
        return const HomeShell();
      },
    );
  }
}

Route<dynamic>? onGenerateRoute(RouteSettings settings) {
  final name = settings.name ?? '';
  if (name.startsWith('/order/')) {
    final id = int.tryParse(name.split('/').last);
    if (id != null) {
      return MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: id));
    }
  }
  if (name == '/create-customer') {
    return MaterialPageRoute(builder: (_) => const CreateCustomerScreen());
  }
  return null;
}
