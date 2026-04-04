# تعديلات مهمة في home_screen.dart

إذا عادت المشاكل (overflow أو زر الكل لا يفتح الفئات الثانوية)، تأكد من:

## 1. زر "الكل" بجانب "تسوقي حسب النوع"
يجب أن يكون:
```dart
child: _buildSectionHeader('تسوقي حسب النوع', () => context.push('/subcategories')),
```
وليس `context.go('/explore')`

## 2. قسم الفئات الثانوية - منع overflow
- `height: 118` (وليس 100)
- `padding: vertical: 6` (وليس 12)
- `Container`: width/height 56 (وليس 60)
- `SizedBox(height: 4)` بين الصورة والنص (وليس 6)
- `borderRadius: 16` (وليس 18)
- `fontSize: 10` للنص (وليس 11)
- إضافة `mainAxisAlignment: MainAxisAlignment.center` للـ Column

## حفظ التعديلات
بعد أي تعديل: احفظ الملف (Ctrl+S) ثم نفّذ `git add` و `git commit` لضمان بقاء التغييرات.
