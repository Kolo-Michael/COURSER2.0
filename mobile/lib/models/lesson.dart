class Lesson {
  const Lesson({
    required this.id,
    required this.title,
    required this.content,
    required this.duration,
    required this.order,
    required this.isPublished,
    this.videoUrl,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) => Lesson(
        id: json['id'] as String,
        title: json['title'] as String,
        content: json['content'] as String? ?? '',
        duration: json['duration'] as String? ?? '',
        order: json['order'] as int? ?? 0,
        isPublished: json['is_published'] as bool? ?? true,
        videoUrl: json['video_url'] as String?,
      );

  final String id;
  final String title;
  final String content;
  final String duration;
  final int order;
  final bool isPublished;
  final String? videoUrl;
}