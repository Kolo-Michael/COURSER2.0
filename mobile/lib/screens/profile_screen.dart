import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';

/// Stand-alone profile screen (not wired into the current router — the
/// profile lives in `HomeScreen`'s profile tab). Shows the account summary and
/// action tiles, including logout which clears the session and returns to
/// `/login`.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const CircleAvatar(radius: 50, backgroundColor: AppTheme.primary),
                  const SizedBox(height: 12),
                  Text(
                    user.displayName,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  Text(user.email, style: TextStyle(color: Colors.grey[600])),
                  const SizedBox(height: 8),
                  Chip(label: Text('Role: ${user.role}', style: const TextStyle(color: Colors.white)),
                     backgroundColor: AppTheme.primary),
                  const SizedBox(height: 24),
                  ListTile(
                    leading: const Icon(Icons.settings),
                    title: const Text('Settings'),
                    onTap: () {},
                  ),
                  ListTile(
                    leading: const Icon(Icons.help),
                    title: const Text('Help & Support'),
                    onTap: () {},
                  ),
                  ListTile(
                    leading: const Icon(Icons.logout, color: Colors.red),
                    title: const Text('Logout', style: TextStyle(color: Colors.red)),
                    onTap: () async {
                      await auth.logout();
                      if (context.mounted) context.go('/login');
                    },
                  ),
                ],
              ),
            ),
    );
  }
}
