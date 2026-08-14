import 'package:flutter/foundation.dart';
import '../core/api_client.dart';
import '../services/course_service.dart';
import '../models/course.dart';

/// ─── Courses state ───
/// ChangeNotifier holding the course catalog for the home/catalog screens and
/// delegating to `CourseService` for the network fetches. Exposes loading and
/// error flags so screens can render spinners, error text, or data.
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

  /// Reloads the catalog, notifying listeners through loading/error states.
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

  /// Fetches a single course (with modules) for the detail screen.
  Future<Course> fetchCourseDetail(String id) {
    return _service.fetchCourseById(id);
  }

  /// Enrolls in a course and swaps the in-place catalog entry so the UI
  /// reflects the enrollment; returns the updated course.
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
