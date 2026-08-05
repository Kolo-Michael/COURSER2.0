class Lesson {
  final String id;
  final String title;
  final String? description;
  final String? content;
  final String? videoUrl;
  final String? slug;
  final int? durationMinutes;
  final int? orderIndex;
  final bool isCompleted;
  final double progress;
  final double? quizScore;
  final String? lessonType;

  Lesson({
    required this.id,
    required this.title,
    this.description,
    this.content,
    this.videoUrl,
    this.slug,
    this.durationMinutes,
    this.orderIndex,
    this.isCompleted = false,
    this.progress = 0.0,
    this.quizScore,
    this.lessonType,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description'] as String?,
      content: json['content'] as String?,
      videoUrl: json['video_url'] as String?,
      slug: json['slug'] as String?,
      // Backend sends `duration` as a human string ("15 min"); parse the
      // leading integer as minutes so existing UI stays correct.
      durationMinutes: _parseDurationMinutes(json['duration']),
      orderIndex: json['order'] as int? ?? json['order_index'] as int?,
      isCompleted: json['is_completed'] as bool? ?? false,
      progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
      quizScore: (json['quiz_score'] as num?)?.toDouble(),
      lessonType: json['lesson_type'] as String?,
    );
  }

  static int? _parseDurationMinutes(Object? duration) {
    if (duration == null) return null;
    if (duration is int) return duration;
    final s = duration.toString();
    final match = RegExp(r'\d+').firstMatch(s);
    return match == null ? null : int.parse(match.group(0)!);
  }

  Lesson copyWith({bool? isCompleted, double? progress, double? quizScore}) {
    return Lesson(
      id: id,
      title: title,
      description: description,
      content: content,
      videoUrl: videoUrl,
      slug: slug,
      durationMinutes: durationMinutes,
      orderIndex: orderIndex,
      isCompleted: isCompleted ?? this.isCompleted,
      progress: progress ?? this.progress,
      quizScore: quizScore ?? this.quizScore,
      lessonType: lessonType,
    );
  }
}

class Module {
  final String id;
  final String title;
  final String? description;
  final int? orderIndex;
  final List<Lesson> lessons;

  Module({
    required this.id,
    required this.title,
    this.description,
    this.orderIndex,
    this.lessons = const [],
  });

  factory Module.fromJson(Map<String, dynamic> json) {
    final lessonsData = json['lessons'] as List<dynamic>? ?? [];
    return Module(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description'] as String?,
      orderIndex: json['order_index'] as int?,
      lessons: lessonsData
          .map((l) => Lesson.fromJson(l as Map<String, dynamic>))
          .toList(),
    );
  }
}
