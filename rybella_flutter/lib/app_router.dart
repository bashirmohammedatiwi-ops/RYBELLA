import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'screens/explore_screen.dart';
import 'screens/product_detail_screen.dart';
import 'screens/offer_detail_screen.dart';
import 'screens/offers_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/order_detail_screen.dart';
import 'screens/wishlist_screen.dart';
import 'screens/categories_screen.dart';
import 'screens/subcategories_screen.dart';
import 'screens/brands_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'widgets/app_layout.dart';
import 'widgets/animated_bottom_nav.dart';

final _rootKey = GlobalKey<NavigatorState>();

CustomTransitionPage _slidePage(GoRouterState state, Widget child) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      const begin = Offset(0.05, 0);
      const end = Offset.zero;
      const curve = Curves.easeOutCubic;
      var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      return SlideTransition(
        position: animation.drive(tween),
        child: FadeTransition(
          opacity: animation,
          child: child,
        ),
      );
    },
  );
}

GoRouter createAppRouter() {
  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',
    routes: [
      ShellRoute(
        builder: (context, state, child) => _MainShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (_, state) => _slidePage(state, const HomeScreen()),
          ),
          GoRoute(
            path: '/explore',
            pageBuilder: (_, state) {
              final q = state.uri.queryParameters;
              int? catId, subId, brandId;
              double? minP, maxP;
              // دعم category= و subcategory= و brand= مثل الويب
              catId ??= int.tryParse(q['category'] ?? q['category_id'] ?? '');
              subId ??= int.tryParse(q['subcategory'] ?? q['subcategory_id'] ?? '');
              brandId ??= int.tryParse(q['brand'] ?? q['brand_id'] ?? '');
              if (q['min_price'] != null) minP = double.tryParse(q['min_price']!);
              if (q['max_price'] != null) maxP = double.tryParse(q['max_price']!);
              return _slidePage(
                state,
                ExploreScreen(
                  categoryId: catId,
                  subcategoryId: subId,
                  brandId: brandId,
                  search: q['search'],
                  tag: q['tag'],
                  colorCode: q['color'],
                  minPrice: minP,
                  maxPrice: maxP,
                  featured: q['featured'] == '1',
                  sortBy: q['sort_by'] ?? q['sort'],
                ),
              );
            },
          ),
          GoRoute(
            path: '/categories',
            pageBuilder: (_, state) => _slidePage(state, const CategoriesScreen()),
          ),
          GoRoute(
            path: '/subcategories',
            pageBuilder: (_, state) => _slidePage(state, const SubcategoriesScreen()),
          ),
          GoRoute(
            path: '/brands',
            pageBuilder: (_, state) => _slidePage(state, const BrandsScreen()),
          ),
          GoRoute(
            path: '/offers',
            pageBuilder: (_, state) => _slidePage(state, const OffersScreen()),
          ),
          GoRoute(
            path: '/cart',
            pageBuilder: (_, state) => _slidePage(state, const CartScreen()),
          ),
          GoRoute(
            path: '/wishlist',
            pageBuilder: (_, state) => _slidePage(state, const WishlistScreen()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (_, state) => _slidePage(state, const ProfileScreen()),
          ),
          GoRoute(
            path: '/orders',
            pageBuilder: (_, state) => _slidePage(state, const OrdersScreen()),
          ),
          GoRoute(
            path: '/orders/:id',
            pageBuilder: (_, state) {
              final id = int.tryParse(state.pathParameters['id'] ?? '0') ?? 0;
              return _slidePage(state, OrderDetailScreen(orderId: id));
            },
          ),
        ],
      ),
      GoRoute(
        path: '/products/:id',
        pageBuilder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '0') ?? 0;
          return MaterialPage(child: ProductDetailScreen(productId: id));
        },
      ),
      GoRoute(
        path: '/offers/:id',
        pageBuilder: (_, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '0') ?? 0;
          return MaterialPage(child: OfferDetailScreen(offerId: id));
        },
      ),
      GoRoute(
        path: '/checkout',
        pageBuilder: (_, __) => const MaterialPage(child: CheckoutScreen()),
      ),
      GoRoute(
        path: '/login',
        pageBuilder: (_, __) => const MaterialPage(child: LoginScreen()),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (_, __) => const MaterialPage(child: RegisterScreen()),
      ),
    ],
    redirect: (context, state) {
      final auth = context.read<AuthProvider>();
      final path = state.matchedLocation;
      final needsAuth = path == '/checkout' || path.startsWith('/orders');
      if (needsAuth && !auth.isLoggedIn) {
        return '/login?from=$path';
      }
      return null;
    },
  );
}

class _MainShell extends StatelessWidget {
  final Widget child;

  const _MainShell({required this.child});

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).matchedLocation;
    // إخفاء الشريط في تفاصيل الطلب فقط (/orders/:id) وليس في قائمة طلباتي (/orders أو /orders/)
    final isOrderDetail =
        path.startsWith('/orders/') && path.length > '/orders/'.length;
    final hideNav = path.startsWith('/products') ||
        path.startsWith('/offers/') ||
        path.startsWith('/checkout') ||
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        isOrderDetail;

    return Scaffold(
      extendBody: true,
      body: AppLayout(
        showBottomNav: !hideNav,
        child: child,
      ),
      bottomNavigationBar: hideNav
          ? null
          : Container(
              color: Colors.transparent,
              padding: const EdgeInsets.only(bottom: 8),
              child: _bottomNav(context),
            ),
    );
  }

  Widget _bottomNav(BuildContext context) {
    final path = GoRouterState.of(context).matchedLocation;
    final auth = context.read<AuthProvider>();
    final cartCount = context.watch<CartProvider>().totalCount;

    return AnimatedBottomNav(
      currentPath: path,
      cartCount: cartCount,
      isLoggedIn: auth.isLoggedIn,
      onNavigate: (route) => context.go(route),
    );
  }
}
