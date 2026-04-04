import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();
  final _couponController = TextEditingController();
  String _paymentMethod = 'cash';
  List<Map<String, dynamic>> _zones = [];
  String? _selectedCity;
  double _deliveryFee = 0;
  double _discount = 0;
  String? _couponMsg;
  bool _loading = false;
  bool _zonesLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadZones();
  }

  Future<void> _loadZones() async {
    _zones = await ApiService.getDeliveryZones();
    setState(() => _zonesLoaded = true);
  }

  @override
  void dispose() {
    _addressController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final cart = context.read<CartProvider>();
    final res = await ApiService.applyCoupon(_couponController.text.trim(), cart.totalPrice);
    setState(() {
      if (res.success && res.data != null) {
        final d = res.data as Map<String, dynamic>;
        _discount = (d['discount'] as num?)?.toDouble() ?? 0;
        _couponMsg = 'تم تطبيق الكوبون';
      } else {
        _couponMsg = res.error ?? 'كوبون غير صالح';
      }
    });
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;
    final cart = context.read<CartProvider>();
    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('السلة فارغة')));
      return;
    }

    setState(() => _loading = true);
    final res = await ApiService.createOrder({
      'address': _addressController.text.trim(),
      'city': _cityController.text.trim(),
      'phone': _phoneController.text.trim(),
      'notes': _notesController.text.trim(),
      'payment_method': _paymentMethod,
      if (_couponController.text.trim().isNotEmpty) 'coupon_code': _couponController.text.trim(),
      'items': cart.items.map((i) => {
        'variant_id': i['variant_id'],
        'quantity': i['quantity'],
      }).toList(),
    });
    setState(() => _loading = false);

    if (res.success && res.data != null) {
      final d = res.data as Map<String, dynamic>;
      final id = d['id'] ?? d['order_id'];
      cart.loadCart();
      if (context.mounted) {
        context.go('/orders/$id');
      }
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res.error ?? 'حدث خطأ')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final subtotal = cart.totalPrice;
    final total = subtotal + _deliveryFee - _discount;

    return Scaffold(
      appBar: AppBar(title: const Text('إتمام الطلب')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(labelText: 'العنوان *'),
              validator: (v) => v?.trim().isEmpty ?? true ? 'مطلوب' : null,
            ),
            const SizedBox(height: 12),
            if (_zonesLoaded)
              DropdownButtonFormField<String>(
                value: _selectedCity,
                decoration: const InputDecoration(labelText: 'المدينة *'),
                items: _zones.map((z) => DropdownMenuItem(value: z['city'] as String, child: Text(z['city'] as String))).toList(),
                onChanged: (v) {
                  setState(() {
                    _selectedCity = v;
                    _cityController.text = v ?? '';
                    final z = _zones.firstWhere((x) => x['city'] == v, orElse: () => {});
                    _deliveryFee = (z['delivery_fee'] as num?)?.toDouble() ?? 0;
                  });
                },
                validator: (v) => v == null ? 'مطلوب' : null,
              )
            else
              TextFormField(
                controller: _cityController,
                decoration: const InputDecoration(labelText: 'المدينة *'),
                validator: (v) => v?.trim().isEmpty ?? true ? 'مطلوب' : null,
              ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'الهاتف'),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(labelText: 'ملاحظات'),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _couponController,
                    decoration: const InputDecoration(labelText: 'كود الخصم'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _applyCoupon,
                  child: const Text('تطبيق'),
                ),
              ],
            ),
            if (_couponMsg != null) Text(_couponMsg!, style: TextStyle(color: _discount > 0 ? AppTheme.success : AppTheme.error)),
            const SizedBox(height: 16),
            const Text('طريقة الدفع', style: TextStyle(fontWeight: FontWeight.w600)),
            RadioListTile<String>(
              title: const Text('الدفع عند الاستلام'),
              value: 'cash',
              groupValue: _paymentMethod,
              onChanged: (v) => setState(() => _paymentMethod = v!),
            ),
            RadioListTile<String>(
              title: const Text('تحويل بنكي'),
              value: 'transfer',
              groupValue: _paymentMethod,
              onChanged: (v) => setState(() => _paymentMethod = v!),
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _row('المجموع', subtotal),
                    _row('التوصيل', _deliveryFee),
                    if (_discount > 0) _row('الخصم', -_discount),
                    const Divider(),
                    _row('الإجمالي', total, bold: true),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _placeOrder,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _loading ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text('تأكيد الطلب (${total.toStringAsFixed(0)} د.ع)'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, double value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: bold ? FontWeight.w700 : null)),
          Text('${value.toStringAsFixed(0)} د.ع', style: TextStyle(fontWeight: bold ? FontWeight.w700 : null, color: bold ? AppTheme.primary : null)),
        ],
      ),
    );
  }
}
