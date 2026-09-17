# متجر dr.vaper — السيرفر ولوحة التحكم

مشروع Node.js/Express بسيط يشغّل:
- **المتجر**: `/` (صفحة `public/index.html`)
- **لوحة التحكم**: `/admin` (صفحة `public/admin.html`) — محمية بكلمة مرور
- **API الطلبات**: يستقبل طلبات العملاء من صفحة "بيانات التواصل" ويخزنها في ملف `data/orders.json`

## 1. التشغيل محليًا (اختياري، للتجربة قبل الرفع)

```bash
npm install
npm start
```

بعدها افتح:
- المتجر: http://localhost:3000/
- لوحة التحكم: http://localhost:3000/admin

## 2. كلمة مرور لوحة التحكم

الافتراضي هو: **admin123**

لتغييرها، عرّف متغيّر بيئة اسمه `ADMIN_PASSWORD` (خطوات ريلوي بالأسفل). لو ما عرّفتيش المتغيّر، هيفضل يستخدم `admin123`.

## 3. الرفع على GitHub

```bash
git init
git add .
git commit -m "Initial commit - dr.vaper store + admin"
git branch -M main
git remote add origin <رابط الريبو بتاعك على GitHub>
git push -u origin main
```

## 4. النشر على Railway

1. ادخل على https://railway.app وسجّل دخول.
2. اضغط **New Project** → **Deploy from GitHub repo** → اختر الريبو اللي رفعته.
3. Railway هيكتشف تلقائيًا إنه مشروع Node.js (بيعتمد على `package.json`) وهيشغّل `npm install` ثم `npm start`.
4. من تبويب **Variables** بالمشروع، ضيف متغيّر بيئة (اختياري لكن يُفضّل بشدة):
   - `ADMIN_PASSWORD` = كلمة مرور قوية من اختيارك (بدل admin123)
5. من تبويب **Settings → Networking**، فعّل **Generate Domain** عشان تاخد رابط عام (`xxxx.up.railway.app`).
6. بعد النشر:
   - المتجر: `https://<رابطك>.up.railway.app/`
   - لوحة التحكم: `https://<رابطك>.up.railway.app/admin`

## 5. ملاحظة مهمة عن تخزين البيانات

الطلبات بتتخزن في ملف `data/orders.json` على نفس السيرفر (تخزين بسيط بدون قاعدة بيانات خارجية). على خطة Railway المجانية/الأساسية، نظام الملفات **مؤقت** غالبًا — يعني لو عملت **إعادة نشر (redeploy)** جديدة، ملف الطلبات ممكن يترجع فاضي.

لو عايز تخزين دائم لا يُفقد عند إعادة النشر:
- من تبويب **Volumes** في Railway، أضف **Volume** واربطه بمسار `/app/data` (أو المسار اللي حاططين فيه `DATA_DIR`).
- أو استبدل التخزين لاحقًا بقاعدة بيانات حقيقية (PostgreSQL من Railway نفسه مثلًا) — قولّي لو عايز أعمل الخطوة دي.

## 6. هيكل الملفات

```
.
├── server.js           # السيرفر (Express) + API الطلبات + تسجيل دخول الأدمن
├── package.json
├── .gitignore
├── data/
│   └── (orders.json يتكوّن تلقائيًا أول ما حد يعمل طلب)
└── public/
    ├── index.html      # صفحة المتجر (نفس الصفحة اللي شغالين عليها)
    └── admin.html      # لوحة التحكم (محمية بكلمة مرور)
```
