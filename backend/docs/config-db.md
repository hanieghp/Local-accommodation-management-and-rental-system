# 📄 config/db.js - اتصال به دیتابیس

## 📋 توضیحات کلی
این فایل مسئول برقراری اتصال به دیتابیس MongoDB است. یک تابع async export می‌کند که در server.js فراخوانی می‌شود.

---

## 📝 کد کامل

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Database connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
```

---

## 📝 تحلیل خط به خط

### خط 1: Import کردن Mongoose
```javascript
const mongoose = require('mongoose');
```
**توضیح:** کتابخانه Mongoose را import می‌کند.
- **Mongoose چیست؟** ODM (Object Document Mapper) برای MongoDB
- **چرا Mongoose؟** Schema-based modeling, validation, middleware

---

### خط 3: تعریف تابع connectDB
```javascript
const connectDB = async () => {
```
**توضیح:** 
- یک arrow function async تعریف می‌کند
- **async:** امکان استفاده از await در داخل تابع
- **چرا async؟** اتصال به دیتابیس یک عملیات asynchronous است

---

### خط 4: شروع بلاک try
```javascript
    try {
```
**توضیح:** شروع بلاک try-catch برای مدیریت خطاها

---

### خط 5: اتصال به MongoDB
```javascript
        const conn = await mongoose.connect(process.env.MONGODB_URI);
```

**توضیح:**
- **`mongoose.connect()`**: متد اتصال به MongoDB
- **`process.env.MONGODB_URI`**: آدرس دیتابیس از متغیر محیطی
- **`await`**: منتظر می‌ماند تا اتصال برقرار شود
- **`conn`**: آبجکت connection برگشتی

**آدرس دیتابیس (MONGODB_URI):**
```
mongodb://localhost:27017/staylocal
```

| بخش | توضیح |
|-----|-------|
| `mongodb://` | پروتکل |
| `localhost` | آدرس سرور |
| `27017` | پورت پیش‌فرض MongoDB |
| `staylocal` | نام دیتابیس |

**مثال‌های دیگر:**
```bash
# Local
mongodb://localhost:27017/staylocal

# با authentication
mongodb://username:password@localhost:27017/staylocal

# MongoDB Atlas (Cloud)
mongodb+srv://username:password@cluster.mongodb.net/staylocal

# Replica Set
mongodb://host1:27017,host2:27017,host3:27017/staylocal?replicaSet=myRS
```

---

### خط 6: لاگ کردن اتصال موفق
```javascript
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
```

**توضیح:**
- پیام موفقیت را در console چاپ می‌کند
- **`conn.connection.host`**: آدرس سرور متصل شده

**خروجی نمونه:**
```
✅ MongoDB Connected: localhost
```

---

### خط 7-9: مدیریت خطا
```javascript
    } catch (error) {
        console.error(`❌ Database connection error: ${error.message}`);
        process.exit(1);
```

**توضیح:**
- اگر اتصال ناموفق بود، این بلاک اجرا می‌شود
- **`error.message`**: پیام خطا را چاپ می‌کند
- **`process.exit(1)`**: برنامه را با کد خطا خاتمه می‌دهد

**کد خروج:**
| کد | معنی |
|----|------|
| `0` | موفق |
| `1` | خطا |

**چرا exit؟** بدون دیتابیس، اپلیکیشن نمی‌تواند کار کند.

---

### خط 12: Export تابع
```javascript
module.exports = connectDB;
```

**توضیح:** تابع را export می‌کند تا در server.js قابل استفاده باشد.

**استفاده در server.js:**
```javascript
const connectDB = require('./config/db');
connectDB();
```

---

## 🔄 جریان اجرا

```
connectDB() فراخوانی شد
        │
        ▼
mongoose.connect() اجرا شد
        │
        ├── موفق ──────────────────┐
        │                          │
        ▼                          ▼
خطا رخ داد              چاپ پیام موفقیت
        │                          │
        ▼                          ▼
چاپ خطا              ادامه اجرای برنامه
        │
        ▼
process.exit(1)
(خاتمه برنامه)
```

---

## ⚙️ تنظیمات اتصال پیشرفته

در نسخه‌های قدیمی‌تر Mongoose، نیاز به تنظیمات بیشتری بود:

```javascript
// نسخه قدیمی (Mongoose < 6)
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});
```

**در نسخه جدید (Mongoose 8):**
این تنظیمات دیگر نیاز نیستند و به صورت پیش‌فرض فعال هستند.

---

## 🔧 گزینه‌های اتصال اختیاری

```javascript
mongoose.connect(process.env.MONGODB_URI, {
    // زمان انتظار برای انتخاب سرور
    serverSelectionTimeoutMS: 5000,
    
    // زمان انتظار برای اتصال socket
    socketTimeoutMS: 45000,
    
    // تعداد اتصالات pool
    maxPoolSize: 10,
    minPoolSize: 5,
    
    // تلاش مجدد در صورت قطعی
    retryWrites: true,
    retryReads: true
});
```

---

## 📊 Event‌های اتصال

```javascript
// اتصال موفق
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
});

// خطای اتصال
mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

// قطع اتصال
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// بستن برنامه
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed');
    process.exit(0);
});
```

---

## 🐛 خطاهای رایج

### 1. MongoDB در حال اجرا نیست
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```
**راه‌حل:** MongoDB را شروع کنید:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 2. آدرس اشتباه
```
MongoParseError: Invalid connection string
```
**راه‌حل:** فرمت MONGODB_URI را بررسی کنید.

### 3. Authentication ناموفق
```
MongoServerError: Authentication failed
```
**راه‌حل:** username و password را بررسی کنید.

### 4. دیتابیس وجود ندارد
MongoDB به صورت خودکار دیتابیس را ایجاد می‌کند، پس این مشکل نیست!

---

## 🧪 تست اتصال

```bash
# بررسی MongoDB
mongosh
> show dbs
> use staylocal
> show collections
```
