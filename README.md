# دفتر كروت الشاشة (نسخة Firebase)

## التشغيل (مرة واحدة، حوالي 10 دقائق)

1. افتح https://console.firebase.google.com وأنشئ مشروع جديد.
2. Build ← Authentication ← Get started ← فعّل **Email/Password**.
3. Build ← Firestore Database ← Create database ← Production mode.
4. Project settings ← Your apps ← أيقونة الويب `</>` ← سجّل تطبيق، وانسخ `firebaseConfig`.
5. الصق القيم في `public/firebase-config.js` مكان `PASTE...`.
6. من داخل هذا المجلد:

```bash
npm install -g firebase-tools
```
```bash
firebase login
```
```bash
firebase use --add
```
```bash
firebase deploy
```

بيطلعلك رابط مثل `https://اسم-المشروع.web.app`. افتحه عالموبايل، اعمل «حساب جديد»، وبعدين «إضافة إلى الشاشة الرئيسية».

## الملفات
- `public/index.html` الواجهة والحسابات.
- `public/fb.js` الربط مع Firebase (دخول بالإيميل + Firestore).
- `public/parser.js` تحويل الكلام لحقول.
- `firestore.rules` كل مستخدم يقرأ ويكتب كروته فقط (`users/{uid}/cards`).
- بدون إعدادات Firebase التطبيق بيشتغل وبيحفظ على الجهاز فقط.
