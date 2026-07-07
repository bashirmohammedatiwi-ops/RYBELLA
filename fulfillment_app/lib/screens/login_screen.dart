import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../services/push_service.dart';
import '../widgets/app_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscure = true;
  String? _localError;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _localError = null);
    final ok = await context.read<AuthProvider>().login(_phoneCtrl.text, _passCtrl.text);
    if (!mounted) return;
    if (!ok) {
      setState(() => _localError = context.read<AuthProvider>().error ?? 'فشل الدخول');
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      body: AppBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  children: [
                    _buildHero().animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, end: 0),
                    const SizedBox(height: 32),
                    SoftCard(
                      shadows: const [AppTheme.cardShadow],
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primarySoft,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Icon(Icons.login_rounded, color: AppTheme.primary, size: 24),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('تسجيل الدخول', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                                      Text('للموظفين المصرّح لهم فقط', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            if (_localError != null) ...[
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppTheme.dangerSoft,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppTheme.danger.withValues(alpha: 0.25)),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(color: AppTheme.danger.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                                      child: const Icon(Icons.error_outline_rounded, color: AppTheme.danger, size: 20),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(child: Text(_localError!, style: const TextStyle(color: AppTheme.danger, fontWeight: FontWeight.w700))),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 18),
                            ],
                            TextFormField(
                              controller: _phoneCtrl,
                              keyboardType: TextInputType.phone,
                              textDirection: TextDirection.ltr,
                              textAlign: TextAlign.left,
                              decoration: const InputDecoration(
                                labelText: 'رقم الهاتف',
                                prefixIcon: Icon(Icons.phone_rounded),
                                hintText: '07xxxxxxxxx',
                              ),
                              validator: (v) => (v == null || v.trim().length < 10) ? 'أدخل رقم هاتف صالح' : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _passCtrl,
                              obscureText: _obscure,
                              decoration: InputDecoration(
                                labelText: 'كلمة المرور',
                                prefixIcon: const Icon(Icons.lock_rounded),
                                suffixIcon: IconButton(
                                  onPressed: () => setState(() => _obscure = !_obscure),
                                  icon: Icon(_obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded),
                                ),
                              ),
                              validator: (v) => (v == null || v.isEmpty) ? 'كلمة المرور مطلوبة' : null,
                            ),
                            const SizedBox(height: 28),
                            FilledButton(
                              onPressed: loading ? null : _submit,
                              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                              child: loading
                                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('دخول'),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: loading ? null : () => PushService.requestAndSubscribe(),
                              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                              icon: const Icon(Icons.notifications_active_outlined, size: 20),
                              label: const Text('تفعيل الإشعارات'),
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 120.ms, duration: 400.ms).slideY(begin: 0.05, end: 0),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Column(
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.4), blurRadius: 24, offset: const Offset(0, 10))],
          ),
          child: const Icon(Icons.inventory_2_rounded, color: Colors.white, size: 46),
        ),
        const SizedBox(height: 20),
        ShaderMask(
          shaderCallback: (bounds) => AppTheme.primaryGradient.createShader(bounds),
          child: const Text(
            'Rybella Fulfillment',
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.primarySoft,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: AppTheme.border),
          ),
          child: const Text(
            'مركز تجهيز الطلبات',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 14, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
