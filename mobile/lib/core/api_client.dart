import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// ─── HTTP client ───
/// Thin wrapper around `Dio` for all backend calls. Holds the current access
/// token in memory and injects it as a `Bearer` header on every request. All
/// paths are relative to `baseUrl` (see `Config.apiBaseUrl`).
class ApiClient {
  final Dio _dio;
  final String baseUrl;
  String? _token;

  ApiClient({required this.baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
        )) {
    // Log request/response bodies only when assertions (debug mode) are on,
    // so production builds don't print sensitive payloads.
    _dio.interceptors.add(LogInterceptor(
      requestBody: kDebugMode,
      responseBody: kDebugMode,
    ));
  }

  /// Updates the in-memory token and the `Authorization` header used by every
  /// outgoing request. Passing null clears the header (sign-out).
  void setToken(String? token) {
    _token = token;
    _dio.options.headers[HttpHeaders.authorizationHeader] =
        token != null ? 'Bearer $token' : null;
  }

  String? get token => _token;

  /// POST /auth/login — authenticates and returns the token response body.
  Future<Map<String, dynamic>> login(
    String email,
    String password, {
    bool rememberMe = false,
  }) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
      'remember_me': rememberMe,
    });
    return res.data as Map<String, dynamic>;
  }

  /// POST /auth/signup — creates an account and returns the token body,
  /// automatically signing the new user in.
  Future<Map<String, dynamic>> signup(
      String email, String username, String fullName, String password) async {
    final res = await _dio.post('/auth/signup', data: {
      'email': email,
      'username': username,
      'full_name': fullName,
      'password': password,
    });
    return res.data as Map<String, dynamic>;
  }

  /// POST /auth/refresh — rotates the refresh token into a fresh pair.
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final res = await _dio.post('/auth/refresh', data: {
      'refresh_token': refreshToken,
    });
    return res.data as Map<String, dynamic>;
  }

  /// GET /auth/me — returns the currently authenticated user's profile.
  Future<Map<String, dynamic>> fetchCurrentUser() async {
    final res = await _dio.get('/auth/me');
    return res.data as Map<String, dynamic>;
  }

  /// GET /courses — returns the full course catalog (list of course objects).
  Future<List<dynamic>> fetchCourses() async {
    final res = await _dio.get('/courses');
    return res.data as List<dynamic>;
  }

  /// GET /courses/:id — returns a single course including its modules/lessons.
  Future<Map<String, dynamic>> fetchCourseById(String id) async {
    final res = await _dio.get('/courses/$id');
    return res.data as Map<String, dynamic>;
  }

  /// POST /courses/slug/:slug/enroll — enrolls the current user in a course.
  Future<Map<String, dynamic>> enrollInCourse(String slug) async {
    final res = await _dio.post('/courses/slug/$slug/enroll');
    return res.data as Map<String, dynamic>;
  }

  /// POST /courses/:id/ask — asks the Cora AI tutor a question about a course.
  Future<Map<String, dynamic>> askQuestion(String courseId, String question) async {
    final res = await _dio.post('/courses/$courseId/ask', data: {'question': question});
    return res.data as Map<String, dynamic>;
  }

  /// POST /lessons/:id/complete — marks a lesson complete (100% progress).
  Future<Map<String, dynamic>> completeLesson(String lessonId) async {
    final res = await _dio.post('/lessons/$lessonId/complete');
    return res.data as Map<String, dynamic>;
  }

  /// GET /lessons/:id — fetches a single lesson with its content/notes.
  Future<Map<String, dynamic>> fetchLesson(String lessonId) async {
    final res = await _dio.get('/lessons/$lessonId');
    return res.data as Map<String, dynamic>;
  }

  /// PATCH /lessons/:id/progress — persists per-lesson progress (0–100) and
  /// an optional quiz score for the current user.
  Future<Map<String, dynamic>> updateProgress(
      String lessonId, double progress, double? quizScore) async {
    final res = await _dio.patch(
      '/lessons/$lessonId/progress',
      data: {
        'progress': progress,
        // Only include the quiz score when the caller provides one.
        if (quizScore != null) 'quiz_score': quizScore,
      },
    );
    return res.data as Map<String, dynamic>;
  }

  /// GET /streak — returns the user's current learning-streak snapshot.
  Future<Map<String, dynamic>> fetchStreak() async {
    final res = await _dio.get('/streak');
    return res.data as Map<String, dynamic>;
  }

  /// POST /streak/restore — spends one monthly restore on the missed day.
  Future<Map<String, dynamic>> restoreStreak() async {
    final res = await _dio.post('/streak/restore');
    return res.data as Map<String, dynamic>;
  }
}
