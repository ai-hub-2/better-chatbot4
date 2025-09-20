# نشر Better Chatbot على Vercel 🚀

## الخطوات البسيطة للنشر

### 1. إعداد قاعدة البيانات (Neon PostgreSQL)
1. اذهب إلى [neon.tech](https://neon.tech)
2. أنشئ حساب جديد أو ادخل
3. أنشئ مشروع جديد
4. انسخ رابط الاتصال (DATABASE_URL)

### 2. النشر على Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. انقر "New Project"
4. اختر المستودع `ai-hub-2/better-chatbot4`
5. اختر البرانش `capy/cap-1-65458384`

### 3. متغيرات البيئة المطلوبة
أضف هذه المتغيرات في إعدادات Vercel:

```bash
# قاعدة البيانات (من Neon)
POSTGRES_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb

# المصادقة (أنشئ مفتاح عشوائي 32 حرف)
BETTER_AUTH_SECRET=your-32-character-random-secret-key

# رابط التطبيق (سيتم تحديثه تلقائياً)
BETTER_AUTH_URL=https://your-app-name.vercel.app

# تشفير مفاتيح API (اختياري - مفتاح عشوائي 32 حرف)
API_KEY_ENCRYPTION_KEY=your-32-character-encryption-key
```

### 4. النشر
- انقر "Deploy"
- انتظر اكتمال البناء (3-5 دقائق)
- سيتم تشغيل المايقريشنز تلقائياً

### 5. التأكد من النجاح
- افتح رابط التطبيق
- سجل حساب جديد
- اذهب للإعدادات → API Keys
- أضف مفاتيح AI providers
- اختبر المحادثة

## مولدات المفاتيح العشوائية

### BETTER_AUTH_SECRET:
```bash
# في Terminal
openssl rand -base64 32
```
أو استخدم: [generate-secret.vercel.app](https://generate-secret.vercel.app)

### API_KEY_ENCRYPTION_KEY:
```bash
# في Terminal  
openssl rand -base64 32 | head -c 32
```

## إعدادات Vercel المتقدمة

### في vercel.json:
- تم تكوين المهلة الزمنية للAPI (60 ثانية)
- منطقة النشر الافتراضية (US East)
- أوامر البناء المحسنة

### للمطورين:
- يمكن ربط نطاق مخصص في إعدادات Vercel
- Analytics تلقائي متاح
- نشر تلقائي عند push للبرانش

## استكشاف الأخطاء

### خطأ قاعدة البيانات:
- تأكد من صحة POSTGRES_URL
- تحقق من أن Neon database active

### خطأ المصادقة:
- تأكد من طول BETTER_AUTH_SECRET (32 حرف)
- تحقق من BETTER_AUTH_URL يطابق رابط Vercel

### خطأ البناء:
- تحقق من Node.js version (18+)
- امسح Build Cache في Vercel

## الدعم
- تحقق من Vercel logs للأخطاء
- راجع Neon dashboard لحالة قاعدة البيانات
- تأكد من جميع Environment Variables