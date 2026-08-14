import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'app.dart';

/// ─── Entry point ───
/// Bootstraps the Flutter engine and mounts the root `CourserApp` widget.
/// The app's router, providers, and shared API state all live in `app.dart`.
void main() {
  // Ensure the engine bindings exist before any plugin/platform call.
  WidgetsFlutterBinding.ensureInitialized();
  // Turn on the semantics tree so screen readers can traverse the UI.
  SemanticsBinding.instance.ensureSemantics();
  runApp(const CourserApp());
}
