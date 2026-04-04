import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/wishlist_provider.dart';
import '../services/api_service.dart';
import '../widgets/product_card.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final wishlist = context.read<WishlistProvider>();
    await wishlist.loadWishlist();
    final ids = wishlist.ids;
    final list = <Product>[];
    for (final id in ids) {
      final p = await ApiService.getProduct(id);
      if (p != null) list.add(p);
    }
    setState(() {
      _products = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final wishlist = context.watch<WishlistProvider>();

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('المفضلة')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('سجلي الدخول لعرض المفضلة'),
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
      appBar: AppBar(title: const Text('المفضلة')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _products.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.favorite_border, size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      const Text('المفضلة فارغة'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.go('/explore'),
                        child: const Text('تسوقي الآن'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.65,
                    ),
                    itemCount: _products.length,
                    itemBuilder: (_, i) {
                      final p = _products[i];
                      return ProductCard(
                        product: p,
                        inWishlist: true,
                        onWishlistTap: () => wishlist.toggle(p.id),
                        onTap: () => context.push('/products/${p.id}'),
                      );
                    },
                  ),
                ),
    );
  }
}
