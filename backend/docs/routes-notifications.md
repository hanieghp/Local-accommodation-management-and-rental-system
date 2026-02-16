# 📄 routes/notifications.js - مسیرهای نوتیفیکیشن

## 📋 توضیحات کلی
این فایل endpoint‌های مربوط به مدیریت نوتیفیکیشن‌های کاربران را تعریف می‌کند: دریافت، خواندن و حذف.

---

## 📊 خلاصه Endpoint‌ها

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/api/notifications` | Private | لیست نوتیفیکیشن‌ها |
| PUT | `/api/notifications/:id/read` | Private | علامت خوانده شده |
| PUT | `/api/notifications/read-all` | Private | همه را خوانده علامت بزن |
| DELETE | `/api/notifications/:id` | Private | حذف یک نوتیفیکیشن |
| DELETE | `/api/notifications` | Private | حذف همه نوتیفیکیشن‌ها |

---

## 📝 تحلیل خط به خط

### خطوط 1-4: Import‌ها

```javascript
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
```

---

## 📋 Endpoint 1: لیست نوتیفیکیشن‌ها

### مسیر: `GET /api/notifications`

```javascript
router.get('/', protect, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user.id };

    // Filter by read status
    if (req.query.unread === 'true') {
        query.isRead = false;
    }

    const notifications = await Notification.find(query)
        .populate('sender', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
        recipient: req.user.id,
        isRead: false
    });

    res.json({
        success: true,
        data: notifications,
        unreadCount,    // ← تعداد خوانده نشده‌ها
        pagination: {...}
    });
});
```

### Query Parameters:

| پارامتر | توضیح | مثال |
|---------|-------|------|
| page | صفحه | `?page=2` |
| limit | تعداد در صفحه | `?limit=10` |
| unread | فقط خوانده نشده | `?unread=true` |

### Response نمونه:
```json
{
    "success": true,
    "data": [
        {
            "_id": "65not...",
            "type": "reservation_confirmed",
            "title": "رزرو تأیید شد",
            "message": "رزرو شما برای ویلای ساحلی تأیید شد",
            "sender": {
                "_id": "65user...",
                "name": "میزبان",
                "avatar": "..."
            },
            "isRead": false,
            "createdAt": "2026-03-10T10:00:00.000Z"
        }
    ],
    "unreadCount": 5,
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 45,
        "pages": 3
    }
}
```

---

## ✓ Endpoint 2: علامت خوانده شده

### مسیر: `PUT /api/notifications/:id/read`

```javascript
router.put('/:id/read', protect, async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        recipient: req.user.id   // ← فقط نوتیفیکیشن خودش
    });

    if (!notification) {
        return res.status(404).json({...});
    }

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();
});
```

**نکته:** کاربر فقط نوتیفیکیشن‌های خودش را می‌تواند تغییر دهد.

---

## ✓✓ Endpoint 3: همه را خوانده علامت بزن

### مسیر: `PUT /api/notifications/read-all`

```javascript
router.put('/read-all', protect, async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user.id, isRead: false },
        { isRead: true, readAt: Date.now() }
    );

    res.json({
        success: true,
        message: 'All notifications marked as read'
    });
});
```

**کاربرد:** دکمه "همه را خواندم" در UI

---

## 🗑️ Endpoint 4: حذف یک نوتیفیکیشن

### مسیر: `DELETE /api/notifications/:id`

```javascript
router.delete('/:id', protect, async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user.id
    });

    if (!notification) {
        return res.status(404).json({...});
    }

    res.json({
        success: true,
        message: 'Notification deleted'
    });
});
```

---

## 🗑️ Endpoint 5: حذف همه نوتیفیکیشن‌ها

### مسیر: `DELETE /api/notifications`

```javascript
router.delete('/', protect, async (req, res) => {
    await Notification.deleteMany({ recipient: req.user.id });

    res.json({
        success: true,
        message: 'All notifications deleted'
    });
});
```

---

## 🎨 استفاده در UI

```
┌─────────────────────────────────────────────────┐
│  🔔 نوتیفیکیشن‌ها                    [همه را خواندم] │
├─────────────────────────────────────────────────┤
│ 🔴 رزرو شما تأیید شد               ⋯           │
│    10 دقیقه پیش                               │
├─────────────────────────────────────────────────┤
│ ⚪ اقامتگاه شما تأیید شد            ⋯           │
│    2 ساعت پیش                                │
├─────────────────────────────────────────────────┤
│ ⚪ نظر جدید دریافت کردید            ⋯           │
│    دیروز                                      │
└─────────────────────────────────────────────────┘
     ↑                                     ↑
  🔴 = unread                         منوی ⋯ = حذف
```

---

## 📁 Export

```javascript
module.exports = router;
```

این router در `server.js` با prefix `/api/notifications` استفاده می‌شود.
