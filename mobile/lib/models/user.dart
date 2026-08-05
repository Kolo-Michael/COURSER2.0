class User {
  final String id;
  final String email;
  final String username;
  final String firstName;
  final String lastName;
  final String fullName;
  final String role;
  final String? avatarUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.email,
    required this.username,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.role,
    this.avatarUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // The backend returns a single `full_name` field (no first/last split).
    final full = json['full_name']?.toString() ?? '';
    final parts = full.split(' ');
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      firstName: parts.isNotEmpty ? parts.first : '',
      lastName: parts.length > 1 ? parts.sublist(1).join(' ') : '',
      fullName: full,
      role: json['role']?.toString() ?? 'student',
      avatarUrl: json['avatar_url'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }

  String get displayName =>
      fullName.isNotEmpty ? fullName : '$firstName $lastName'.trim();

  bool get isAdmin => role == 'admin' || role == 'super_admin';

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'username': username,
        'full_name': fullName,
        'role': role,
        'avatar_url': avatarUrl,
      };
}

class AuthTokens {
  final String accessToken;
  final String? refreshToken;
  final User user;
  final DateTime? sessionExpiresAt;

  AuthTokens({
    required this.accessToken,
    this.refreshToken,
    required this.user,
    this.sessionExpiresAt,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['access_token']?.toString() ?? '',
      refreshToken: json['refresh_token']?.toString(),
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      sessionExpiresAt: json['session_expires_at'] != null
          ? DateTime.tryParse(json['session_expires_at'].toString())?.toUtc()
          : null,
    );
  }
}
