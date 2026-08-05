import '../models/module.dart';

class Category {
  final String id;
  final String name;
  final String? slug;
  final String? description;
  final String? icon;

  Category({
    required this.id,
    required this.name,
    this.slug,
    this.description,
    this.icon,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug'] as String?,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
    );
  }
}

class Course {
  final String id;
  final String title;
  final String? description;
  final String? slug;
  final String? thumbnailUrl;
  final Category? category;
  final String? difficulty;
  final double? rating;
  final int? totalStudents;
  final int? durationMinutes;
  final bool isEnrolled;
  final List<Module> modules;

  Course({
    required this.id,
    required this.title,
    this.description,
    this.slug,
    this.thumbnailUrl,
    this.category,
    this.difficulty,
    this.rating,
    this.totalStudents,
    this.durationMinutes,
    this.isEnrolled = false,
    this.modules = const [],
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    final modulesData = json['modules'] as List<dynamic>? ?? [];
    return Course(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ??
          json['short_description']?.toString(),
      slug: json['slug'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
      category: json['category'] != null
          ? Category.fromJson(json['category'] as Map<String, dynamic>)
          : null,
      difficulty: json['difficulty']?.toString() ??
          json['level']?.toString(),
      rating: (json['rating'] as num?)?.toDouble(),
      totalStudents: json['total_students'] as int?,
      durationMinutes: json['duration_minutes'] as int?,
      isEnrolled: json['is_enrolled'] as bool? ?? false,
      modules: modulesData
          .map((m) => Module.fromJson(m as Map<String, dynamic>))
          .toList(),
    );
  }

  Course copyWith({bool? isEnrolled}) {
    return Course(
      id: id,
      title: title,
      description: description,
      slug: slug,
      thumbnailUrl: thumbnailUrl,
      category: category,
      difficulty: difficulty,
      rating: rating,
      totalStudents: totalStudents,
      durationMinutes: durationMinutes,
      isEnrolled: isEnrolled ?? this.isEnrolled,
      modules: modules,
    );
  }
}
