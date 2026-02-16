# 📄 routes/users.js - مسیرهای مدیریت کاربران

## 📋 توضیحات کلی
این فایل endpoint‌های مدیریت کاربران را تعریف می‌کند. **تمام مسیرها فقط برای Admin** هستند و شامل CRUD کاربران، تغییر نقش و وضعیت می‌شود.

---

## 📊 خلاصه Endpoint‌ها

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/api/users` | Admin | لیست همه کاربران |
| GET | `/api/users/:id` | Admin | دریافت یک کاربر |
| PUT | `/api/users/:id/role` | Admin | تغییر نقش کاربر |
| PUT | `/api/users/:id/status` | Admin | فعال/غیرفعال کردن |
| DELETE | `/api/users/:id` | Admin | حذف کاربر |

---

## 📝 تحلیل خط به خط

### خطوط 1-4: Import‌ها

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
```

| ماژول | کاربرد |
|-------|--------|
| express | فریم‌ورک وب |
| User | مدل کاربر |
| protect | بررسی توکن JWT |
| authorize | بررسی نقش کاربر |

---

## 📋 Endpoint 1: لیست کاربران

### مسیر: `GET /api/users`

```javascript
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        
        // Filter by role
        if (req.query.role) {
            query.role = req.query.role;
        }

        // Filter by status
        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === 'true';
        }

        const users = await User.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        // ...
    }
});
```

### Middleware Chain:

```
Request → protect → authorize('admin') → Handler
           │              │
           │              └── فقط admin‌ها
           └── فقط کاربران لاگین شده
```

### Query Parameters:

| پارامتر | نوع | پیش‌فرض | توضیح |
|---------|-----|---------|-------|
| page | Number | 1 | شماره صفحه |
| limit | Number | 10 | تعداد در هر صفحه |
| role | String | - | فیلتر نقش (traveler/host/admin) |
| isActive | Boolean | - | فیلتر وضعیت |

### محاسبه Pagination:

```javascript
// صفحه 3 با 10 آیتم در صفحه
page = 3
limit = 10
skip = (3 - 1) * 10 = 20

// پس از 20 رکورد اول skip می‌کند
// و 10 رکورد بعدی را می‌گیرد (رکوردهای 21-30)
```

### مثال Request:
```http
GET /api/users?page=1&limit=10&role=host&isActive=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### مثال Response:
```json
{
    "success": true,
    "data": [
        {
            "_id": "65abc123...",
            "name": "علی احمدی",
            "email": "ali@example.com",
            "role": "host",
            "isActive": true,
            "createdAt": "2026-01-01T00:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 45,
        "pages": 5
    }
}
```

---

## 👤 Endpoint 2: دریافت یک کاربر

### مسیر: `GET /api/users/:id`

```javascript
router.get('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        // ...
    }
});
```

### مثال Request:
```http
GET /api/users/65abc123def456
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### مثال Response:
```json
{
    "success": true,
    "data": {
        "_id": "65abc123def456",
        "name": "علی احمدی",
        "email": "ali@example.com",
        "phone": "09123456789",
        "role": "host",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z"
    }
}
```

---

## 🎭 Endpoint 3: تغییر نقش کاربر

### مسیر: `PUT /api/users/:id/role`

```javascript
router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
    try {
        const { role } = req.body;

        if (!['traveler', 'host', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        );
        // ...
    }
});
```

### نقش‌های معتبر:

| نقش | توضیح | دسترسی‌ها |
|-----|-------|-----------|
| `traveler` | مسافر | رزرو، نظر |
| `host` | میزبان | + ایجاد اقامتگاه |
| `admin` | مدیر | + مدیریت همه چیز |

### جریان اجرا:

```
PUT /users/:id/role
        │
        ▼
┌───────────────────┐
│ Validate role     │
└────────┬──────────┘
         │ نامعتبر
         ├──────────► 400: Invalid role
         │
         ▼ معتبر
┌───────────────────┐
│ findByIdAndUpdate │
└────────┬──────────┘
         │ یافت نشد
         ├──────────► 404: User not found
         │
         ▼ یافت شد
┌───────────────────┐
│ 200: User updated │
└───────────────────┘
```

### مثال Request:
```http
PUT /api/users/65abc123def456/role
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "role": "admin"
}
```

---

## 🔄 Endpoint 4: تغییر وضعیت کاربر

### مسیر: `PUT /api/users/:id/status`

```javascript
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );
        // ...
        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'}`,
            data: user
        });
    }
});
```

### کاربرد:
- **غیرفعال کردن:** کاربر نمی‌تواند لاگین کند
- **فعال کردن:** دسترسی بازگردانده می‌شود

### مثال Request (غیرفعال کردن):
```http
PUT /api/users/65abc123def456/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "isActive": false
}
```

### مثال Response:
```json
{
    "success": true,
    "message": "User deactivated",
    "data": {
        "_id": "65abc123def456",
        "name": "علی احمدی",
        "isActive": false
    }
}
```

---

## 🗑️ Endpoint 5: حذف کاربر

### مسیر: `DELETE /api/users/:id`

```javascript
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting self
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
});
```

### جریان اجرا:

```
DELETE /users/:id
        │
        ▼
┌────────────────────────┐
│ User.findById()        │
└────────┬───────────────┘
         │ یافت نشد
         ├──────────► 404: User not found
         │
         ▼
┌────────────────────────┐
│ Check self-deletion    │
└────────┬───────────────┘
         │ خودش است
         ├──────────► 400: Cannot delete your own account
         │
         ▼
┌────────────────────────┐
│ user.deleteOne()       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 200: User deleted      │
└────────────────────────┘
```

### نکته امنیتی:
ادمین نمی‌تواند اکانت **خودش** را حذف کند!

### مثال Request:
```http
DELETE /api/users/65abc123def456
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### مثال Response:
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

---

## 🔒 امنیت

تمام endpoint‌های این فایل:

1. **protect:** نیاز به توکن JWT معتبر دارند
2. **authorize('admin'):** فقط ادمین‌ها دسترسی دارند

```javascript
// زنجیره middleware
protect → authorize('admin') → handler

// کاربر عادی تلاش می‌کند
403: Not authorized to access this route
```

---

## 📁 Export

```javascript
module.exports = router;
```

این router در `server.js` با prefix `/api/users` استفاده می‌شود.
