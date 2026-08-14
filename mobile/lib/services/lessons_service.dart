import '../core/api_client.dart';
import '../models/module.dart';

/// Lesson domain service: fetches lesson content, records completion/progress
/// (with optional quiz score), and asks the Cora AI tutor questions.
class LessonsService {
  final ApiClient apiClient;

  LessonsService(this.apiClient);

  /// Fetches a lesson's raw payload (parsed by the screen, not this service).
  Future<Map<String, dynamic>> fetchLesson(String lessonId) async {
    return await apiClient.fetchLesson(lessonId);
  }

  /// Marks a lesson complete and returns the resulting lesson object.
  Future<Lesson> completeLesson(String lessonId, double progress) async {
    final data = await apiClient.completeLesson(lessonId);
    return Lesson.fromJson(data);
  }

  /// Persists a lesson's progress (0–100) plus an optional quiz score.
  Future<Lesson> updateProgress(
    String lessonId,
    double progress, {
    double? quizScore,
  }) async {
    final data = await apiClient.updateProgress(lessonId, progress, quizScore);
    return Lesson.fromJson(data);
  }

  /// Sends a question to the Cora AI tutor; returns the response JSON body.
  Future<Map<String, dynamic>> askQuestion(
    String courseId,
    String question,
  ) async {
    return await apiClient.askQuestion(courseId, question);
  }
}
