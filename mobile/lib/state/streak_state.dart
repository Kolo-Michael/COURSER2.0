import 'package:flutter/foundation.dart';
import '../core/api_client.dart';
import '../models/streak.dart';

class StreakState extends ChangeNotifier {
  final ApiClient apiClient;

  Streak? _streak;
  bool _isLoading = false;
  String? _error;
  bool _restoring = false;

  Streak? get streak => _streak;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get restoring => _restoring;

  StreakState({required this.apiClient});

  Future<void> fetch() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await apiClient.fetchStreak();
      _streak = Streak.fromJson(data);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Spend one of this month's restores on the most recent skipped day.
  /// Returns an error message (or null on success) for SnackBars.
  Future<String?> restore() async {
    if (_restoring) return null;
    _restoring = true;
    notifyListeners();
    try {
      final data = await apiClient.restoreStreak();
      _streak = Streak.fromJson(data);
      _error = null;
      return null;
    } catch (e) {
      final message = e.toString().replaceFirst('DioException:', '');
      return message;
    } finally {
      _restoring = false;
      notifyListeners();
    }
  }
}
