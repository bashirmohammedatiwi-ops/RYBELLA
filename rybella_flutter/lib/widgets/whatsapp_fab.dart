import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class WhatsAppFab extends StatelessWidget {
  final String? number;

  const WhatsAppFab({super.key, this.number});

  Future<void> _open() async {
    final raw = (number ?? '').replaceAll(RegExp(r'\D'), '');
    if (raw.isEmpty) return;
    final uri = Uri.parse('https://wa.me/$raw');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (number == null || number!.trim().isEmpty) return const SizedBox.shrink();
    return FloatingActionButton(
      onPressed: _open,
      backgroundColor: const Color(0xFF25D366),
      mini: true,
      child: const Icon(Icons.chat, color: Colors.white),
    );
  }
}
