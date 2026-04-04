import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await ApiService.getOrders();
    setState(() {
      _orders = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('طلباتي')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _orders.isEmpty
              ? const Center(child: Text('لا توجد طلبات'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (_, i) {
                      final o = _orders[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text('#${o.id}'),
                          subtitle: Text('${o.finalPrice.toStringAsFixed(0)} د.ع - ${o.statusAr}'),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                          onTap: () => context.push('/orders/${o.id}'),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
