import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import '../models/brand.dart';
import '../services/api_service.dart';
import '../widgets/app_image.dart';

class BrandsScreen extends StatefulWidget {
  const BrandsScreen({super.key});

  @override
  State<BrandsScreen> createState() => _BrandsScreenState();
}

class _BrandsScreenState extends State<BrandsScreen> {
  List<Brand> _brands = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await ApiService.getBrands();
    setState(() {
      _brands = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('العلامات التجارية')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _brands.isEmpty
              ? const Center(child: Text('لا توجد علامات'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _brands.length,
                    itemBuilder: (_, i) {
                      final b = _brands[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: b.logo != null
                              ? AppImage(url: b.logo, width: 56, height: 56, fit: BoxFit.contain)
                              : const Icon(Icons.business, size: 40),
                          title: Text(b.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                          onTap: () => context.go('/explore?brand_id=${b.id}'),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
