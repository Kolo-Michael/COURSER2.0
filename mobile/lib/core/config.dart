import 'dart:io';

class Config {
  static const String appName = 'COURSER';

  // Production endpoint on Render.
  static const String _prodApiBaseUrl =
      'https://courser-api-18uo.onrender.com/api';

  // Local development endpoints.
  // - Android emulator: 10.0.2.2 maps to the host's localhost
  // - iOS simulator / host machine: 127.0.0.1
  // - Physical device: use your machine's LAN IP (e.g. 192.168.1.100)
  static const String _androidEmulatorLocal = 'http://10.0.2.2:8000/api';
  static const String _localhost = 'http://127.0.0.1:8000/api';

  static String get apiBaseUrl {
    const localOverride = String.fromEnvironment('COURSER_API_URL');
    if (localOverride.isNotEmpty) return localOverride;

    if (_isDevelopment) {
      // Android emulator can't reach 127.0.0.1 on the host
      return _isAndroid ? _androidEmulatorLocal : _localhost;
    }
    return _prodApiBaseUrl;
  }

  static bool get _isDevelopment {
    return !const bool.fromEnvironment('dart.vm.product');
  }

  static bool get _isAndroid => Platform.isAndroid;

  // Auto-logout after this long without any user interaction. While the
  // app is in the foreground and idle, the session is considered inactive
  // and the user is signed out back to the onboarding/login flow.
  static const Duration inactivityTimeout = Duration(minutes: 10);

  // Streak system limits (mirrors the backend defaults).
  static const int maxStreakRestoresPerMonth = 4;
}
