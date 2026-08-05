import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/api_client.dart';
import 'core/config.dart';
import 'core/storage.dart';
import 'state/auth_state.dart';
import 'state/courses_state.dart';
import 'state/streak_state.dart';
import 'theme/app_theme.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/home_screen.dart';
import 'screens/course_detail_screen.dart';
import 'screens/lesson_screen.dart';

class CourserApp extends StatefulWidget {
  const CourserApp({super.key});

  @override
  State<CourserApp> createState() => _CourserAppState();
}

class _CourserAppState extends State<CourserApp> {
  late final ApiClient _api;
  late final AuthState _authState;
  late final CoursesState _coursesState;
  late final StreakState _streakState;
  late final GoRouter _router;
  AppLifecycleListener? _lifecycleListener;

  @override
  void initState() {
    super.initState();
    _api = ApiClient(baseUrl: Config.apiBaseUrl);
    _authState = AuthState(apiClient: _api, storage: SecureStore())..init();
    _coursesState = CoursesState(apiClient: _api)..fetchCourses();
    _streakState = StreakState(apiClient: _api);
    _router = GoRouter(
      initialLocation: '/onboarding',
      refreshListenable: _authState,
      redirect: (context, state) {
        final auth = context.read<AuthState>();
        final location = state.uri.toString();
        final publicPaths = {'/onboarding', '/login', '/signup'};
        if (auth.isLoading) return null;
        if (auth.token == null) {
          // No login yet: onboarding always shows when the app is opened.
          // Once the user leaves it for the auth pages, let them through.
          if (publicPaths.contains(location)) return null;
          return '/onboarding';
        }
        if (publicPaths.contains(location)) return '/home';
        return null;
      },
      routes: [
        GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
        GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
        GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
        GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        GoRoute(
          path: '/course/:id',
          builder: (context, state) =>
              CourseDetailScreen(courseId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/course/:courseId/lesson/:lessonId',
          builder: (context, state) => LessonScreen(
            courseId: state.pathParameters['courseId']!,
            lessonId: state.pathParameters['lessonId']!,
          ),
        ),
      ],
    );
    _lifecycleListener = AppLifecycleListener(
      onHide: () => _authState.setAppBackground(true),
      onPause: () => _authState.setAppBackground(true),
      onShow: () => _authState.setAppBackground(false),
      onResume: () => _authState.setAppBackground(false),
    );
  }

  @override
  void dispose() {
    _lifecycleListener?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authState),
        ChangeNotifierProvider.value(value: _coursesState),
        ChangeNotifierProvider.value(value: _streakState),
      ],
      child: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (_) => _authState.recordActivity(),
        child: MaterialApp.router(
          title: 'COURSER',
          theme: AppTheme.light,
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
        ),
      ),
    );
  }
}
