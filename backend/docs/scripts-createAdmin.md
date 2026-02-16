# 📄 scripts/createAdmin.js - اسکریپت ایجاد ادمین

## 📋 توضیحات کلی
این اسکریپت برای ایجاد اولین کاربر ادمین در سیستم استفاده می‌شود. مستقل از سرور اجرا می‌شود.

---

## 🚀 نحوه اجرا

```powershell
cd backend/scripts
node createAdmin.js
```

---

## 📝 تحلیل خط به خط

### خط 1: بارگذاری محیط

```javascript
require('dotenv').config({ path: '../.env' });
```

**توضیح:**
- فایل `.env` را از پوشه بالاتر (`backend/`) بارگذاری می‌کند
- تنظیمات `MONGODB_URI` و غیره از آنجا خوانده می‌شود

---

### خطوط 2-3: Import ماژول‌ها

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
```

| ماژول | کاربرد |
|-------|--------|
| mongoose | اتصال به MongoDB |
| bcryptjs | هش کردن رمز عبور |

---

### خطوط 5-11: اتصال به دیتابیس

```javascript
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/staylocal')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
```

**توضیح:**
- از متغیر محیطی `MONGODB_URI` استفاده می‌کند
- اگر نبود، به `localhost` متصل می‌شود
- در صورت خطا، با کد 1 خارج می‌شود

---

### خطوط 13-24: تعریف Schema محلی

```javascript
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, enum: ['traveler', 'host', 'admin'], default: 'traveler' },
    avatar: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
```

**چرا Schema محلی؟**
- این اسکریپت مستقل است
- نیازی به import کردن مدل اصلی ندارد
- سادگی و استقلال

---

### خطوط 26-63: تابع ایجاد ادمین

```javascript
async function createAdmin() {
    try {
        // بررسی وجود ادمین
        const existingAdmin = await User.findOne({ email: 'admin@staylocal.com' });
        
        if (existingAdmin) {
            console.log('Admin already exists!');
            console.log('Email: admin@staylocal.com');
            console.log('Password: admin123');
            process.exit(0);
        }

        // هش کردن رمز عبور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // ایجاد کاربر ادمین
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@staylocal.com',
            password: hashedPassword,
            phone: '+1234567890',
            role: 'admin',
            avatar: 'default-avatar.png',
            isActive: true
        });

        console.log('✅ Admin account created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email: admin@staylocal.com');
        console.log('Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
```

---

## 🔐 مراحل هش کردن رمز عبور

```javascript
// 1. تولید salt با 10 راند
const salt = await bcrypt.genSalt(10);
// salt = "$2a$10$N9qo8uLOickgx2ZMRZoMye"

// 2. هش کردن با salt
const hashedPassword = await bcrypt.hash('admin123', salt);
// hashedPassword = "$2a$10$N9qo8uLOickgx2ZMRZoMyehP/X1p5n0kfLNRMCDQzL8kzI4sS0pRy"
```

**چرا 10 راند؟**
- تعادل بین امنیت و سرعت
- هر راند، زمان هک را دو برابر می‌کند
- 10 راند ≈ 100ms برای هش

---

## 📤 خروجی اسکریپت

### اگر ادمین وجود نداشته باشد:
```
MongoDB Connected
✅ Admin account created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: admin@staylocal.com
Password: admin123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Please change the password after first login!
```

### اگر ادمین از قبل وجود داشته باشد:
```
MongoDB Connected
Admin already exists!
Email: admin@staylocal.com
Password: admin123
```

---

## 🔄 جریان اجرا

```
┌─────────────────────────────────┐
│ اجرای node createAdmin.js      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ بارگذاری .env                   │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ اتصال به MongoDB               │
└─────────────┬───────────────────┘
              │ خطا
              ├────────────► exit(1)
              │
              ▼ موفق
┌─────────────────────────────────┐
│ جستجوی ادمین موجود             │
└─────────────┬───────────────────┘
              │
     ┌────────┴────────┐
     │                 │
     ▼ وجود دارد      ▼ وجود ندارد
┌──────────┐    ┌──────────────────┐
│ نمایش    │    │ هش رمز + ایجاد   │
│ اطلاعات │    │ کاربر جدید      │
└────┬─────┘    └────────┬─────────┘
     │                   │
     └─────────┬─────────┘
               ▼
         exit(0)
```

---

## ⚠️ نکات امنیتی

1. **رمز پیش‌فرض:** `admin123` فقط برای راه‌اندازی اولیه
2. **تغییر رمز:** حتماً بعد از اولین ورود تغییر دهید
3. **Production:** در محیط واقعی از رمز قوی‌تر استفاده کنید
