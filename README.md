# Local AI – تطبيق الذكاء الاصطناعي المحلي (Local-First)

تطبيق ذكاء اصطناعي محلي يعمل أساسًا على جهاز المستخدم (هاتف أندرويد / iOS)، مع نموذج Qwen مدمج، بدون أي سيرفر مركزي لتشغيل الـ AI.

## المبادئ الأساسية (Strict Specs)

- **LOCAL-FIRST / NO CENTRAL AI SERVER**
- النموذج يعمل على الجهاز (On-Device Inference)
- الإنترنت اختياري للأدوات فقط (Search / APIs / Downloads)
- لا يتم إرسال المحادثة إلى أي خادم خاص بالمشروع لتشغيل النموذج
- سياسة صارمة ضد الهلوسة (No Hallucination)
- الخصوصية: بيانات المستخدم تبقى على الجهاز

## المعمارية

```
Application
│
├── UI (Dark / Premium / Futuristic)
│
├── AI Core
│   ├── Model Runtime      ← تشغيل النموذج المحلي (Streaming + Stop)
│   ├── Model Manager      ← تنزيل / حذف / فحص النماذج
│   ├── AI Router          ← يقرر Local AI vs Internet Tools
│   └── Context Manager
│
├── Tools
│   ├── Search Tool
│   ├── Browser Tool
│   ├── File Tool
│   ├── Image Tool
│   ├── Calculator
│   └── Local Utilities
│
├── Storage (Local only)
│   ├── Conversations
│   ├── Models
│   ├── Settings
│   └── Cache
│
└── Network Layer
    ├── Internet Detection
    ├── External APIs
    └── Downloads
```

## الحالة الحالية للمشروع

هذا المستودع يحتوي على الهيكل الكامل والـ Architecture Code حسب المواصفات التنفيذية الصارمة.

### المكونات المنفذة (Foundation)

- هيكل المجلدات الكامل حسب القسم 19
- Model Manager (مع اكتشاف الجهاز + Capability Levels)
- AI Router (قرار Local vs Online)
- Model Runtime (واجهة + Mock Streaming قابل للاستبدال بـ llama.cpp / llama.rn)
- Context Manager
- Storage Layers
- Tools Stubs
- UI Components Stubs (Dark Theme)
- Device Capability Detector
- Strict Anti-Hallucination Policies

### النموذج المدمج

النموذج الأساسي المطلوب: **Qwen** خفيف (Quantized 4-bit أو أقل) يعمل على الجهاز.

في الإصدار الحالي يتم استخدام Mock Runtime يمكن استبداله بسهولة بمكتبة حقيقية مثل:

- `llama.rn` (React Native)
- `llama.cpp` bindings
- MediaPipe LLM Inference
- ONNX Runtime Mobile

النموذج الحقيقي يتم تنزيله عبر Model Manager إلى جهاز المستخدم.

## كيفية البناء (موصى به)

### الخيار 1: React Native + Expo (موصى به للبداية)

```bash
npx create-expo-app@latest LocalAI --template blank-typescript
# ثم انسخ ملفات src/ إلى المشروع
```

### الخيار 2: Flutter

استخدم `llama_cpp_dart` أو bindings مشابهة.

### الخيار 3: Native Android (Kotlin) + llama.cpp

أفضل أداء على أندرويد.

## تشغيل النموذج المحلي الحقيقي

1. نزّل نموذج Qwen GGUF مناسب للموبايل (مثل Qwen2.5-0.5B أو 1.5B Q4_K_M)
2. ضعه في مجلد النماذج عبر Model Manager
3. استبدل `MockModelRuntime` بـ runtime حقيقي يدعم Streaming و Cancellation

## القواعد الصارمة المطبقة

- لا اختلاق معلومات
- لا مصادر وهمية
- لا ادعاء استخدام أدوات لم تُستخدم
- حالة المهمة واضحة (IDLE → ANALYZING → RUNNING → ... → COMPLETED / FAILED)
- تحرير الذاكرة عند عدم الحاجة
- فحص قدرة الجهاز قبل تشغيل نماذج كبيرة

## الترخيص والاستخدام

المشروع يتبع المواصفات التنفيذية الصارمة المقدمة.

---

**القاعدة النهائية:**  
«التطبيق هو المنصة، الهاتف هو بيئة التشغيل، النموذج المحلي هو قلب الذكاء الاصطناعي، والإنترنت مجرد قدرة إضافية عند الحاجة—not the foundation of the product.»
