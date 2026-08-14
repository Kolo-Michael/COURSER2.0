/// A user's enrollment in a course: identity linkage plus the user's overall
/// progress (0–100) in that course and when they enrolled.
class Enrollment {
  const Enrollment({
    required this.id,
    required this.userId,
    required this.courseId,
    required this.progress,
    this.enrolledAt,
  });

  /// Parses an enrollment JSON object; `progress` defaults to 0 when missing.
  factory Enrollment.fromJson(Map<String, dynamic> json) => Enrollment(
        id: json['id'].toString(),
        userId: json['user_id'].toString(),
        courseId: json['course_id'].toString(),
        progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
        enrolledAt: json['enrolled_at'] != null
            ? DateTime.tryParse(json['enrolled_at'] as String)
            : null,
      );

  final String id;
  final String userId;
  final String courseId;
  final double progress;
  final DateTime? enrolledAt;
}