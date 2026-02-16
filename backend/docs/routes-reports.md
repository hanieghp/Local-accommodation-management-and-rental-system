# 📄 routes/reports.js - مسیرهای گزارشات

## 📋 توضیحات کلی
این فایل endpoint‌های گزارشات و آمار را تعریف می‌کند. شامل داشبورد ادمین و آمار میزبانان.

---

## 📊 خلاصه Endpoint‌ها

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/api/reports/dashboard` | Admin | داشبورد کامل ادمین |
| GET | `/api/reports/host-stats` | Host | آمار میزبان |

---

## 📝 تحلیل خط به خط

### خطوط 1-6: Import‌ها

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/auth');
```

---

## 📊 Endpoint 1: داشبورد ادمین

### مسیر: `GET /api/reports/dashboard`

```javascript
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
    // ...
});
```

### ساختار Response:

```json
{
    "success": true,
    "data": {
        "users": {
            "total": 150,
            "hosts": 45,
            "travelers": 105,
            "recentSignups": 12
        },
        "properties": {
            "total": 89,
            "approved": 75,
            "pending": 14,
            "byType": [...],
            "topCities": [...]
        },
        "reservations": {
            "total": 340,
            "recent": 28,
            "byStatus": [...],
            "monthlyRevenue": [...]
        }
    }
}
```

### تحلیل Query‌ها:

#### آمار کاربران:
```javascript
const totalUsers = await User.countDocuments();
const totalHosts = await User.countDocuments({ role: 'host' });
const totalTravelers = await User.countDocuments({ role: 'traveler' });
```

#### آمار رزروها با Aggregation:
```javascript
const reservationStats = await Reservation.aggregate([
    {
        $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$pricing.total' }
        }
    }
]);
```

**نتیجه:**
```json
[
    { "_id": "confirmed", "count": 120, "totalRevenue": 45000 },
    { "_id": "completed", "count": 180, "totalRevenue": 72000 },
    { "_id": "cancelled", "count": 40, "totalRevenue": 0 }
]
```

#### درآمد ماهانه (12 ماه اخیر):
```javascript
const twelveMonthsAgo = new Date();
twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

const monthlyRevenue = await Reservation.aggregate([
    {
        $match: {
            status: { $in: ['confirmed', 'completed'] },
            createdAt: { $gte: twelveMonthsAgo }
        }
    },
    {
        $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$pricing.total' },
            count: { $sum: 1 }
        }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
]);
```

**نتیجه:**
```json
[
    { "_id": { "year": 2026, "month": 1 }, "revenue": 12500, "count": 45 },
    { "_id": { "year": 2026, "month": 2 }, "revenue": 15800, "count": 52 },
    { "_id": { "year": 2026, "month": 3 }, "revenue": 18200, "count": 61 }
]
```

#### شهرهای برتر:
```javascript
const topCities = await Property.aggregate([
    { $match: { isApproved: true } },
    {
        $group: {
            _id: '$address.city',
            count: { $sum: 1 }
        }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
]);
```

**نتیجه:**
```json
[
    { "_id": "تهران", "count": 25 },
    { "_id": "شیراز", "count": 18 },
    { "_id": "اصفهان", "count": 15 },
    { "_id": "مشهد", "count": 12 }
]
```

#### توزیع انواع اقامتگاه:
```javascript
const propertyTypes = await Property.aggregate([
    { $match: { isApproved: true } },
    {
        $group: {
            _id: '$type',
            count: { $sum: 1 }
        }
    }
]);
```

**نتیجه:**
```json
[
    { "_id": "villa", "count": 35 },
    { "_id": "apartment", "count": 28 },
    { "_id": "suite", "count": 12 }
]
```

---

## 📊 Endpoint 2: آمار میزبان

### مسیر: `GET /api/reports/host-stats`

```javascript
router.get('/host-stats', protect, authorize('host', 'admin'), async (req, res) => {
    const hostId = req.user.id;

    // Get host's properties
    const properties = await Property.find({ host: hostId });
    const propertyIds = properties.map(p => p._id);

    // Property stats
    const totalProperties = properties.length;
    const approvedProperties = properties.filter(p => p.isApproved).length;
    const totalCapacity = properties.reduce((sum, p) => sum + p.capacity.guests, 0);

    // Reservation stats
    const reservations = await Reservation.find({ host: hostId });
    const totalReservations = reservations.length;
    
    // Aggregation by status
    const reservationsByStatus = await Reservation.aggregate([
        { $match: { host: hostId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                revenue: { $sum: '$pricing.total' }
            }
        }
    ]);
    
    // ...
});
```

### ساختار Response:

```json
{
    "success": true,
    "data": {
        "properties": {
            "total": 5,
            "approved": 4,
            "totalCapacity": 32
        },
        "reservations": {
            "total": 45,
            "byStatus": [
                { "_id": "confirmed", "count": 20, "revenue": 8000 },
                { "_id": "completed", "count": 22, "revenue": 9500 },
                { "_id": "pending", "count": 3, "revenue": 0 }
            ],
            "totalRevenue": 17500,
            "avgRating": 4.6
        }
    }
}
```

---

## 📈 نمایش در داشبورد ادمین

```
┌──────────────────────────────────────────────────────────────┐
│                    📊 داشبورد مدیریت                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   150    │  │    89    │  │   340    │  │  $117K   │     │
│  │ کاربران  │  │ اقامتگاه │  │   رزرو   │  │  درآمد   │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  📈 درآمد ماهانه                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │     ▄▄                                              │    │
│  │  ▄▄ ██ ▄▄                                          │    │
│  │  ██ ██ ██ ▄▄                                       │    │
│  │  ██ ██ ██ ██                                       │    │
│  └──┴──┴──┴──┴──────────────────────────────────────────┘    │
│     Jan Feb Mar Apr                                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  🏙️ شهرهای برتر           │  🏠 انواع اقامتگاه             │
│  1. تهران (25)            │  ● ویلا: 35%                   │
│  2. شیراز (18)            │  ● آپارتمان: 28%               │
│  3. اصفهان (15)           │  ● سوییت: 12%                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Aggregation Pipeline توضیح

```javascript
// مرحله 1: فیلتر
{ $match: { status: 'completed' } }

// مرحله 2: گروه‌بندی
{ $group: { _id: '$status', count: { $sum: 1 } } }

// مرحله 3: مرتب‌سازی
{ $sort: { count: -1 } }

// مرحله 4: محدود کردن
{ $limit: 10 }
```

---

## 📁 Export

```javascript
module.exports = router;
```

این router در `server.js` با prefix `/api/reports` استفاده می‌شود.
