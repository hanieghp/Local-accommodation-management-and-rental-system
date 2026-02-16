# 📄 package.json - فایل پیکربندی پروژه

## 📋 توضیحات کلی
این فایل تنظیمات اصلی پروژه Node.js را شامل می‌شود: اطلاعات پروژه، اسکریپت‌های اجرا و لیست وابستگی‌ها.

---

## 📝 تحلیل خط به خط

### اطلاعات پایه پروژه
```json
{
  "name": "staylocal-backend",
  "version": "1.0.0",
  "description": "Backend API for StayLocal accommodation rental system",
  "main": "server.js",
```

| فیلد | مقدار | توضیح |
|------|-------|-------|
| `name` | `staylocal-backend` | نام پکیج (باید یکتا باشد) |
| `version` | `1.0.0` | نسخه پروژه (Semantic Versioning) |
| `description` | `Backend API for...` | توضیح کوتاه پروژه |
| `main` | `server.js` | فایل اصلی اجرا |

---

### اسکریپت‌های NPM
```json
"scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
}
```

| اسکریپت | دستور | توضیح |
|---------|-------|-------|
| `start` | `node server.js` | اجرای production سرور |
| `dev` | `nodemon server.js` | اجرای development با auto-reload |

**نحوه استفاده:**
```bash
npm start     # برای production
npm run dev   # برای development (با nodemon)
```

---

## 📦 وابستگی‌های اصلی (dependencies)

```json
"dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "pdfkit": "^0.17.2"
}
```

### 🔐 bcryptjs - v2.4.3
**کاربرد:** هش کردن رمز عبور

```javascript
// مثال استفاده
const bcrypt = require('bcryptjs');

// هش کردن رمز
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash('password123', salt);

// مقایسه رمز
const isMatch = await bcrypt.compare('password123', hashedPassword);
```

**چرا bcryptjs؟**
- نسخه JavaScript خالص (نیاز به compile ندارد)
- سازگار با همه سیستم‌عامل‌ها
- الگوریتم امن برای هش رمز

---

### 🌐 cors - v2.8.5
**کاربرد:** مدیریت Cross-Origin Resource Sharing

```javascript
// مثال استفاده
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
```

**چرا CORS؟**
- اجازه درخواست از دامنه‌های دیگر
- امنیت در ارتباط بین frontend و backend
- کنترل دقیق روی headers و methods

---

### ⚙️ dotenv - v16.3.1
**کاربرد:** خواندن متغیرهای محیطی از فایل .env

```javascript
// مثال استفاده
require('dotenv').config();
console.log(process.env.MONGODB_URI);
```

**چرا dotenv؟**
- جداسازی تنظیمات از کد
- امنیت اطلاعات حساس
- راحتی در محیط‌های مختلف (dev/prod)

---

### 🚀 express - v4.18.2
**کاربرد:** فریمورک اصلی وب

```javascript
// مثال استفاده
const express = require('express');
const app = express();

app.get('/api/test', (req, res) => {
    res.json({ message: 'Hello' });
});

app.listen(5000);
```

**ویژگی‌ها:**
- Routing قدرتمند
- Middleware سیستم
- سبک و سریع
- اکوسیستم بزرگ

---

### ✅ express-validator - v7.0.1
**کاربرد:** اعتبارسنجی ورودی‌ها

```javascript
// مثال استفاده
const { body, validationResult } = require('express-validator');

app.post('/register', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Too short')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // ادامه پردازش...
});
```

**ویژگی‌ها:**
- اعتبارسنجی body, query, params
- پیام‌های خطای سفارشی
- sanitization داده‌ها
- chainable validators

---

### 🔑 jsonwebtoken - v9.0.2
**کاربرد:** ایجاد و تأیید JWT توکن

```javascript
// مثال استفاده
const jwt = require('jsonwebtoken');

// ایجاد توکن
const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

// تأیید توکن
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log(decoded.id); // ID کاربر
```

**ویژگی‌ها:**
- احراز هویت stateless
- امن و سبک
- قابل استفاده در هر زبان

---

### 🍃 mongoose - v8.0.0
**کاربرد:** ODM برای MongoDB

```javascript
// مثال استفاده
const mongoose = require('mongoose');

// تعریف Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true }
});

// ایجاد Model
const User = mongoose.model('User', userSchema);

// استفاده
const user = await User.create({ name: 'Ali', email: 'ali@test.com' });
const users = await User.find({ name: 'Ali' });
```

**ویژگی‌ها:**
- Schema Definition
- Validation
- Middleware (hooks)
- Query Builder
- Population (join)

---

### 📄 pdfkit - v0.17.2
**کاربرد:** تولید فایل PDF

```javascript
// مثال استفاده
const PDFDocument = require('pdfkit');

const doc = new PDFDocument();

doc.fontSize(25).text('Hello World!');
doc.text('This is a PDF document.');

doc.end();
```

**ویژگی‌ها:**
- متن با فونت‌های مختلف
- تصاویر
- گرافیک و شکل‌ها
- جداول
- لینک‌ها

---

## 🛠️ وابستگی‌های توسعه (devDependencies)

```json
"devDependencies": {
    "nodemon": "^3.0.1"
}
```

### 🔄 nodemon - v3.0.1
**کاربرد:** Auto-restart سرور هنگام تغییر فایل‌ها

```bash
# اجرا
nodemon server.js
```

**ویژگی‌ها:**
- تشخیص خودکار تغییرات
- restart سریع
- پیکربندی با nodemon.json
- ignore کردن فایل‌ها

---

## 📊 نمودار وابستگی‌ها

```
                    ┌──────────────┐
                    │   Express    │
                    │  (Framework) │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│     CORS      │  │   Mongoose    │  │   PDFKit      │
│ (Cross-Origin)│  │  (Database)   │  │    (PDF)      │
└───────────────┘  └───────────────┘  └───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   bcryptjs    │  │     JWT       │  │ express-      │
│  (Password)   │  │   (Auth)      │  │ validator     │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   dotenv    │
                    │   (Config)  │
                    └─────────────┘
```

---

## 🔧 نصب وابستگی‌ها

```bash
# نصب همه وابستگی‌ها
npm install

# نصب فقط production
npm install --production

# نصب پکیج جدید
npm install package-name

# نصب پکیج dev
npm install package-name --save-dev
```

---

## 📁 فایل‌های تولید شده

```
node_modules/        # پکیج‌های نصب شده
package-lock.json    # نسخه دقیق وابستگی‌ها
```
