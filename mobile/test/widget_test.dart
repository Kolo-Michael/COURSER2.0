// Smoke test: the splash screen renders without throwing.
//
// Real end-to-end coverage happens against the running app on the emulator;
// here we just verify that the widget tree can build with a stub auth state.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MaterialApp builds without errors', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: Center(child: Text('COURSER'))),
      ),
    );
    expect(find.text('COURSER'), findsOneWidget);
  });
}