import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../state/auth_state.dart';
import '../state/courses_state.dart';
import '../state/streak_state.dart';
import '../theme/app_theme.dart';
import 'components/course_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('[COURSER] screen: home');
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: const [
          _DashboardTab(),
          _CoursesTab(),
          _ProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onItemTapped,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.book_outlined), selectedIcon: Icon(Icons.book), label: 'Courses'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tab 1 — Dashboard (greeting + re-auth countdown + continue learning)
// ---------------------------------------------------------------------------

class _DashboardTab extends StatefulWidget {
  const _DashboardTab();

  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<_DashboardTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<StreakState>().fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final state = context.watch<CoursesState>();
    final user = auth.user;

    final featured = state.courses.where((c) => c.isEnrolled).toList();
    final browse = (state.courses.isEmpty ? state.courses : state.courses)
        .where((c) => !c.isEnrolled)
        .take(6)
        .toList();
    final continueList = featured.isNotEmpty ? featured : browse;

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            context.read<CoursesState>().fetchCourses(),
            context.read<StreakState>().fetch(),
          ]);
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.displayName.isNotEmpty == true
                            ? 'Hello, ${user!.displayName.split(' ').first}!'
                            : 'Hello there!',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.stone900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Ready to keep learning today?',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: AppTheme.brandGradient,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    user?.displayName.isNotEmpty == true
                        ? user!.displayName[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const _ReauthCard(),
            const SizedBox(height: 12),
            const _StreakCard(),
            const SizedBox(height: 20),
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Continue learning',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.stone900,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/home'),
                  child: const Text('See all'),
                ),
              ],
            ),
            if (state.isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.error != null && continueList.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Text(
                    'Could not load courses.\n${state.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else if (continueList.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Text('No courses yet — browse the catalog to begin.'),
                ),
              )
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.78,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: continueList.length,
                itemBuilder: (context, index) {
                  final course = continueList[index];
                  return CourseCard(course: course);
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _ReauthCard extends StatelessWidget {
  const _ReauthCard();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final days = auth.daysUntilReauth;
    final remembered = auth.rememberMe;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: remembered
            ? const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)],
              )
            : const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF57534E), Color(0xFF78716C)],
              ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.verified_user_outlined,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Session security',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            days == null
                ? 'Your session stays active while you use the app.'
                : days <= 0
                    ? 'Re-authenticate today to keep your session.'
                    : remembered
                        ? 'You\'ll need to re-authenticate in $days ${days == 1 ? 'day' : 'days'}.'
                        : 'This session expires in $days ${days == 1 ? 'day' : 'days'}.',
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            remembered
                ? 'Thanks to "Remember me", you\'re signed in for up to 30 days.'
                : 'Tip: enable "Remember me" at sign in to stay signed in for 30 days.',
            style: TextStyle(
              fontSize: 12.5,
              height: 1.4,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
          if (days != null && days <= 7) ...[
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: (days / 30).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: Colors.white.withValues(alpha: 0.25),
              valueColor: const AlwaysStoppedAnimation(Colors.white),
              borderRadius: BorderRadius.circular(99),
            ),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Streak card — daily learning streak + monthly restore budget
// ---------------------------------------------------------------------------

class _StreakCard extends StatelessWidget {
  const _StreakCard();

  @override
  Widget build(BuildContext context) {
    final streak = context.watch<StreakState>();
    final data = streak.streak;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF7C2D12), Color(0xFFEA580C)],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF97316).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.local_fire_department,
                  color: Color(0xFFFFD166), size: 30),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  data == null
                      ? 'Learning streak'
                      : '${data.currentStreak} day streak',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (streak.isLoading && data == null)
            const LinearProgressIndicator(color: Colors.white)
          else if (data == null)
            Text(
              streak.error ?? 'Could not load your streak.',
              style: const TextStyle(fontSize: 13, color: Colors.white70),
            )
          else ...[
            Row(
              children: [
                _Metric(label: 'Longest', value: '${data.longestStreak}'),
                _Metric(label: 'This month', value: '${data.daysThisMonth}'),
                _Metric(
                  label: 'Restores',
                  value: '${data.restoresUsed}/${data.maxRestoresPerMonth}',
                ),
              ],
            ),
            if (data.restoreEligible && data.restorableDay != null) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'You missed ${_formatDay(data.restorableDay!)}. Restore it to keep the streak alive.',
                      style: TextStyle(
                        fontSize: 12.5,
                        height: 1.4,
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: streak.restoring ? null : () => _restore(context),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFFEA580C),
                      disabledBackgroundColor: Colors.white.withValues(alpha: 0.5),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      visualDensity: VisualDensity.compact,
                    ),
                    child: streak.restoring
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Restore'),
                  ),
                ],
              ),
            ] else ...[
              const SizedBox(height: 10),
              Text(
                data.learnedToday
                    ? 'You learned today — streak safe!'
                    : 'Complete a lesson today to keep the fire going.',
                style: const TextStyle(fontSize: 13, color: Colors.white70),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Future<void> _restore(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final error = await context.read<StreakState>().restore();
    messenger.showSnackBar(
      SnackBar(
        content: Text(
          error == null
              ? 'Streak restored! The fire lives on.'
              : 'Restore failed: $error',
        ),
      ),
    );
  }

  String _formatDay(DateTime day) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final local = day.toLocal();
    return '${months[local.month - 1]} ${local.day}';
  }
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;

  const _Metric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tab 2 — Courses catalog
// ---------------------------------------------------------------------------

class _CoursesTab extends StatelessWidget {
  const _CoursesTab();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<CoursesState>();

    if (state.isLoading && state.courses.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null && state.courses.isEmpty) {
      return Center(child: Text('Error: ${state.error}'));
    }

    if (state.courses.isEmpty) {
      return const Center(child: Text('No courses found'));
    }

    return SafeArea(
      top: false,
      child: RefreshIndicator(
        onRefresh: () async {
          await context.read<CoursesState>().fetchCourses();
        },
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.78,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: state.courses.length,
          itemBuilder: (context, index) {
            final course = state.courses[index];
            return CourseCard(course: course);
          },
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tab 3 — Profile
// ---------------------------------------------------------------------------

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 84,
              height: 84,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: AppTheme.brandGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Text(
                user?.displayName.isNotEmpty == true
                    ? user!.displayName[0].toUpperCase()
                    : '?',
                style: const TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            user?.displayName ?? 'COURSER user',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),
          Text(
            user?.email ?? '',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          Center(
            child: Chip(label: Text(user?.role ?? 'student')),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.verified_user_outlined, color: AppTheme.primary),
                  title: const Text('Session & security'),
                  subtitle: Text(
                    auth.daysUntilReauth == null
                        ? 'Session active'
                        : 'Re-authentication due in ${auth.daysUntilReauth} days',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showSessionSheet(context, auth),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: const Text('Help & Support'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Cora is here! Write to support@courser.app'),
                      ),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout, color: Colors.red),
                  title: const Text('Logout', style: TextStyle(color: Colors.red)),
                  onTap: () async {
                    await auth.logout();
                    if (context.mounted) context.go('/onboarding');
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showSessionSheet(BuildContext context, AuthState auth) {
    final days = auth.daysUntilReauth;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Session & re-authentication',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            Text(
              auth.rememberMe
                  ? 'You chose "Remember me" when signing in, so your session is kept alive for up to 30 days before you need to sign in again.'
                  : 'You signed in without "Remember me", so your session is shorter. Enable it next time to stay signed in for 30 days.',
              style: const TextStyle(fontSize: 14, height: 1.5, color: AppTheme.stone600),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.timer_outlined, color: AppTheme.primary),
                  const SizedBox(width: 10),
                  Text(
                    days == null
                        ? 'Session active'
                        : 'Days until re-authentication: $days',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              auth.sessionExpiresAt != null
                  ? 'Session expires: ${_formatExpiry(auth.sessionExpiresAt!)}'
                  : '',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  String _formatExpiry(DateTime expiry) {
    final local = expiry.toLocal();
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} '
        '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }
}
