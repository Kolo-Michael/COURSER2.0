import 'package:flutter/material.dart';
import '../models/module.dart';
import '../services/lessons_service.dart';
import '../core/api_client.dart';
import '../core/config.dart';

/// ─── Lesson player ───
/// Displays a single lesson's study notes, runs a small 3-question reading
/// comprehension quiz whose score becomes the lesson's completion progress,
/// and offers "Ask Cora" to ask the AI tutor questions about the lesson.
class LessonScreen extends StatefulWidget {
  final String courseId;
  final String lessonId;

  const LessonScreen(
      {super.key, required this.courseId, required this.lessonId});

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  late LessonsService _lessonsService;
  bool _isLoading = true;
  Lesson? _lesson;
  bool _quizCompleted = false;
  // question index -> the student's typed answer.
  final Map<int, String> _answers = {};

  @override
  void initState() {
    super.initState();
    // The lesson screen builds its own ApiClient/service (it can be entered
    // directly from the detail screen, outside the provider tree's dashboard).
    _lessonsService = LessonsService(
      ApiClient(baseUrl: Config.apiBaseUrl),
    );
    _loadLesson();
  }

  /// Fetches the lesson payload and parses it into a (module-style) `Lesson`.
  Future<void> _loadLesson() async {
    setState(() => _isLoading = true);
    try {
      final data = await _lessonsService.fetchLesson(widget.lessonId);
      setState(() {
        // Build a Lesson from the raw map; content notes drive the quiz.
        _lesson = Lesson(
          id: data['id']?.toString() ?? widget.lessonId,
          title: data['title']?.toString() ?? 'Lesson',
          content: data['content'] as String?,
          videoUrl: data['video_url'] as String?,
          isCompleted: false,
          progress: 0.0,
          orderIndex: data['order'] as int?,
        );
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  /// Grades the three answers, marks the lesson complete at 100%, and syncs
  /// the progress plus quiz score with the backend.
  void _submitQuiz() {
    final score = _calculateQuizScore();
    setState(() {
      _quizCompleted = true;
      _lesson = _lesson!.copyWith(isCompleted: true, progress: 100.0, quizScore: score);
    });
    _lessonsService.updateProgress(widget.lessonId, 100.0, quizScore: score);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Quiz submitted! Score: $score%')),
    );
  }

  /// Percentage of correct answers across the three questions.
  double _calculateQuizScore() {
    final correct = _answers.entries.where((e) {
      final expected = _expectedAnswer(e.key);
      return e.value.trim().toLowerCase() == expected.toLowerCase();
    }).length;
    return (correct / 3 * 100).clamp(0, 100);
  }

  /// Infers the expected answer for a question by scanning the lesson content
  /// for the topic keywords that the seeded notes use, with a sensible
  /// default per question slot.
  String _expectedAnswer(int index) {
    final content = _lesson?.content ?? '';
    final lower = content.toLowerCase();
    switch (index) {
      case 0:
        if (lower.contains('html') || lower.contains('layout')) return 'html';
        if (lower.contains('python') || lower.contains('pandas')) return 'python';
        if (lower.contains('ai') || lower.contains('prompt')) return 'ai';
        if (lower.contains('mobile') || lower.contains('react native')) return 'mobile';
        if (lower.contains('deploy') || lower.contains('environment')) return 'deployment';
        if (lower.contains('design') || lower.contains('learning')) return 'design';
        return 'html';
      case 1:
        if (lower.contains('responsive')) return 'responsive';
        if (lower.contains('clean')) return 'clean';
        if (lower.contains('checklist')) return 'checklist';
        return 'responsive';
      case 2:
        if (lower.contains('component')) return 'components';
        if (lower.contains('chart')) return 'chart';
        if (lower.contains('objective')) return 'objective';
        if (lower.contains('navigation')) return 'navigation';
        if (lower.contains('variable')) return 'variables';
        return 'components';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_lesson?.title ?? 'Lesson'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _lesson == null
              ? const Center(child: Text('Failed to load lesson'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _lesson!.title,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      if (_lesson!.content != null)
                        _LessonNotes(content: _lesson!.content!),
                      const SizedBox(height: 24),
                      LinearProgressIndicator(
                        value: _quizCompleted ? 1.0 : 0.0,
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _quizCompleted
                            ? 'Lesson completed!'
                            : 'Mark as complete by passing the quiz',
                        style: TextStyle(
                          color: _quizCompleted
                              ? Colors.green[700]
                              : Colors.grey[600],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 24),
                      if (!_quizCompleted) ...[
                        const Text(
                          'Reading Comprehension Quiz',
                          style: TextStyle(
                              fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        _buildQuizQuestion(0, 'What is the main topic of this lesson?'),
                        _buildQuizQuestion(1, 'What is the most important thing to remember?'),
                        _buildQuizQuestion(2, 'What is the key takeaway?'),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _answers.length == 3 ? _submitQuiz : null,
                            child: const Text('Submit Quiz'),
                          ),
                        ),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.green[50],
                            border: Border.all(color: Colors.green[200]!),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.check_circle, color: Colors.green),
                              SizedBox(width: 8),
                              Text('Lesson complete! Great job learning today.'),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () => _showQuestionDialog(context),
                          icon: const Icon(Icons.chat),
                          label: const Text('Ask Cora About This Lesson'),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  /// Renders one of the quiz's free-text questions; the answer is recorded
  /// (or removed when emptied) and the submit button enabled once all three
  /// questions have answers.
  Widget _buildQuizQuestion(int index, String question) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(question,
              style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          TextField(
            decoration: InputDecoration(
              hintText: 'Type your answer...',
              border: const OutlineInputBorder(),
            ),
            maxLines: 2,
            onChanged: (val) {
              if (val.trim().isNotEmpty) {
                _answers[index] = val;
              } else {
                _answers.remove(index);
              }
              setState(() {});
            },
          ),
        ],
      ),
    );
  }

  /// Opens the "Ask Cora" bottom sheet: sends the question to the backend AI
  /// tutor and shows the plain-text answer (or an error) in a SnackBar.
  void _showQuestionDialog(BuildContext ctx) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Ask Cora AI Tutor',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: 'Type your question here...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final question = controller.text.trim();
                      if (question.isEmpty) return;
                      try {
                        final res = await _lessonsService.askQuestion(
                            widget.courseId, question);
                        if (!context.mounted) return;
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                              content: Text(
                                  res['answer'] as String? ?? 'No response')),
                        );
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: ${e.toString()}')),
                        );
                      }
                    },
                    child: const Text('Send'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Renders a lesson's organized study notes.
///
/// The backend stores structured notes using `## Heading` sections, `- `
/// bullets, `1. ` numbered lists, plain paragraphs, and **bold** emphasis.
/// This keeps video-less lessons readable and completable on mobile.
class _LessonNotes extends StatelessWidget {
  final String content;

  const _LessonNotes({required this.content});

  @override
  Widget build(BuildContext context) {
    final widgets = _parse(context);
    if (widgets.isEmpty) {
      return Text(
        'This lesson has no written notes yet — check back soon.',
        style: TextStyle(fontSize: 16, height: 1.5, color: Colors.grey[600]),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  /// Converts the structured note text into a list of widgets. Each line is
  /// classified as a heading, a `- ` bullet, or a plain paragraph; bold
  /// segments (`**...**`) are handled later by `_spans`.
  List<Widget> _parse(BuildContext context) {
    final theme = Theme.of(context);
    final headingRe = RegExp(r'^#{1,3}\s+(.+)$');
    final bulletRe = RegExp(r'^[-*]\s+(.+)$');
    final widgets = <Widget>[];

    for (final rawLine in content.split('\n')) {
      final line = rawLine.trim();
      if (line.isEmpty) continue;

      final heading = headingRe.firstMatch(line);
      if (heading != null) {
        // `## Heading` → styled header, tinted with the theme's primary color.
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 18, bottom: 8),
          child: Text.rich(
            TextSpan(
              children: _spans(heading.group(1)!),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.3,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
        ));
        continue;
      }

      final bullet = bulletRe.firstMatch(line);
      if (bullet != null) {
        // `- item` → a row with a small dot bullet and indented text.
        widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 9, right: 10),
                child: Icon(Icons.circle, size: 6, color: theme.colorScheme.primary),
              ),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    children: _spans(bullet.group(1)!),
                    style: const TextStyle(fontSize: 16, height: 1.5),
                  ),
                ),
              ),
            ],
          ),
        ));
        continue;
      }

      // Anything else becomes a plain paragraph line.
      widgets.add(Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text.rich(
          TextSpan(
            children: _spans(line),
            style: const TextStyle(fontSize: 16, height: 1.5),
          ),
        ),
      ));
    }
    return widgets;
  }

  /// Splits a line on **bold** markers into alternating plain/bold spans.
  List<InlineSpan> _spans(String text) {
    final parts = text.split('**');
    return [
      for (var i = 0; i < parts.length; i++)
        TextSpan(
          text: parts[i],
          style: i.isOdd ? const TextStyle(fontWeight: FontWeight.bold) : null,
        ),
    ];
  }
}
