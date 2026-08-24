# Local AI – تطبيق الذكاء الاصطناعي المحلي (Local-First)

تطبيق ذكاء اصطناعي محلي يعمل أساسًا على جهاز المستخدم (هاتف أندرويد / iOS)، مع نموذج Qwen مدمج، **بدون أي سيرفر مركزي** لتشغيل الـ AI.

## ✅ ما تم تنفيذه حسب المواصفات التنفيذية الصارمة

| القسم | المتطلب | الحالة |
|-------|---------|--------|
| 1 | هدف: تطبيق محلي على الهاتف + نموذج مدمج | ✅ هيكل كامل |
| 2 | LOCAL-FIRST / NO CENTRAL AI SERVER | ✅ مطبّق في المعمارية |
| 3 | نموذج Qwen محلي + Streaming + Stop | ✅ Runtime + Mock (قابل للاستبدال بـ GGUF حقيقي) |
| 4 | Model Manager كامل | ✅ اكتشاف / تنزيل / حذف / تحقق / RAM / Quantization |
| 5 | تصنيف قدرة الجهاز LOW/MEDIUM/HIGH/ULTRA | ✅ |
| 6 | العمل بدون إنترنت | ✅ المحادثة + النموذج + الإعدادات تعمل offline |
| 7 | وضع الإنترنت = أدوات فقط | ✅ AI Router يفصل Local vs Tools |
| 8 | AI Router | ✅ تحليل + قرار + أدوات |
| 9 | سياسة صارمة ضد الهلوسة | ✅ في Router + System Prompt + ردود واضحة |
| 10 | مستويات الثقة | ✅ HIGH/MEDIUM/LOW/UNKNOWN |
| 11 | حالات المهمة الواضحة | ✅ IDLE→ANALYZING→RUNNING→COMPLETED/FAILED/CANCELLED |
| 12 | نظام الأدوات منفصل | ✅ ToolsRegistry + Calculator + Search + Files |
| 13 | ذاكرة محلية | ✅ ConversationStore + SettingsStore |
| 14 | الخصوصية | ✅ لا إرسال تلقائي للمحادثات |
| 15-17 | واجهة Dark Premium + حالة النموذج | ✅ ChatScreen + Theme |
| 18 | Model Library | ✅ شاشة كاملة مع Download / Use / Delete |
| 19 | فصل المكونات | ✅ هيكل المجلدات حسب المواصفات |
| 20 | أخطاء صريحة | ✅ Task Failed + Reason |
| 21 | أداء (Lazy / Streaming / Stop) | ✅ |
| 22-24 | لا إخفاء ضعف النموذج + لا اختلاق | ✅ |

## البنية

```
src/
├── ai-core/
│   ├── AICore.ts              ← المنسق الرئيسي
│   ├── model-manager/         ← Model Manager
│   ├── model-runtime/         ← Runtime (Mock → استبدل بـ llama.rn)
│   ├── ai-router/             ← AI Router
│   └── context-manager/
├── tools/
│   ├── ToolsRegistry.ts
│   ├── search/
│   ├── calculator/            ← محلي 100%
│   └── files/
├── storage/
│   ├── conversations/
│   └── settings/
├── network/
├── ui/
│   ├── ChatScreen.tsx
│   ├── ModelLibraryScreen.tsx
│   ├── SettingsScreen.tsx
│   └── theme.ts
└── types.ts
```

## التشغيل

```bash
# بعد تثبيت Node
npm install
npx expo start
```

> **ملاحظة مهمة عن النموذج الحقيقي**  
> الـ Runtime الحالي Mock لمحاكاة Streaming و Stop و Anti-Hallucination.  
> لاستبدالها بنموذج Qwen حقيقي على الجهاز:
> 1. أضف مكتبة مثل `llama.rn` أو bindings لـ `llama.cpp`
> 2. نزّل ملف GGUF (Qwen2.5-0.5B أو 1.5B Q4_K_M)
> 3. استبدل `MockModelRuntime` في `createModelRuntime()`

النموذج المدمج يظهر في Model Library كـ **Bundled** ويعمل حتى بدون إنترنت.

## القاعدة النهائية

«التطبيق هو المنصة، الهاتف هو بيئة التشغيل، النموذج المحلي هو قلب الذكاء الاصطناعي، والإنترنت مجرد قدرة إضافية عند الحاجة—not the foundation of the product.»
