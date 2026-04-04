import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/app_image.dart';
import '../widgets/free_shipping_bar.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.read<AuthProvider>().isLoggedIn) {
        context.read<CartProvider>().loadCart();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('السلة')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('سجلي الدخول لعرض السلة'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.push('/login'),
                child: const Text('تسجيل الدخول'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('السلة', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700)),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFFBFB), Color(0xFFFDF8F9)],
          ),
        ),
        child: cart.loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : cart.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      const Text('السلة فارغة'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.go('/explore'),
                        child: const Text('تسوقي الآن'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: cart.loadCart,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cart.items.length + 2,
                    itemBuilder: (_, i) {
                      if (i == 0) {
                        return FreeShippingBar(subtotal: cart.totalPrice);
                      }
                      if (i == cart.items.length + 1) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('الإجمالي', style: TextStyle(fontWeight: FontWeight.w600)),
                                  Text(
                                    '${cart.totalPrice.toStringAsFixed(0)} د.ع',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }
                      final item = cart.items[i - 1];
                      final img = item['variant_image'] ?? item['product_image'];
                      final name = item['product_name'] ?? '';
                      final shade = item['shade_name'] ?? '';
                      final price = (item['price'] as num?)?.toDouble() ?? 0;
                      final qty = item['quantity'] as int? ?? 1;
                      final itemId = item['id'] as int? ?? 0;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: AppImage(
                                  url: img,
                                  width: 80,
                                  height: 80,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                    if (shade.isNotEmpty) Text(shade, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                                    Text('${(price * qty).toStringAsFixed(0)} د.ع', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    onPressed: () => cart.updateItem(itemId, qty - 1),
                                    icon: const Icon(Icons.remove_circle_outline),
                                  ),
                                  Text('$qty'),
                                  IconButton(
                                    onPressed: () => cart.updateItem(itemId, qty + 1),
                                    icon: const Icon(Icons.add_circle_outline),
                                  ),
                                  IconButton(
                                    onPressed: () => cart.removeItem(itemId),
                                    icon: const Icon(Icons.delete_outline, color: AppTheme.error),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      bottomNavigationBar: auth.isLoggedIn && cart.items.isNotEmpty
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton(
                  onPressed: () => context.push('/checkout'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text('إتمام الطلب (${cart.totalPrice.toStringAsFixed(0)} د.ع)'),
                ),
              ),
            )
          : null,
    );
  }
}
