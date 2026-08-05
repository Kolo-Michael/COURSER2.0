class Enrollment {
  const Enrollment({
    required this.id,
    required this.userId,
    required this.courseId,
    required this.progress,
    this.enrolledAt,
  });

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