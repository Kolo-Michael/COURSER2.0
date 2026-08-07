import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;

class Config {
  static const String appName = 'COURSER';

  // Production endpoint on Render.
  static const String _prodApiBaseUrl =
      'https://courser-api-18uo.onrender.com/api';

  // Local development endpoints.
  // - Android emulator: 10.0.2.2 maps to the host's localhost
  // - iOS simulator / host machine: 127.0.0.1
  // - Physical device (Android/iOS): your machine's LAN IP so the phone and
  //   the backend (uvicorn on 0.0.0.0:8000) can talk over Wi-Fi.
  //   Change this to match your machine's current IP, or override at build
  //   time with --dart-define=COURSER_API_URL=http://<ip>:8000/api
  static const String _androidEmulatorLocal = 'http://10.0.2.2:8000/api';
  static const String _localhost = 'http://127.0.0.1:8000/api';
  static const String _lanApiBaseUrl = 'http://192.168.1.192:8000/api';

  static String get apiBaseUrl {
    const localOverride = String.fromEnvironment('COURSER_API_URL');
    if (localOverride.isNotEmpty) return localOverride;

    if (_isDevelopment) {
      if (_isWeb) {
        return _localhost;
      }
      if (_isAndroid) {
        // Emulators can't reach 127.0.0.1 on the host; physical devices
        // must use the host's LAN IP over Wi-Fi.
        return _isAndroidEmulator ? _androidEmulatorLocal : _lanApiBaseUrl;
      }
      if (_isIOS) {
        return _isIOSSimulator ? _localhost : _lanApiBaseUrl;
      }
      return _localhost;
    }
    return _prodApiBaseUrl;
  }

  static bool get _isDevelopment {
    return !const bool.fromEnvironment('dart.vm.product');
  }

  static bool get _isWeb => kIsWeb;

  static bool get _isAndroid => !kIsWeb && Platform.isAndroid;

  static bool get _isIOS => !kIsWeb && Platform.isIOS;

  /// Android emulator detection. Most physical devices (including many Pixel
  /// phones) report a hostname of "localhost", while emulators report their
  /// AVD name (e.g. "emulator-5554", "sdk_gphone64_x86_64"). Rely on the
  /// AVD-name markers rather than "localhost" so a physical phone on Wi-Fi
  /// gets the LAN IP. Can be overridden with
  /// --dart-define=COURSER_EMULATOR=true/false.
  static bool get _isAndroidEmulator {
    if (_isWeb) return false;
    const forced = String.fromEnvironment('COURSER_EMULATOR');
    if (forced.isNotEmpty) return forced == 'true';
    final host = Platform.localHostname.toLowerCase();
    return host.contains('emulator') ||
        host.contains('qemu') ||
        host.contains('sdk_gphone');
  }

  static bool get _isIOSSimulator {
    if (_isWeb) return false;
    const forced = String.fromEnvironment('COURSER_SIMULATOR');
    if (forced.isNotEmpty) return forced == 'true';
    return Platform.localHostname.toLowerCase() == 'localhost';
  }

  // Auto-logout after this long without any user interaction. While the
  // app is in the foreground and idle, the session is considered inactive
  // and the user is signed out back to the onboarding/login flow.
  static const Duration inactivityTimeout = Duration(minutes: 10);

  // Streak system limits (mirrors the backend defaults).
  static const int maxStreakRestoresPerMonth = 4;
}
