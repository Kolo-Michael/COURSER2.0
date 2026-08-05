import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Thin wrapper around `flutter_secure_storage` so the rest of the app can
/// store tokens without knowing the platform-specific options (Keychain vs
/// EncryptedSharedPreferences).
///
/// Stores the JWT access token, the refresh token, and the UTC expiry of
/// the session so the dashboard can show a "re-authenticate in N days"
/// countdown. Keeping JWTs here instead of `SharedPreferences` keeps them
/// out of plain text on the device.
class SecureStore {
  static const _options = AndroidOptions(
    encryptedSharedPreferences: true,
  );

  static const _storage = FlutterSecureStorage(aOptions: _options);

  static const _kAccessToken = 'access_token';
  static const _kRefreshToken = 'refresh_token';
  static const _kSessionExpiresAt = 'session_expires_at';
  static const _kRememberMe = 'remember_me';

  Future<String?> readAccessToken() => _storage.read(key: _kAccessToken);
  Future<String?> readRefreshToken() => _storage.read(key: _kRefreshToken);

  /// Persisted "remember me" choice so the dashboard countdown and the
  /// login screen remember the user's preference across launches.
  Future<bool> readRememberMe() async {
    final raw = await _storage.read(key: _kRememberMe);
    return raw != 'false';
  }

  Future<void> writeRememberMe(bool value) =>
      _storage.write(key: _kRememberMe, value: value ? 'true' : 'false');

  /// Returns the stored session expiry as UTC, or null if absent/invalid.
  Future<DateTime?> readSessionExpiresAt() async {
    final raw = await _storage.read(key: _kSessionExpiresAt);
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw)?.toUtc();
  }

  Future<void> writeTokens({
    required String accessToken,
    required String refreshToken,
    DateTime? sessionExpiresAt,
  }) async {
    await _storage.write(key: _kAccessToken, value: accessToken);
    if (refreshToken.isNotEmpty) {
      await _storage.write(key: _kRefreshToken, value: refreshToken);
    }
    if (sessionExpiresAt != null) {
      await _storage.write(
        key: _kSessionExpiresAt,
        value: sessionExpiresAt.toUtc().toIso8601String(),
      );
    }
  }

  Future<void> clear() async {
    await _storage.delete(key: _kAccessToken);
    await _storage.delete(key: _kRefreshToken);
    await _storage.delete(key: _kSessionExpiresAt);
  }
}
