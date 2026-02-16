# 📄 server.js - فایل اصلی سرور

## 📋 توضیحات کلی
این فایل نقطه ورودی اصلی (Entry Point) اپلیکیشن بک‌اند است. وظیفه راه‌اندازی سرور Express.js، اتصال به دیتابیس، پیکربندی middleware‌ها و تعریف مسیرهای API را بر عهده دارد.

---

## 📝 تحلیل خط به خط

### خط 1: بارگذاری متغیرهای محیطی
```javascript
require('dotenv').config();
```
**توضیح:** پکیج `dotenv` را فراخوانی می‌کند تا متغیرهای محیطی از فایل `.env` خوانده شوند.
- **چرا؟** برای جداسازی تنظیمات حساس (مثل رمز دیتابیس) از کد
- **نتیجه:** متغیرها در `process.env` قابل دسترسی می‌شوند

---

### خط 2-5: Import کردن وابستگی‌ها
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
```

| پکیج | توضیح |
|------|-------|
| `express` | فریمورک وب Node.js برای ایجاد API |
| `cors` | مدیریت Cross-Origin Resource Sharing برای درخواست‌های cross-domain |
| `path` | ماژول داخلی Node.js برای کار با مسیرهای فایل |
| `connectDB` | تابع اتصال به MongoDB (از فایل config/db.js) |

---

### خط 7-13: Import کردن Route‌ها
```javascript
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const propertyRoutes = require('./routes/properties');
const reservationRoutes = require('./routes/reservations');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const ticketRoutes = require('./routes/tickets');
```

**توضیح:** تمام فایل‌های route را import می‌کند. هر فایل شامل endpoint‌های مربوط به یک بخش است:

| Route | مسئولیت |
|-------|---------|
| `authRoutes` | ثبت‌نام، ورود، احراز هویت |
| `userRoutes` | مدیریت کاربران (فقط ادمین) |
| `propertyRoutes` | مدیریت اقامتگاه‌ها |
| `reservationRoutes` | مدیریت رزروها |
| `notificationRoutes` | نوتیفیکیشن‌ها |
| `reportRoutes` | گزارشات و آمار |
| `ticketRoutes` | تیکت‌های پشتیبانی |

---

### خط 15: ایجاد اپلیکیشن Express
```javascript
const app = express();
```
**توضیح:** یک instance از Express ایجاد می‌کند که کل اپلیکیشن روی آن ساخته می‌شود.

---

### خط 17-18: اتصال به دیتابیس
```javascript
// Connect to database
connectDB();
```
**توضیح:** تابع `connectDB` را فراخوانی می‌کند که به MongoDB متصل می‌شود.

---

### خط 20-26: پیکربندی Middleware‌ها
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

#### CORS Middleware
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
```
- **`origin`**: مشخص می‌کند کدام دامنه‌ها اجازه دسترسی دارند
  - اگر `FRONTEND_URL` تنظیم شده باشد، فقط آن دامنه
  - در غیر این صورت `*` (همه دامنه‌ها)
- **`credentials: true`**: اجازه ارسال کوکی‌ها را می‌دهد

#### JSON Parser
```javascript
app.use(express.json({ limit: '50mb' }));
```
- بدنه درخواست‌های JSON را parse می‌کند
- **`limit: '50mb'`**: حداکثر اندازه payload (برای آپلود تصاویر Base64)

#### URL-Encoded Parser
```javascript
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```
- داده‌های فرم را parse می‌کند
- **`extended: true`**: اجازه آبجکت‌های تودرتو را می‌دهد

---

