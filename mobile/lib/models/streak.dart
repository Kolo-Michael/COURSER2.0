/// Learning-streak snapshot returned by `GET /streak`.
class Streak {
  final int currentStreak;
  final int longestStreak;
  final DateTime? lastLearningDay;
  final bool learnedToday;
  final int daysThisMonth;
  final int restoresUsed;
  final int restoresAvailable;
  final int maxRestoresPerMonth;
  final DateTime? restorableDay;
  final bool restoreEligible;

  const Streak({
    required this.currentStreak,
    required this.longestStreak,
    this.lastLearningDay,
    required this.learnedToday,
    required this.daysThisMonth,
    required this.restoresUsed,
    required this.restoresAvailable,
    required this.maxRestoresPerMonth,
    this.restorableDay,
    required this.restoreEligible,
  });

  factory Streak.fromJson(Map<String, dynamic> json) {
    return Streak(
      currentStreak: (json['current_streak'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longest_streak'] as num?)?.toInt() ?? 0,
      lastLearningDay: json['last_learning_day'] != null
          ? DateTime.tryParse(json['last_learning_day'].toString())
          : null,
      learnedToday: json['learned_today'] as bool? ?? false,
      daysThisMonth: (json['days_this_month'] as num?)?.toInt() ?? 0,
      restoresUsed: (json['restores_used'] as num?)?.toInt() ?? 0,
      restoresAvailable: (json['restores_available'] as num?)?.toInt() ?? 0,
      maxRestoresPerMonth:
          (json['max_restores_per_month'] as num?)?.toInt() ?? 4,
      restorableDay: json['restorable_day'] != null
          ? DateTime.tryParse(json['restorable_day'].toString())
          : null,
      restoreEligible: json['restore_eligible'] as bool? ?? false,
    );
  }
}
