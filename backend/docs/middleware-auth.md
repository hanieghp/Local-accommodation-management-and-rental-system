# 📄 middleware/auth.js - میان‌افزار احراز هویت

## 📋 توضیحات کلی
این فایل شامل دو middleware اصلی برای مدیریت دسترسی است:
1. **protect**: بررسی توکن JWT و احراز هویت کاربر
2. **authorize**: بررسی نقش کاربر برای دسترسی به منابع

---

## 📝 کد کامل

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - Invalid token'
        });
    }
};

// Authorize by role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
```

---

## 📝 تحلیل خط به خط

### خط 1-2: Import وابستگی‌ها
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
```

| Import | توضیح |
|--------|-------|
| `jwt` | کتابخانه برای کار با JSON Web Tokens |
| `User` | مدل کاربر برای جستجو در دیتابیس |

---

## 🛡️ Middleware: protect

### خط 4-6: تعریف تابع و متغیر token
```javascript
const protect = async (req, res, next) => {
    let token;
```

**توضیح:**
- **async:** برای استفاده از await در داخل
- **پارامترها:**
  - `req`: آبجکت درخواست
  - `res`: آبجکت پاسخ
  - `next`: تابع برای ادامه به middleware بعدی
- **`let token`**: متغیر برای ذخیره توکن

---

### خط 8-10: استخراج توکن از Header
```javascript
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
```

**توضیح:**

**1. بررسی وجود Authorization header:**
```javascript
req.headers.authorization
```

**2. بررسی شروع با 'Bearer':**
```javascript
req.headers.authorization.startsWith('Bearer')
```

**3. استخراج توکن:**
```javascript
req.headers.authorization.split(' ')[1]
```

**فرمت Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Index | مقدار |
|-------|-------|
| `[0]` | `Bearer` |
| `[1]` | `eyJhbGciOi...` (توکن) |

---

### خط 12-17: بررسی عدم وجود توکن
```javascript
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - No token provided'
        });
    }
```

**توضیح:**
- **Status 401:** Unauthorized
- اگر توکن وجود نداشته باشد، درخواست رد می‌شود
- **return:** از ادامه اجرا جلوگیری می‌کند

---

### خط 19-20: تأیید و decode کردن توکن
```javascript
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**توضیح:**

**`jwt.verify(token, secret)`:**
- توکن را تأیید می‌کند
- اگر معتبر باشد، payload را برمی‌گرداند
- اگر نامعتبر باشد، خطا throw می‌کند

**payload توکن:**
```javascript
{
    id: "65abc123...",    // ID کاربر
    iat: 1707091200,      // زمان صدور
    exp: 1707696000       // زمان انقضا
}
```

**`process.env.JWT_SECRET`:**
کلید رمزنگاری که در .env تعریف شده

---

### خط 21: یافتن کاربر در دیتابیس
```javascript
        req.user = await User.findById(decoded.id).select('-password');
```

**توضیح:**
- **`User.findById(decoded.id)`**: کاربر را با ID یافته شده پیدا می‌کند
- **`.select('-password')`**: فیلد password را حذف می‌کند (امنیت)
- **`req.user = ...`**: کاربر را به request اضافه می‌کند

**چرا به req اضافه می‌کنیم؟**
برای دسترسی در route handler‌های بعدی:
```javascript
router.get('/profile', protect, (req, res) => {
    console.log(req.user.name); // دسترسی به کاربر فعلی
});
```

---

### خط 23-28: بررسی وجود کاربر
```javascript
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
```

**توضیح:**
- اگر کاربر با این ID وجود نداشته باشد (مثلاً حذف شده)
- درخواست رد می‌شود

---

### خط 30-35: بررسی فعال بودن حساب
```javascript
        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
```

**توضیح:**
- اگر ادمین کاربر را غیرفعال کرده باشد
- حتی با توکن معتبر، دسترسی رد می‌شود

---

### خط 37: ادامه به middleware بعدی
```javascript
        next();
```

**توضیح:**
- اگر همه چک‌ها موفق بود، `next()` فراخوانی می‌شود
- کنترل به middleware یا route handler بعدی می‌رود

---

### خط 38-43: مدیریت خطای توکن
```javascript
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - Invalid token'
        });
    }
