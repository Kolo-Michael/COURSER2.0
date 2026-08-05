import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

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
    _dio.interceptors.add(LogInterceptor(
      requestBody: kDebugMode,
      responseBody: kDebugMode,
    ));
  }

  void setToken(String? token) {
    _token = token;
    _dio.options.headers[HttpHeaders.authorizationHeader] =
        token != null ? 'Bearer $token' : null;
  }

  String? get token => _token;

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

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final res = await _dio.post('/auth/refresh', data: {
      'refresh_token': refreshToken,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchCurrentUser() async {
    final res = await _dio.get('/auth/me');
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> fetchCourses() async {
    final res = await _dio.get('/courses');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> fetchCourseById(String id) async {
    final res = await _dio.get('/courses/$id');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> enrollInCourse(String slug) async {
    final res = await _dio.post('/courses/slug/$slug/enroll');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> askQuestion(String courseId, String question) async {
    final res = await _dio.post('/courses/$courseId/ask', data: {'question': question});
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> completeLesson(String lessonId) async {
    final res = await _dio.post('/lessons/$lessonId/complete');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchLesson(String lessonId) async {
    final res = await _dio.get('/lessons/$lessonId');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProgress(
      String lessonId, double progress, double? quizScore) async {
    final res = await _dio.patch(
      '/lessons/$lessonId/progress',
      data: {
        'progress': progress,
        if (quizScore != null) 'quiz_score': quizScore,
      },
    );
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchStreak() async {
    final res = await _dio.get('/streak');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> restoreStreak() async {
    final res = await _dio.post('/streak/restore');
    return res.data as Map<String, dynamic>;
  }
}
