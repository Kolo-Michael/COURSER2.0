import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/courses_state.dart';
import 'components/course_card.dart';

/// Stand-alone courses catalog screen (simple grid of `CourseCard`s).
/// It is not part of the current go_router config — the catalog lives inside
/// `HomeScreen`'s courses tab — but it remains available for linking directly
/// to a full-scroll course list.
class CoursesListScreen extends StatelessWidget {
  const CoursesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<CoursesState>();

    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Center(child: Text('Error: ${state.error}'));
    }

    if (state.courses.isEmpty) {
      return const Center(child: Text('No courses found'));
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: state.courses.length,
      itemBuilder: (context, index) {
        final course = state.courses[index];
        return CourseCard(course: course);
      },
    );
  }
}
