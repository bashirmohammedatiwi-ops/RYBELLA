import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../utils/phone.dart';
import '../widgets/app_widgets.dart';

class CreateCustomerScreen extends StatefulWidget {
  const CreateCustomerScreen({super.key});

  @override
  State<CreateCustomerScreen> createState() => _CreateCustomerScreenState();
}

class _CreateCustomerScreenState extends State<CreateCustomerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });

    final res = await ApiService.createCustomer(
      name: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      password: _passCtrl.text,
    );

    if (!mounted) return;
    setState(() => _loading = false);

    if (res.success) {
      setState(() {
        _success = res.data is Map
            ? (res.data as Map)['message']?.toString() ?? 'تم إنشاء حساب العميل'
            : 'تم إنشاء حساب العميل';
        _nameCtrl.clear();
        _phoneCtrl.clear();
        _passCtrl.clear();
      });
    } else {
      setState(() => _error = res.error ?? 'فشل إنشاء الحساب');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('إنشاء حساب عميل'),
        backgroundColor: Colors.transparent,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
      ),
      body: AppBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: SoftCard(
              shadows: const [AppTheme.cardShadow],
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: AppTheme.primaryGradient,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.person_add_rounded, color: Colors.white, size: 26),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('حساب عميل جديد', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                              Text('للعملاء الذين يتصلون أو يزورون المتجر', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    if (_error != null) _banner(_error!, AppTheme.danger, AppTheme.dangerSoft, Icons.error_outline_rounded),
                    if (_success != null) _banner(_success!, AppTheme.success, AppTheme.successSoft, Icons.check_circle_rounded),
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(labelText: 'اسم العميل', prefixIcon: Icon(Icons.person_outline_rounded)),
                      textInputAction: TextInputAction.next,
                      validator: (v) => v == null || v.trim().isEmpty ? 'الاسم مطلوب' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'رقم الهاتف', hintText: '07xxxxxxxxx', prefixIcon: Icon(Icons.phone_rounded)),
                      textInputAction: TextInputAction.next,
                      validator: (v) {
                        final n = normalizeIraqiPhone(v ?? '');
                        if (!isValidIraqiPhone(n)) return 'رقم عراقي صالح (07...)';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'كلمة المرور',
                        prefixIcon: const Icon(Icons.lock_rounded),
                        suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (v) => v == null || v.length < 6 ? '6 أحرف على الأقل' : null,
                    ),
                    const SizedBox(height: 28),
                    FilledButton(
                      onPressed: _loading ? null : _submit,
                      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                      child: _loading
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('إنشاء الحساب'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _banner(String text, Color color, Color bg, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 10),
            Expanded(child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w700))),
          ],
        ),
      ),
    );
  }
}
