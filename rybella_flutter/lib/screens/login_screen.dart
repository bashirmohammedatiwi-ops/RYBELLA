import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final ok = await context.read<AuthProvider>().login(
          _emailController.text.trim(),
          _passwordController.text.trim(),
        );
    setState(() => _loading = false);
    if (ok && mounted) {
      context.go('/');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('البريد أو كلمة المرور غير صحيحة')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('تسجيل الدخول', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700)),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFFBFB), Color(0xFFFDF8F9)],
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'البريد الإلكتروني'),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => v?.trim().isEmpty ?? true ? 'مطلوب' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'كلمة المرور',
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                obscureText: _obscure,
                validator: (v) => v?.trim().isEmpty ?? true ? 'مطلوب' : null,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _loading ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('دخول'),
                ),
                const SizedBox(height: 16),
                TextButton(
                onPressed: () => context.push('/register'),
                child: const Text('إنشاء حساب جديد', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