```

**توضیح:**
خطاهای احتمالی `jwt.verify()`:

| خطا | توضیح |
|-----|-------|
| `TokenExpiredError` | توکن منقضی شده |
| `JsonWebTokenError` | توکن نامعتبر/دستکاری شده |
| `NotBeforeError` | توکن هنوز فعال نشده |

---

## 🎭 Middleware: authorize

### خط 47-48: تعریف تابع authorize
```javascript
const authorize = (...roles) => {
    return (req, res, next) => {
```

**توضیح:**
- **`...roles`**: Rest parameter - آرایه‌ای از نقش‌های مجاز
- **Higher-order function**: تابعی که تابع برمی‌گرداند

**مثال استفاده:**
```javascript
// فقط admin
router.get('/users', protect, authorize('admin'), getUsers);

// admin یا host
router.post('/property', protect, authorize('admin', 'host'), createProperty);
```

---

### خط 49-54: بررسی نقش کاربر
```javascript
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }
```

**توضیح:**
- **`roles.includes(req.user.role)`**: آیا نقش کاربر در لیست مجاز است؟
- **Status 403:** Forbidden (احراز هویت شده ولی مجاز نیست)

**تفاوت 401 و 403:**
| Status | معنی | مثال |
|--------|------|------|
| 401 | Unauthorized | توکن ندارید |
| 403 | Forbidden | توکن دارید ولی admin نیستید |

---

### خط 55: ادامه اجرا
```javascript
        next();
```

**توضیح:** اگر نقش مجاز بود، به handler بعدی می‌رود.

---

### خط 59: Export توابع
```javascript
module.exports = { protect, authorize };
```

**استفاده:**
```javascript
const { protect, authorize } = require('../middleware/auth');
```

---

## 🔄 جریان اجرا

```
درخواست به Protected Route
            │
            ▼
    ┌───────────────┐
    │   protect()   │
    └───────┬───────┘
            │
            ▼
  آیا Authorization header دارد؟
      │           │
     نه          بله
      │           │
      ▼           ▼
   401 Error   استخراج توکن
                  │
                  ▼
          jwt.verify(token)
            │         │
          خطا      موفق
            │         │
            ▼         ▼
       401 Error   یافتن کاربر
                      │
                      ▼
                کاربر موجود؟
                │         │
               نه        بله
                │         │
                ▼         ▼
           401 Error   کاربر فعال؟
                        │         │
                       نه        بله
                        │         │
                        ▼         ▼
                   401 Error   req.user = user
                                    │
                                    ▼
                              ┌─────────────┐
                              │ authorize() │
                              └──────┬──────┘
                                     │
                                     ▼
                            نقش در لیست مجاز؟
                              │         │
                             نه        بله
                              │         │
                              ▼         ▼
                         403 Error   next()
                                        │
                                        ▼
                                  Route Handler
```

---

## 🧪 مثال‌های استفاده

### Route عمومی (بدون auth)
```javascript
router.get('/properties', getAllProperties);
```

### Route نیاز به login
```javascript
router.get('/profile', protect, getProfile);
```

### Route فقط برای admin
```javascript
router.get('/users', protect, authorize('admin'), getUsers);
```

### Route برای چند نقش
```javascript
router.post('/property', protect, authorize('host', 'admin'), createProperty);
```

---

## 📊 ساختار توکن JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjY1YWJjMTIzIiwiaWF0IjoxNzA3MDkxMjAwLCJleHAiOjE3MDc2OTYwMDB9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

| بخش | توضیح |
|-----|-------|
| Header | `{"alg":"HS256","typ":"JWT"}` |
| Payload | `{"id":"65abc123","iat":...,"exp":...}` |
| Signature | امضای دیجیتال |

---

## ⚠️ نکات امنیتی

1. **JWT_SECRET باید قوی باشد** (حداقل 32 کاراکتر)
2. **هرگز توکن را در URL قرار ندهید**
3. **در Production از HTTPS استفاده کنید**
4. **زمان انقضای مناسب تنظیم کنید**
