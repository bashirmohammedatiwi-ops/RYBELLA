import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final o = await ApiService.getOrder(widget.orderId);
    setState(() {
      _order = o;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }
    if (_order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('الطلب غير موجود')),
      );
    }

    final o = _order!;
    return Scaffold(
      appBar: AppBar(title: Text('طلب #${o.id}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('الحالة: ${o.statusAr}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('العنوان: ${o.address}'),
                  Text('المدينة: ${o.city}'),
                  if (o.phone != null) Text('الهاتف: ${o.phone}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('العناصر', style: TextStyle(fontWeight: FontWeight.w600)),
          ...o.items.map((i) => ListTile(
                title: Text(i.productName ?? 'منتج'),
                subtitle: Text('${i.quantity} x ${i.price.toStringAsFixed(0)} د.ع'),
                trailing: Text('${i.subtotal.toStringAsFixed(0)} د.ع'),
              )),
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('الإجمالي'),
              Text('${o.finalPrice.toStringAsFixed(0)} د.ع', style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.primary)),
            ],
          ),
        ],
      ),
    );
  }
}
