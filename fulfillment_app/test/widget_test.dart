import 'package:flutter_test/flutter_test.dart';
import 'package:fulfillment_app/main.dart';

void main() {
  testWidgets('App boots', (tester) async {
    await tester.pumpWidget(const FulfillmentRoot());
    expect(find.textContaining('Rybella'), findsWidgets);
  });
}
