# دليل حل مشاكل نشر Better Chatbot على Vercel 🔧

## المشاكل الشائعة والحلول

### 1. مشاكل البناء (Build Errors)

#### خطأ: "Command failed with exit code 1"
```bash
# الحل:
- تحقق من Node.js version في vercel.json
- امسح Build Cache في Vercel Dashboard
- تأكد من pnpm.lock.yaml موجود
```

#### خطأ: "Cannot resolve module"
```bash
# أضف في package.json:
"engines": {
  "node": ">=18.0.0"
}
```

#### خطأ: TypeScript errors
```bash
# في vercel.json أضف:
{
  "buildCommand": "pnpm build --no-lint"
}
```

### 2. مشاكل قاعدة البيانات

#### خطأ: "connect ECONNREFUSED"
- تأكد من POSTGRES_URL صحيح
- تحقق من Neon database في وضع Active
- تأكد من عدم انتهاء صلاحية قاعدة البيانات

#### خطأ: "relation does not exist"
```bash
# قم بتشغيل المايقريشن يدوياً:
# في Vercel Functions Console
pnpm db:push
```

### 3. مشاكل المصادقة

#### خطأ: "Invalid session"
- تحقق من BETTER_AUTH_SECRET (32 حرف بالضبط)
- تأكد من BETTER_AUTH_URL يطابق رابط Vercel

#### خطأ: "CSRF token mismatch"
```bash
# أضف في Environment Variables:
BETTER_AUTH_URL=https://your-app.vercel.app
```

### 4. مشاكل Environment Variables

#### المتغيرات غير معترف بها:
- تأكد من إضافة جميع المتغيرات في Vercel Dashboard
- تحقق من عدم وجود مسافات إضافية
- أعد النشر بعد إضافة متغيرات جديدة

### 5. مشاكل الذاكرة والوقت

#### خطأ: "Function timeout"
```json
// في vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

#### خطأ: "Out of memory"
```bash
# خفف الـ dependencies:
pnpm install --production
```

## خطوات التشخيص السريع

### الخطوة 1: تحقق من Vercel Logs
1. اذهب لـ Vercel Dashboard
2. انقر على مشروعك
3. انقر "Functions" → "View Function Logs"
4. ابحث عن الأخطاء الحمراء

### الخطوة 2: تحقق من البيئة
```bash
# المتغيرات المطلوبة:
POSTGRES_URL ✓
BETTER_AUTH_SECRET ✓ 
BETTER_AUTH_URL ✓
```

### الخطوة 3: اختبار قاعدة البيانات
- اذهب لـ Neon Dashboard
- تحقق من حالة Database (Active)
- اختبر الاتصال من Connection String

### الخطوة 4: إعادة البناء النظيف
1. في Vercel Dashboard → Settings → Git
2. انقر "Redeploy" مع "Clear Build Cache"

## حلول متقدمة

### إذا فشل كل شيء:
```bash
# 1. أنشئ مشروع Vercel جديد
# 2. استخدم Node.js 18
# 3. أضف المتغيرات واحد تلو الآخر
# 4. انشر مرحلياً
```

### للتطبيقات الكبيرة:
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["src/**"]
      }
    }
  ]
}
```

## اتصل بي مع هذه المعلومات:

1. **رسالة الخطأ الكاملة**
2. **في أي مرحلة فشل** (Build/Runtime/Database)
3. **صورة من Vercel Logs**
4. **المتغيرات المضافة** (بدون القيم الحساسة)

## أدوات مفيدة:

- **Vercel CLI**: `vercel logs` للوقت الحقيقي
- **Database Test**: `psql $POSTGRES_URL` 
- **Build Local**: `pnpm build` للاختبار المحلي

---
**💡 نصيحة:** ابدئي بمشروع بسيط أولاً، ثم أضيفي الميزات تدريجياً!