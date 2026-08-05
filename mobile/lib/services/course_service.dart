import '../core/api_client.dart';
import '../models/course.dart';

class CourseService {
  final ApiClient apiClient;

  CourseService(this.apiClient);

  Future<List<Course>> fetchCourses() async {
    final data = await apiClient.fetchCourses();
    return data.map((c) => Course.fromJson(c as Map<String, dynamic>)).toList();
  }

  Future<Course> fetchCourseById(String id) async {
    final data = await apiClient.fetchCourseById(id);
    return Course.fromJson(data);
  }

  Future<Course> enrollInCourse(String slug) async {
    final data = await apiClient.enrollInCourse(slug);
    return Course.fromJson(data);
  }
}
