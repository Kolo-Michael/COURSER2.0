import 'package:flutter/material.dart';
import '../models/module.dart';
import '../services/lessons_service.dart';
import '../core/api_client.dart';
import '../core/config.dart';

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
  final Map<int, String> _answers = {};

  @override
  void initState() {
    super.initState();
    _lessonsService = LessonsService(
      ApiClient(baseUrl: Config.apiBaseUrl),
    );
    _loadLesson();
  }

  Future<void> _loadLesson() async {
    setState(() => _isLoading = true);
    try {
      final data = await _lessonsService.fetchLesson(widget.lessonId);
      setState(() {
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

  double _calculateQuizScore() {
    final correct = _answers.entries.where((e) {
      final expected = _expectedAnswer(e.key);
      return e.value.trim().toLowerCase() == expected.toLowerCase();
    }).length;
    return (correct / 3 * 100).clamp(0, 100);
  }

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
                        Text(
                          _lesson!.content!,
                          style: const TextStyle(fontSize: 16, height: 1.5),
                        ),
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
