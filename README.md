# Better Chatbot - نسخة محسّنة مع إدارة مفاتيح API المستخدمين

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ai-hub-2/better-chatbot4/tree/capy/cap-1-65458384)

## ✨ الميزات الجديدة

- 🔑 **إدارة مفاتيح API شخصية** - المستخدمون يضيفون مفاتيحهم الخاصة
- 🛡️ **أمان محسن** - تشفير المفاتيح في قاعدة البيانات
- 🎯 **دعم 7 مزودين** - OpenAI, Google, Anthropic, xAI, Groq, OpenRouter, Ollama
- 🚀 **نشر تلقائي** - عبر GitHub Actions و Vercel
- 📱 **واجهة محسنة** - UI/UX أفضل لإدارة المفاتيح

## 🚀 النشر السريع (5 دقائق)

### الطريقة الأسرع - Vercel One-Click:
[![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ai-hub-2/better-chatbot4/tree/capy/cap-1-65458384&env=POSTGRES_URL,BETTER_AUTH_SECRET,BETTER_AUTH_URL&envDescription=Database%20URL,%20Auth%20Secret,%20and%20App%20URL&envLink=https://github.com/ai-hub-2/better-chatbot4/blob/capy/cap-1-65458384/DEPLOYMENT_VERCEL.md)

### المتطلبات:
1. **قاعدة بيانات:** [Neon PostgreSQL](https://neon.tech) (مجاناً)
2. **المفاتيح:** راجع `SETUP_DATABASE.md`
3. **المتغيرات البيئية:** راجع `DEPLOYMENT_VERCEL.md`

## 📚 الأدلة المفصلة

- 📖 **[دليل النشر](DEPLOYMENT_VERCEL.md)** - خطوات النشر على Vercel
- 🗄️ **[إعداد قاعدة البيانات](SETUP_DATABASE.md)** - إعداد Neon PostgreSQL  
- 🔧 **[حل المشاكل](TROUBLESHOOTING.md)** - حلول للمشاكل الشائعة
- 🔑 **[دليل المستخدم](USER_API_KEYS_GUIDE.md)** - كيفية استخدام النظام

## 🛠️ التطوير المحلي

```bash
# استنساخ المستودع
git clone https://github.com/ai-hub-2/better-chatbot4.git
cd better-chatbot4
git checkout capy/cap-1-65458384

# تثبيت المتطلبات
pnpm install

# إعداد البيئة
cp .env.example .env
# عدّل .env بقيم قاعدة البيانات والمفاتيح

# تشغيل قاعدة البيانات (Docker)
pnpm docker:pg

# تشغيل المايقريشن
pnpm db:push

# تشغيل التطبيق
pnpm dev
```

## 🌐 متغيرات البيئة المطلوبة

```bash
# قاعدة البيانات (إجباري)
POSTGRES_URL=postgresql://username:password@host/database

# المصادقة (إجباري)  
BETTER_AUTH_SECRET=your-32-character-secret
BETTER_AUTH_URL=https://your-app.vercel.app

# تشفير مفاتيح API (اختياري)
API_KEY_ENCRYPTION_KEY=your-32-character-key
```

## 📊 البنية التقنية

- **Frontend:** Next.js 15 + React 19 + TailwindCSS
- **Backend:** Next.js API Routes + TypeScript
- **Database:** PostgreSQL (Neon)  
- **Auth:** Better Auth
- **AI Providers:** OpenAI, Google, Anthropic, xAI, Groq, OpenRouter, Ollama
- **Deployment:** Vercel + GitHub Actions

## 🔒 الأمان

- تشفير مفاتيح API في قاعدة البيانات
- CSRF protection
- Session management
- Environment variables للبيانات الحساسة

## 🤝 المساهمة

1. Fork المستودع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. اعمل commit (`git commit -m 'Add amazing feature'`)
4. ادفع للبرانش (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## 📝 الترخيص

MIT License - راجع [LICENSE](LICENSE) للتفاصيل

## 🆘 الدعم

- 📖 راجع الأدلة في المستودع
- 🐛 أبلغ عن الأخطاء عبر Issues
- 💬 ناقش الأفكار في Discussions

---

تم تطويره بـ ❤️ للمجتمع العربي