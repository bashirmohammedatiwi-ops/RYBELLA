# إصلاح نسبة الخصم في POS → Alhayaa → Rybella

## المشكلة

POS يحسب `discountPercent` من **السعر الفعلي** (SellPr5) وليس من **نسبة العرض** في النظام.

مثال:
- السعر الأصلي SellPr4 = **9,750**
- السعر النهائي SellPr5 = **5,200**
- نسبة العرض في POS = **50%**
- النسبة المحسوبة = **47%** ← هذا ما يصل لـ Rybella

## الحل على سيرفر Alhayaa

عدّل الملف في مشروع bashir:

`pos-sync-desktop/src/pricing.ts`

استبدل:

```typescript
  if (hasOffer && original > 0 && finalPrice < original) {
    discountPercent = Math.round((1 - finalPrice / original) * 100);
  }
```

بـ:

```typescript
  if (hasOffer && original > 0 && finalPrice < original) {
    if (discountType === 0 && discountValue != null && discountValue > 0) {
      discountPercent = Math.round(discountValue);
    } else {
      discountPercent = Math.round((1 - finalPrice / original) * 100);
    }
  }
```

## بعد التعديل

1. أعد بناء POS Sync على Windows
2. شغّل **مزامنة الآن** من POS → Alhayaa
3. على Rybella: **المنتجات → مزامنة الأسعار**

## Rybella

Rybella يخزّن القيم **كما تأتي من Alhayaa**، مع أولوية لنسبة العرض:

1. `discountValue` من POS (إن وُجد)
2. النسبة المستخرجة من `offerName` (مثل `"20 %"`)
3. `discountPercent` القادم من Alhayaa

مثال الباركود `8059693580117`: Alhayaa يرسل 33% (محسوبة من 15000→10000) لكن `offerName` = `"20 %"` → Rybella يخزّن **20%**.
