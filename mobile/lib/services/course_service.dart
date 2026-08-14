import '../core/api_client.dart';
import '../models/course.dart';

/// Course domain service: turns raw `ApiClient` course responses into typed
/// `Course` objects for the catalog, detail, and enrollment flows.
class CourseService {
  final ApiClient apiClient;

  CourseService(this.apiClient);

  /// Fetches the full course catalog.
  Future<List<Course>> fetchCourses() async {
    final data = await apiClient.fetchCourses();
    return data.map((c) => Course.fromJson(c as Map<String, dynamic>)).toList();
  }

  /// Fetches a single course (with modules) by id.
  Future<Course> fetchCourseById(String id) async {
    final data = await apiClient.fetchCourseById(id);
    return Course.fromJson(data);
  }

  /// Enrolls the current user in a course by its slug; returns the (now
  /// enrolled) course object.
  Future<Course> enrollInCourse(String slug) async {
    final data = await apiClient.enrollInCourse(slug);
    return Course.fromJson(data);
  }
}
