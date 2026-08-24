# برنامج تجريبي على الأندرويد – Local AI Demo

## المتطلبات على جهازك

1. Node.js 18+
2. Android Studio (مع Android SDK)
3. جهاز أندرويد أو Emulator
4. حساب Expo (مجاني) لبناء APK عبر EAS

## طريقة 1: تشغيل تجريبي سريع (Expo Go)

```bash
cd program-
npm install
npx expo start
```

- افتح تطبيق **Expo Go** على الهاتف
- امسح الـ QR Code
- التطبيق هيشتغل (الواجهة كاملة + Model Manager + Router)

> ملاحظة: الـ inference الحقيقي (llama.cpp) شغال على السيرفر حالياً.  
> على الموبايل في Expo Go هيشتغل الـ Mock أو تحتاج Development Build.

## طريقة 2: بناء APK تجريبي (موصى به)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

بعد انتهاء البناء هتاخد رابط تحميل الـ APK تثبته على أي أندرويد.

## طريقة 3: Development Build محلي

```bash
npx expo prebuild
npx expo run:android
```

يحتاج Android Studio + جهاز/Emulator متصل.

## ربط النموذج الحقيقي على الأندرويد لاحقاً

1. أضف مكتبة مثل [`llama.rn`](https://github.com/mybigday/llama.rn)
2. انسخ ملف الـ GGUF إلى تخزين التطبيق
3. استبدل `createModelRuntime()` ليستخدم bindings الموبايل بدل Python bridge

الهيكل الحالي جاهز لهذا الاستبدال بدون تغيير باقي النظام (Router / Manager / UI).

## Package

- Android package: `com.localai.app`
- الاسم: Local AI
- الثيم: Dark / Premium
