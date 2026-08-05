import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/config.dart';
import '../theme/app_theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;
  final Set<String> _interests = {};
  String? _goal;

  static const _pages = 4;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _finish() {
    context.go('/login');
  }

  void _next() {
    if (_page < _pages - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('[COURSER] screen: onboarding');
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  _PageDots(count: _pages, current: _page),
                  const Spacer(),
                  if (_page < _pages - 1)
                    TextButton(
                      onPressed: _finish,
                      child: const Text('Skip'),
                    ),
                ],
              ),
            ),
            Expanded(
              child: PageView(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                children: [
                  _WelcomePage(),
                  _InterestsPage(
                    interests: _interests,
                    onToggle: (name) => setState(() {
                      _interests.contains(name)
                          ? _interests.remove(name)
                          : _interests.add(name);
                    }),
                  ),
                  _GoalsPage(
                    selected: _goal,
                    onSelect: (goal) => setState(() => _goal = goal),
                  ),
                  _StreakPage(),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
              child: SizedBox(
                height: 52,
                width: double.infinity,
                child: FilledButton(
                  onPressed: _next,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.accent,
                  ),
                  child: Text(_page == _pages - 1 ? 'Get started' : 'Continue'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PageDots extends StatelessWidget {
  final int count;
  final int current;

  const _PageDots({required this.count, required this.current});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(count, (i) {
        final active = i == current;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.only(right: 6),
          width: active ? 24 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: active ? AppTheme.accent : AppTheme.stone200,
            borderRadius: BorderRadius.circular(99),
          ),
        );
      }),
    );
  }
}

class _PageShell extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? body;

  const _PageShell({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.body,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: AppTheme.brandGradient,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, size: 34, color: Colors.white),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              height: 1.2,
              color: AppTheme.stone900,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 15,
              height: 1.55,
              color: AppTheme.stone600,
            ),
          ),
          if (body != null) ...[
            const SizedBox(height: 24),
            body!,
          ],
        ],
      ),
    );
  }
}

class _WelcomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _PageShell(
      icon: Icons.school,
      title: 'Welcome to COURSER',
      subtitle:
          'Your intelligent campus. Pick a path, learn a little every day, and build skills with AI-shaped courses built for real progress.',
      body: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.primary.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.15)),
        ),
        child: const Row(
          children: [
            Icon(Icons.local_fire_department, color: AppTheme.accent, size: 28),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Small daily steps build streaks you can be proud of. We\'ll help you stay consistent.',
                style: TextStyle(
                  fontSize: 13.5,
                  height: 1.45,
                  color: AppTheme.stone700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InterestsPage extends StatelessWidget {
  final Set<String> interests;
  final ValueChanged<String> onToggle;

  const _InterestsPage({required this.interests, required this.onToggle});

  static const _options = [
    ('🧑‍💻', 'Web development'),
    ('📊', 'Data & analytics'),
    ('🤖', 'AI & machine learning'),
    ('🎨', 'Design & product'),
    ('🚀', 'DevOps & cloud'),
    ('📱', 'Mobile apps'),
  ];

  @override
  Widget build(BuildContext context) {
    return _PageShell(
      icon: Icons.explore_outlined,
      title: 'What do you want to learn?',
      subtitle: 'Pick a few topics that sound exciting. You can change this anytime.',
      body: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: _options.map((option) {
          final name = option.$2;
          final selected = interests.contains(name);
          return GestureDetector(
            onTap: () => onToggle(name),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: selected ? AppTheme.primary : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: selected ? AppTheme.primary : AppTheme.stone200,
                  width: 1.5,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(option.$1, style: const TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Text(
                    name,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: selected ? Colors.white : AppTheme.stone700,
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _GoalsPage extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelect;

  const _GoalsPage({required this.selected, required this.onSelect});

  static const _goals = [
    ('💼', 'Level up my career'),
    ('🎯', 'Prepare for an exam'),
    ('🧘', 'Learn for personal growth'),
    ('🛠️', 'Build something new'),
  ];

  @override
  Widget build(BuildContext context) {
    return _PageShell(
      icon: Icons.flag_outlined,
      title: 'What\'s your main goal?',
      subtitle: 'We\'ll use this to tailor what surfaces first on your dashboard.',
      body: Column(
        children: _goals.map((goal) {
          final name = goal.$2;
          final active = selected == name;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GestureDetector(
              onTap: () => onSelect(name),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: active ? AppTheme.primary.withValues(alpha: 0.08) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: active ? AppTheme.primary : AppTheme.stone200,
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    Text(goal.$1, style: const TextStyle(fontSize: 22)),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.stone800,
                        ),
                      ),
                    ),
                    if (active)
                      const Icon(Icons.check_circle, color: AppTheme.primary, size: 22),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _StreakPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _PageShell(
      icon: Icons.local_fire_department,
      title: 'Keep your streak alive',
      subtitle:
          'Learn a little every day to grow your streak. If life gets in the way and you miss a day, you can restore it.',
      body: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFFF8A00), Color(0xFFF97316)],
          ),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Streak restore',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You get ${Config.maxStreakRestoresPerMonth} restores every month. Each one fills in a skipped day so your streak doesn\'t reset.',
              style: TextStyle(
                fontSize: 13.5,
                height: 1.5,
                color: Colors.white.withValues(alpha: 0.95),
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.refresh, size: 16, color: Colors.white),
                  SizedBox(width: 6),
                  Text(
                    '${Config.maxStreakRestoresPerMonth} restores / month',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
