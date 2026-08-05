import 'package:flutter/foundation.dart';
import '../core/api_client.dart';
import '../services/course_service.dart';
import '../models/course.dart';

class CoursesState extends ChangeNotifier {
  final ApiClient apiClient;
  late final CourseService _service;

  List<Course> _courses = [];
  bool _isLoading = false;
  String? _error;

  List<Course> get courses => _courses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  CoursesState({required this.apiClient}) {
    _service = CourseService(apiClient);
  }

  Future<void> fetchCourses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _courses = await _service.fetchCourses();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<Course> fetchCourseDetail(String id) {
    return _service.fetchCourseById(id);
  }

  Future<Course> enrollInCourse(String slug) async {
    final course = await _service.enrollInCourse(slug);
    final idx = _courses.indexWhere((c) => c.id == course.id);
    if (idx != -1) {
      _courses[idx] = course;
      notifyListeners();
    }
    return course;
  }
}
