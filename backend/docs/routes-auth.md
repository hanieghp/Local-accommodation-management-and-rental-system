# 📄 routes/auth.js - مسیرهای احراز هویت

## 📋 توضیحات کلی
این فایل تمام endpoint‌های مربوط به احراز هویت کاربران را تعریف می‌کند: ثبت‌نام، ورود، پروفایل، تغییر رمز و فراموشی رمز عبور.

---

## 📊 خلاصه Endpoint‌ها

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| POST | `/api/auth/register` | Public | ثبت‌نام کاربر جدید |
| POST | `/api/auth/login` | Public | ورود به سیستم |
| GET | `/api/auth/me` | Private | دریافت اطلاعات کاربر فعلی |
| PUT | `/api/auth/updateprofile` | Private | بروزرسانی پروفایل |
| PUT | `/api/auth/changepassword` | Private | تغییر رمز عبور |
| POST | `/api/auth/forgotpassword` | Public | فراموشی رمز عبور |

---

## 📝 تحلیل خط به خط

### خطوط 1-6: Import‌ها

```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
```

| خط | ماژول | کاربرد |
|----|-------|--------|
| 1 | express | فریم‌ورک وب |
| 2 | Router | ایجاد router مستقل |
| 3 | jsonwebtoken | تولید و verify توکن JWT |
| 4 | express-validator | اعتبارسنجی ورودی‌ها |
| 5 | User | مدل کاربر |
| 6 | protect | middleware احراز هویت |

---

### خطوط 8-13: تابع تولید توکن

```javascript
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};
```

**توضیح:**
- `jwt.sign()` توکن JWT تولید می‌کند
- `{ id }` → payload توکن (شناسه کاربر)
- `process.env.JWT_SECRET` → کلید امضا
- `expiresIn: '7d'` → انقضا 7 روزه

**مثال خروجی:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YWJjMTIzLi4uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQ2NzIwMDB9.signature
```

---

## 🔐 Endpoint 1: ثبت‌نام

### مسیر: `POST /api/auth/register`

```javascript
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['traveler', 'host']).withMessage('Invalid role')
], async (req, res) => {
    // ...
});
```

### Validation Rules:

| فیلد | قاعده | پیام خطا |
|------|-------|----------|
| name | trim + notEmpty | Name is required |
| email | isEmail | Please provide a valid email |
| password | isLength(min: 6) | Password must be at least 6 characters |
| role | optional, isIn(['traveler', 'host']) | Invalid role |

### جریان اجرا:

```
درخواست POST /register
         │
         ▼
┌─────────────────────┐
│ Validation Check    │
└─────────┬───────────┘
          │ خطا
          ├──────────► 400: errors.array()
          │
          ▼ موفق
┌─────────────────────┐
│ Check user exists   │
└─────────┬───────────┘
          │ وجود دارد
          ├──────────► 400: User already exists
          │
          ▼ وجود ندارد
┌─────────────────────┐
│ User.create()       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ generateToken()     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ 201: { user, token }│
└─────────────────────┘
```

### مثال Request:
```http
POST /api/auth/register
Content-Type: application/json

{
    "name": "علی احمدی",
    "email": "ali@example.com",
    "password": "123456",
    "phone": "09123456789",
    "role": "host"
}
```

### مثال Response (201):
```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": "65abc123...",
            "name": "علی احمدی",
            "email": "ali@example.com",
            "role": "host"
        },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

---

## 🔐 Endpoint 2: ورود

### مسیر: `POST /api/auth/login`

```javascript
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    // ...
});
```

### جریان اجرا:

```
POST /login
    │
    ▼
┌─────────────────────────┐
│ Validation Check        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ User.findOne({ email }) │
│ .select('+password')    │◄── رمز عبور را هم می‌گیرد
└─────────┬───────────────┘
          │ کاربر یافت نشد
          ├──────────────────► 401: Invalid credentials
          │
          ▼ کاربر یافت شد
┌─────────────────────────┐
│ Check isActive          │
└─────────┬───────────────┘
          │ غیرفعال
          ├──────────────────► 401: Account is deactivated
          │
          ▼ فعال
┌─────────────────────────┐
│ user.matchPassword()    │◄── مقایسه bcrypt
└─────────┬───────────────┘
          │ اشتباه
          ├──────────────────► 401: Invalid credentials
          │
          ▼ صحیح
┌─────────────────────────┐
│ generateToken()         │
│ Return user + token     │
└─────────────────────────┘
```

