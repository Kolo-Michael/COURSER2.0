import '../core/api_client.dart';
import '../models/module.dart';

class LessonsService {
  final ApiClient apiClient;

  LessonsService(this.apiClient);

  Future<Map<String, dynamic>> fetchLesson(String lessonId) async {
    return await apiClient.fetchLesson(lessonId);
  }

  Future<Lesson> completeLesson(String lessonId, double progress) async {
    final data = await apiClient.completeLesson(lessonId);
    return Lesson.fromJson(data);
  }

  Future<Lesson> updateProgress(
    String lessonId,
    double progress, {
    double? quizScore,
  }) async {
    final data = await apiClient.updateProgress(lessonId, progress, quizScore);
    return Lesson.fromJson(data);
  }

  Future<Map<String, dynamic>> askQuestion(
    String courseId,
    String question,
  ) async {
    return await apiClient.askQuestion(courseId, question);
  }
}