### خط 28-35: ثبت مسیرهای API
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tickets', ticketRoutes);
```

**توضیح:** هر route به یک prefix (پیشوند) متصل می‌شود:

| Prefix | Route Handler | مثال Endpoint |
|--------|---------------|---------------|
| `/api/auth` | authRoutes | POST /api/auth/login |
| `/api/users` | userRoutes | GET /api/users |
| `/api/properties` | propertyRoutes | GET /api/properties |
| `/api/reservations` | reservationRoutes | POST /api/reservations |
| `/api/notifications` | notificationRoutes | GET /api/notifications |
| `/api/reports` | reportRoutes | GET /api/reports/dashboard |
| `/api/tickets` | ticketRoutes | POST /api/tickets |

---

### خط 37-38: سرو فایل‌های استاتیک
```javascript
app.use(express.static(path.join(__dirname, '../frontend')));
```
**توضیح:** 
- `__dirname`: مسیر فعلی فایل server.js
- `path.join`: مسیر را به پوشه frontend می‌سازد
- فایل‌های HTML, CSS, JS فرانت‌اند به صورت استاتیک سرو می‌شوند

---

### خط 40-46: Health Check Endpoint
```javascript
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'StayLocal API is running',
        timestamp: new Date().toISOString()
    });
});
```
**توضیح:** یک endpoint ساده برای بررسی سلامت سرور.
- **کاربرد:** مانیتورینگ، load balancer، debugging
- **خروجی:** JSON با وضعیت سرور و timestamp

---

### خط 48-53: 404 Handler
```javascript
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
```
**توضیح:** اگر هیچ route دیگری مطابقت نداشت، این handler اجرا می‌شود.
- **Status Code:** 404 (Not Found)
- **کاربرد:** مدیریت URL‌های نامعتبر

---

### خط 55-62: Error Handler
```javascript
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});
```
**توضیح:** Middleware مدیریت خطای سراسری.
- **پارامتر `err`**: آبجکت خطا
- **Status Code:** از خطا می‌خواند یا 500
- خطا را در console لاگ می‌کند

---

### خط 64: تعریف پورت
```javascript
const PORT = process.env.PORT || 5000;
```
**توضیح:** 
- اول از متغیر محیطی `PORT` می‌خواند
- اگر نبود، پیش‌فرض 5000 استفاده می‌شود

---

### خط 66-74: شروع سرور
```javascript
app.listen(PORT, () => {
    console.log(`
🚀 StayLocal Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${PORT}
🌐 API URL: http://localhost:${PORT}/api
📊 Health check: http://localhost:${PORT}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});
```
**توضیح:**
- `app.listen(PORT, callback)`: سرور را روی پورت مشخص شروع می‌کند
- Callback پس از شروع موفق سرور اجرا می‌شود
- پیام خوش‌آمدگویی با اطلاعات سرور چاپ می‌شود

---

### خط 76: Export اپلیکیشن
```javascript
module.exports = app;
```
**توضیح:** اپلیکیشن را export می‌کند برای استفاده در:
- تست‌ها
- ماژول‌های دیگر

---

## 🔄 جریان اجرا

```
1. بارگذاری .env
       ↓
2. Import وابستگی‌ها و routes
       ↓
3. ایجاد app Express
       ↓
4. اتصال به MongoDB
       ↓
5. پیکربندی middlewares (CORS, JSON parser)
       ↓
6. ثبت API routes
       ↓
7. تنظیم فایل‌های استاتیک
       ↓
8. تنظیم error handlers
       ↓
9. شروع سرور روی پورت
```

---

## ⚙️ تنظیمات محیطی مورد نیاز

| متغیر | توضیح | مثال |
|-------|-------|------|
| `PORT` | پورت سرور | `5000` |
| `MONGODB_URI` | آدرس دیتابیس | `mongodb://localhost:27017/staylocal` |
| `FRONTEND_URL` | آدرس فرانت‌اند | `http://localhost:3000` |
| `JWT_SECRET` | کلید رمزنگاری توکن | `your-secret-key` |

---

## 🧪 تست کردن

```bash
# بررسی سلامت سرور
curl http://localhost:5000/api/health

# خروجی:
{
  "success": true,
  "message": "StayLocal API is running",
  "timestamp": "2026-02-16T12:00:00.000Z"
}
```