**نکته امنیتی:**
- پیام خطا برای "ایمیل اشتباه" و "رمز اشتباه" یکسان است: `Invalid credentials`
- این از حملات enumeration جلوگیری می‌کند

### مثال Request:
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "ali@example.com",
    "password": "123456"
}
```

### مثال Response (200):
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "65abc123...",
            "name": "علی احمدی",
            "email": "ali@example.com",
            "role": "host",
            "avatar": "data:image/jpeg;base64,..."
        },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

---

## 👤 Endpoint 3: دریافت پروفایل

### مسیر: `GET /api/auth/me`

```javascript
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
```

**توضیح:**
- `protect` middleware توکن را verify می‌کند
- `req.user.id` شناسه کاربر از توکن است
- تمام اطلاعات کاربر برگردانده می‌شود

### مثال Request:
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### مثال Response:
```json
{
    "success": true,
    "data": {
        "_id": "65abc123...",
        "name": "علی احمدی",
        "email": "ali@example.com",
        "phone": "09123456789",
        "role": "host",
        "avatar": "...",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z"
    }
}
```

---

## ✏️ Endpoint 4: بروزرسانی پروفایل

### مسیر: `PUT /api/auth/updateprofile`

```javascript
router.put('/updateprofile', protect, [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().trim()
], async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (avatar) updateFields.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateFields,
            { new: true, runValidators: true }
        );
        // ...
    }
});
```

**توضیح:**
- فقط فیلدهای ارسال شده بروز می‌شوند
- `{ new: true }` → document جدید برگردانده شود
- `runValidators: true` → validatorها اجرا شوند

### مثال Request:
```http
PUT /api/auth/updateprofile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "name": "علی احمدی زاده",
    "phone": "09121234567",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

## 🔑 Endpoint 5: تغییر رمز عبور

### مسیر: `PUT /api/auth/changepassword`

```javascript
router.put('/changepassword', protect, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    // ...
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    user.password = newPassword;
    await user.save();  // Hash در pre save middleware
});
```

### مثال Request:
```http
PUT /api/auth/changepassword
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "currentPassword": "oldpass123",
    "newPassword": "newpass456"
}
```

---

## 🔓 Endpoint 6: فراموشی رمز عبور

### مسیر: `POST /api/auth/forgotpassword`

```javascript
router.post('/forgotpassword', [
    body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    // ...
    
    // Generate a random password
    const newPassword = Math.random().toString(36).slice(-8) + 
                        Math.random().toString(36).slice(-4).toUpperCase();
    
    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Password reset successful!',
        newPassword: newPassword  // فقط برای دمو - در production حذف شود!
    });
});
```

**توضیح:**
- رمز جدید تصادفی تولید می‌شود: `8 حرف کوچک + 4 حرف بزرگ`
- مثال: `a3k9m2x1YWQP`
- در production باید ایمیل ارسال شود

### مثال Request:
```http
POST /api/auth/forgotpassword
Content-Type: application/json

{
    "email": "ali@example.com"
}
```

### مثال Response:
```json
{
    "success": true,
    "message": "Password reset successful!",
    "newPassword": "a3k9m2x1YWQP"
}
```

---

## 🔒 نکات امنیتی

1. **Password Hashing:** رمز عبور هرگز plain text ذخیره نمی‌شود
2. **JWT Expiration:** توکن‌ها تاریخ انقضا دارند
3. **select('+password'):** رمز عبور به طور پیش‌فرض در query‌ها نیست
4. **Generic Error Messages:** پیام خطای یکسان برای ایمیل/رمز اشتباه
5. **isActive Check:** کاربران غیرفعال نمی‌توانند وارد شوند

---

## 📁 Export

```javascript
module.exports = router;
```

این router در `server.js` با prefix `/api/auth` استفاده می‌شود.
