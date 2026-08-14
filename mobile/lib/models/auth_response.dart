import 'user.dart';

/// Mirrors `TokenResponse` from `backend/app/schemas/auth.py` — the JSON
/// body returned by `/auth/signup`, `/auth/login`, and `/auth/refresh`.
/// Parsed immediately after login/signup to seed the AuthState provider.
class AuthResponse {
  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  /// Parses the auth endpoint's flat JSON body into typed fields.
  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        accessToken: json['access_token'] as String,
        refreshToken: json['refresh_token'] as String,
        user: User.fromJson(json['user'] as Map<String, dynamic>),
      );

  final String accessToken;
  final String refreshToken;
  final User user;
}