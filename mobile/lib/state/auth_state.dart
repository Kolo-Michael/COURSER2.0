import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/api_client.dart';
import '../core/config.dart';
import '../core/storage.dart';
import '../services/auth_service.dart';
import '../models/user.dart';

/// ─── Auth state ───
/// ChangeNotifier that owns the current session: token, user profile, session
/// expiry, and "remember me". Also handles auto-login on startup and enforces
/// an inactivity timeout — user interactions (fed in from `app.dart`'s
/// full-screen Listener) reset a countdown, and the session is dropped if the
/// user stays idle or backgrounds the app past the limit.
class AuthState extends ChangeNotifier {
  final ApiClient apiClient;
  final SecureStore storage;

  bool _isLoading = true;
  String? _token;
  User? _user;
  DateTime? _sessionExpiresAt;
  bool _rememberMe = false;

  // Inactivity tracking: idle timer + time spent backgrounded.
  Timer? _inactivityTimer;
  DateTime? _backgroundedAt;
  bool _appInactive = false;

  bool get isLoading => _isLoading;
  String? get token => _token;
  User? get user => _user;
  bool get isAuthenticated => _token != null && _user != null;

  /// UTC time when the refresh-token session expires. Null when unknown.
  DateTime? get sessionExpiresAt => _sessionExpiresAt;

  /// Whether the current session was created with "remember me".
  bool get rememberMe => _rememberMe;

  /// Days left before the user must re-authenticate.
  /// Returns null when there is no known expiry.
  int? get daysUntilReauth {
    final expiry = _sessionExpiresAt;
    if (expiry == null) return null;
    final diff = expiry.difference(DateTime.now().toUtc());
    return diff.inDays < 0 ? 0 : diff.inDays;
  }

  AuthState({required this.apiClient, required this.storage});

  /// Startup: restore "remember me", then attempt a silent login from storage.
  Future<void> init() async {
    _rememberMe = await storage.readRememberMe();
    final service = AuthService(apiClient: apiClient, storage: storage);
    final tokens = await service.tryAutoLogin();
    if (tokens != null) {
      _token = tokens.accessToken;
      _user = tokens.user;
      _sessionExpiresAt = tokens.sessionExpiresAt;
      apiClient.setToken(_token);
    }
    _isLoading = false;
    _resetInactivityTimer();
    notifyListeners();
  }

  /// Called on every user interaction (taps, scrolls, keystrokes). Resets the
  /// idle countdown; when the app stays idle past the timeout, the session is
  /// dropped so the user must authenticate again.
  void recordActivity() {
    if (_appInactive) return;
    _resetInactivityTimer();
  }

  /// The app moved to the background (true) or came back (false). Time spent
  /// in the background counts toward the inactivity timeout.
  void setAppBackground(bool isBackground) {
    _appInactive = isBackground;
    if (isBackground) {
      _inactivityTimer?.cancel();
      _backgroundedAt = DateTime.now();
    } else {
      final bgAt = _backgroundedAt;
      _backgroundedAt = null;
      // If the app was gone long enough, sign out on return.
      if (bgAt != null &&
          _token != null &&
          DateTime.now().difference(bgAt) >= Config.inactivityTimeout) {
        logout();
        return;
      }
      _resetInactivityTimer();
    }
  }

  void _resetInactivityTimer() {
    _inactivityTimer?.cancel();
    _inactivityTimer = Timer(Config.inactivityTimeout, _onInactivityTimeout);
  }

  void _onInactivityTimeout() {
    if (_token != null && _user != null) {
      logout();
    }
  }

  /// Authenticates, stores the tokens, and notifies the router.
  Future<void> login(String email, String password, {bool rememberMe = false}) async {
    final service = AuthService(apiClient: apiClient, storage: storage);
    final tokens = await service.login(email, password, rememberMe: rememberMe);
    _token = tokens.accessToken;
    _user = tokens.user;
    _sessionExpiresAt = tokens.sessionExpiresAt;
    _rememberMe = rememberMe;
    await storage.writeRememberMe(rememberMe);
    apiClient.setToken(_token);
    _resetInactivityTimer();
    notifyListeners();
  }

  /// Signs the user up, stores the auto-issued tokens, and notifies the router.
  Future<void> signup(
    String email,
    String firstName,
    String lastName,
    String password,
  ) async {
    final service = AuthService(apiClient: apiClient, storage: storage);
    final tokens = await service.signup(email, firstName, lastName, password);
    _token = tokens.accessToken;
    _user = tokens.user;
    _sessionExpiresAt = tokens.sessionExpiresAt;
    // Signups are never "remember me" sessions by default.
    _rememberMe = false;
    await storage.writeRememberMe(false);
    apiClient.setToken(_token);
    _resetInactivityTimer();
    notifyListeners();
  }

  /// Clears the session everywhere (in-memory + secure storage + API header).
  Future<void> logout() async {
    _inactivityTimer?.cancel();
    _token = null;
    _user = null;
    _sessionExpiresAt = null;
    _rememberMe = false;
    await storage.clear();
    apiClient.setToken(null);
    notifyListeners();
  }

  /// Re-fetches the user profile from the backend and updates the cached copy.
  Future<void> refreshUser() async {
    final data = await apiClient.fetchCurrentUser();
    _user = User.fromJson(data);
    notifyListeners();
  }

  @override
  void dispose() {
    _inactivityTimer?.cancel();
    super.dispose();
  }
}
