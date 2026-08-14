import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/course.dart';
import '../models/module.dart';
import '../state/courses_state.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// ─── Course detail ───
/// Full-page view of a course: parallax thumbnail, metadata, curriculum
/// modules (ExpansionTiles of lessons), and a "Start Learning" button that
/// jumps to the first lesson. The course body (including nested modules) is
/// fetched fresh through `CoursesState.fetchCourseDetail`.
class CourseDetailScreen extends StatefulWidget {
  final String courseId;

  const CourseDetailScreen({super.key, required this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  late Future<Course> _courseFuture;

  @override
  void initState() {
    super.initState();
    // Kick off the course fetch immediately; the FutureBuilder consumes it.
    _courseFuture =
        context.read<CoursesState>().fetchCourseDetail(widget.courseId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<Course>(
        future: _courseFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          if (snapshot.hasError) {
            return Scaffold(
                body: Center(child: Text('Error: ${snapshot.error}')));
          }
          final course = snapshot.data!;
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 200,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(course.title),
                  background: course.thumbnailUrl != null
                      ? CachedNetworkImage(
                          imageUrl: course.thumbnailUrl!,
                          fit: BoxFit.cover,
                        )
                      : Container(color: Colors.grey[300]),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(course.title,
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(fontWeight: FontWeight.bold)),
                      if (course.description != null) ...[
                        const SizedBox(height: 8),
                        Text(course.description!),
                      ],
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 16,
                        children: [
                          if (course.durationMinutes != null)
                            _buildMeta(Icons.access_time,
                                '${course.durationMinutes} min'),
                          if (course.rating != null)
                            _buildMeta(Icons.star,
                                '${course.rating!.toStringAsFixed(1)} rating'),
                          if (course.totalStudents != null)
                            _buildMeta(Icons.people,
                                '${course.totalStudents} students'),
                          if (course.difficulty != null)
                            _buildMeta(
                                Icons.signal_cellular_alt, course.difficulty!),
                        ],
                      ),
                      const SizedBox(height: 24),
                      const Text('Curriculum',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              if (course.modules.isNotEmpty)
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) => _ModuleTile(
                      module: course.modules[i],
                      courseId: course.id,
                    ),
                    childCount: course.modules.length,
                  ),
                ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                sliver: SliverToBoxAdapter(
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        final firstLesson = course.modules.isNotEmpty &&
                                course.modules.first.lessons.isNotEmpty
                            ? course.modules.first.lessons.first
                            : null;
                        if (firstLesson != null) {
                          GoRouter.of(context).push(
                              '/course/${course.id}/lesson/${firstLesson.id}');
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('No lessons available')),
                          );
                        }
                      },
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Start Learning'),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Small inline label for a course stat (duration, rating, students...).
  Widget _buildMeta(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(color: Colors.grey[600])),
      ],
    );
  }
}

/// An expandable module row listing its lessons; tapping a lesson opens it.
class _ModuleTile extends StatelessWidget {
  final Module module;
  final String courseId;

  const _ModuleTile({required this.module, required this.courseId});

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      title: Text(module.title),
      childrenPadding: const EdgeInsets.only(left: 16),
      children: module.lessons.asMap().entries.map((entry) {
        final lesson = entry.value;
        return ListTile(
          contentPadding: const EdgeInsets.only(left: 16),
          leading: CircleAvatar(
            radius: 14,
            backgroundColor: Colors.blue[100],
            child: Text('${entry.key + 1}',
                style: const TextStyle(fontSize: 12)),
          ),
          title: Text(lesson.title),
          trailing: lesson.durationMinutes != null
              ? Text('${lesson.durationMinutes} min',
                  style: TextStyle(color: Colors.grey[600]))
              : null,
          onTap: () {
            GoRouter.of(context).push(
                '/course/$courseId/lesson/${lesson.id}');
          },
        );
      }).toList(),
    );
  }
}
