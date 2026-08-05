import '../core/api_client.dart';
import '../core/storage.dart';
import '../models/user.dart';

class AuthService {
  final ApiClient apiClient;
  final SecureStore storage;

  AuthService({required this.apiClient, required this.storage});

  /// Attempts to restore a session from secure storage.
  ///
  /// 1. If a stored access token validates against /auth/me, use it.
  /// 2. If not, try to rotate the stored refresh token into a fresh pair.
  /// 3. Returns null only when there is nothing usable stored.
  Future<AuthTokens?> tryAutoLogin() async {
    final access = await storage.readAccessToken();
    final refresh = await storage.readRefreshToken();

    if (access != null && access.isNotEmpty) {
      apiClient.setToken(access);
      try {
        final userData = await apiClient.fetchCurrentUser();
        return AuthTokens(
          accessToken: access,
          refreshToken: refresh,
          user: User.fromJson(userData),
          sessionExpiresAt: await storage.readSessionExpiresAt(),
        );
      } catch (_) {
        // Access token expired/invalid — fall through to refresh below.
      }
    }

    if (refresh != null && refresh.isNotEmpty) {
      final refreshed = await _refresh(refresh);
      if (refreshed != null) return refreshed;
    }

    return null;
  }

  Future<AuthTokens> login(
    String email,
    String password, {
    bool rememberMe = false,
  }) async {
    final data = await apiClient.login(email, password, rememberMe: rememberMe);
    final tokens = AuthTokens.fromJson(data);
    if (tokens.accessToken.isEmpty) {
      throw Exception('Login response did not include a token.');
    }
    await storage.writeTokens(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? '',
      sessionExpiresAt: tokens.sessionExpiresAt,
    );
    apiClient.setToken(tokens.accessToken);
    return tokens;
  }

  Future<AuthTokens> signup(
    String email,
    String firstName,
    String lastName,
    String password,
  ) async {
    final username = _usernameFromEmail(email);
    final fullName = '$firstName $lastName'.trim();
    final data = await apiClient.signup(email, username, fullName, password);
    final tokens = AuthTokens.fromJson(data);
    if (tokens.accessToken.isEmpty) {
      throw Exception('Signup response did not include a token.');
    }
    await storage.writeTokens(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? '',
      sessionExpiresAt: tokens.sessionExpiresAt,
    );
    apiClient.setToken(tokens.accessToken);
    return tokens;
  }

  /// Rotate the refresh token into a fresh access/refresh pair and persist it.
  Future<AuthTokens?> _refresh(String refreshToken) async {
    try {
      final data = await apiClient.refreshToken(refreshToken);
      final tokens = AuthTokens.fromJson(data);
      if (tokens.accessToken.isEmpty) return null;
      await storage.writeTokens(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? refreshToken,
        sessionExpiresAt: tokens.sessionExpiresAt,
      );
      apiClient.setToken(tokens.accessToken);
      return tokens;
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    await storage.clear();
    apiClient.setToken(null);
  }

  /// Derive a stable, schema-valid username from an email address
  /// (backend requires 3–50 chars).
  String _usernameFromEmail(String email) {
    final local = email.split('@').first;
    // Strip anything that isn't a letter/number/dot/underscore.
    final cleaned = local.replaceAll(RegExp(r'[^a-zA-Z0-9._]'), '');
    final base = cleaned.isEmpty ? 'user' : cleaned;
    return base.length > 50 ? base.substring(0, 50) : base;
  }
}
