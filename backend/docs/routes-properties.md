# 📄 routes/properties.js - مسیرهای اقامتگاه‌ها

## 📋 توضیحات کلی
این فایل تمام endpoint‌های مربوط به اقامتگاه‌ها را تعریف می‌کند: جستجو، فیلتر، CRUD، تأیید توسط ادمین.

---

## 📊 خلاصه Endpoint‌ها

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/api/properties` | Public | لیست همه اقامتگاه‌ها |
| GET | `/api/properties/:id` | Public | جزئیات یک اقامتگاه |
| POST | `/api/properties` | Host/Admin | ایجاد اقامتگاه |
| PUT | `/api/properties/:id` | Host/Admin | بروزرسانی اقامتگاه |
| DELETE | `/api/properties/:id` | Host/Admin | حذف اقامتگاه |
| GET | `/api/properties/host/my-properties` | Host | اقامتگاه‌های خودم |
| PUT | `/api/properties/:id/approve` | Admin | تأیید اقامتگاه |
| GET | `/api/properties/admin/pending` | Admin | اقامتگاه‌های در انتظار تأیید |

---

## 📝 تحلیل خط به خط

### خطوط 1-5: Import‌ها

```javascript
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/auth');
```

---

## 🔍 Endpoint 1: لیست اقامتگاه‌ها با فیلتر

### مسیر: `GET /api/properties`

```javascript
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const query = {};
        
        // اگر admin نیست، فقط تأیید شده‌ها را نشان بده
        if (req.query.all !== 'true') {
            query.isAvailable = true;
            query.isApproved = true;
        }
        // ...فیلترهای دیگر
    }
});
```

### Query Parameters:

| پارامتر | نوع | پیش‌فرض | توضیح | مثال |
|---------|-----|---------|-------|------|
| page | Number | 1 | شماره صفحه | `?page=2` |
| limit | Number | 12 | تعداد در صفحه | `?limit=20` |
| all | Boolean | false | نمایش همه (ادمین) | `?all=true` |
| search | String | - | جستجوی متنی | `?search=ویلا` |
| city | String | - | فیلتر شهر | `?city=شیراز` |
| type | String | - | نوع اقامتگاه | `?type=villa` |
| minPrice | Number | - | حداقل قیمت | `?minPrice=100` |
| maxPrice | Number | - | حداکثر قیمت | `?maxPrice=500` |
| guests | Number | - | حداقل ظرفیت | `?guests=4` |
| bedrooms | Number | - | حداقل اتاق‌خواب | `?bedrooms=2` |
| amenities | String | - | امکانات (comma separated) | `?amenities=wifi,pool` |
| sort | String | createdAt | ترتیب | `?sort=price_asc` |

### تحلیل فیلترها:

#### فیلتر جستجو (Full-text):
```javascript
if (req.query.search) {
    query.$text = { $search: req.query.search };
}
```
- از Text Index استفاده می‌کند
- جستجو در title, description, city

#### فیلتر شهر (Case-insensitive):
```javascript
if (req.query.city) {
    query['address.city'] = new RegExp(req.query.city, 'i');
}
```
- `RegExp(..., 'i')` → case-insensitive
- مثال: "شیراز" هم "شیراز" و هم "shiraz" را پیدا می‌کند

#### فیلتر قیمت (Range):
```javascript
if (req.query.minPrice || req.query.maxPrice) {
    query['price.perNight'] = {};
    if (req.query.minPrice) {
        query['price.perNight'].$gte = parseInt(req.query.minPrice);
    }
    if (req.query.maxPrice) {
        query['price.perNight'].$lte = parseInt(req.query.maxPrice);
    }
}
```

**مثال:**
```
?minPrice=100&maxPrice=500
→ query = { 'price.perNight': { $gte: 100, $lte: 500 } }
```

#### فیلتر امکانات (همه باید موجود باشند):
```javascript
if (req.query.amenities) {
    const amenitiesArray = req.query.amenities.split(',');
    query.amenities = { $all: amenitiesArray };
}
```

**مثال:**
```
?amenities=wifi,pool,parking
→ فقط اقامتگاه‌هایی که هر سه را دارند
```

#### ترتیب‌بندی:
```javascript
let sortOption = { createdAt: -1 };
if (req.query.sort === 'price_asc') {
    sortOption = { 'price.perNight': 1 };
} else if (req.query.sort === 'price_desc') {
    sortOption = { 'price.perNight': -1 };
} else if (req.query.sort === 'rating') {
    sortOption = { 'rating.average': -1 };
}
```

| مقدار sort | نتیجه |
|------------|-------|
| - | جدیدترین اول |
| `price_asc` | ارزان‌ترین اول |
| `price_desc` | گران‌ترین اول |
| `rating` | بالاترین امتیاز اول |

### مثال Request کامل:
```http
GET /api/properties?city=شیراز&type=villa&minPrice=100&maxPrice=500&guests=4&amenities=wifi,pool&sort=price_asc&page=1&limit=10
```

### مثال Response:
```json
{
    "success": true,
    "data": [
        {
            "_id": "65abc123...",
            "title": "ویلای ساحلی لوکس",
            "type": "villa",
            "price": { "perNight": 150 },
            "capacity": { "guests": 6 },
            "host": {
                "_id": "65host...",
                "name": "علی",
                "avatar": "..."
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "pages": 3
    }
}
```

---

## 📖 Endpoint 2: جزئیات اقامتگاه

### مسیر: `GET /api/properties/:id`

```javascript
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('host', 'name avatar phone email createdAt');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        res.json({
            success: true,
            data: property
        });
    }
});
```

**Populate:**
- فیلدهای host گسترش داده می‌شوند
- شامل: name, avatar, phone, email, createdAt

---

## ➕ Endpoint 3: ایجاد اقامتگاه

### مسیر: `POST /api/properties`

```javascript
router.post('/', protect, authorize('host', 'admin'), [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['villa', 'apartment', 'suite', 'eco-lodge', 'cabin', 'hotel', 'house', 'cottage', 'eco']).withMessage('Invalid property type'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('price.perNight').isNumeric().withMessage('Price per night is required'),
    body('capacity.guests').isInt({ min: 1 }).withMessage('Guest capacity must be at least 1')
], async (req, res) => {
    // ...
    const propertyData = {
        ...req.body,
        host: req.user.id,
        isApproved: false  // ← نیاز به تأیید ادمین
    };

    const property = await Property.create(propertyData);
});
```

### Validation Rules:

| فیلد | قاعده | الزامی |
|------|-------|--------|
| title | notEmpty | ✅ |
| description | notEmpty | ✅ |
| type | isIn([...]) | ✅ |
| address.city | notEmpty | ✅ |
| price.perNight | isNumeric | ✅ |
| capacity.guests | isInt(min:1) | ✅ |

### نکته مهم:
```javascript
isApproved: false  // اقامتگاه جدید نیاز به تأیید ادمین دارد
```

### مثال Request:
```http
POST /api/properties
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "title": "ویلای ساحلی شمال",
    "description": "ویلای لوکس با دید دریا...",
    "type": "villa",
    "address": {
        "city": "رامسر",
        "state": "مازندران",
        "country": "ایران",
        "fullAddress": "کیلومتر 5 جاده ساحلی"
    },
    "price": {
        "perNight": 200,
        "cleaningFee": 50
    },
    "capacity": {
        "guests": 8,
        "bedrooms": 4,
        "beds": 5,
        "bathrooms": 2
    },
    "amenities": ["wifi", "pool", "parking", "kitchen"],
    "images": ["image1.jpg", "image2.jpg"]
}
```

---

## ✏️ Endpoint 4: بروزرسانی اقامتگاه

### مسیر: `PUT /api/properties/:id`

```javascript
router.put('/:id', protect, authorize('host', 'admin'), async (req, res) => {
    let property = await Property.findById(req.params.id);

    // Check ownership (unless admin)
    if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this property'
        });
    }

    req.body.updatedAt = Date.now();

    property = await Property.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
});
```

### بررسی مالکیت:

```
┌────────────────────────────────────────┐
│ property.host === req.user.id?         │
└──────────────┬─────────────────────────┘
               │
    ┌──────────┼──────────┐
    │ خیر      │          │ بله
    ▼          │          ▼
┌───────────┐  │   ┌──────────────┐
│ req.user  │  │   │ مجاز به      │
│ is admin? │  │   │ ویرایش      │
└─────┬─────┘  │   └──────────────┘
      │        │
   ┌──┴──┐     │
   │     │     │
   ▼     ▼     │
  بله   خیر   │
   │     │     │
   ▼     ▼     │
مجاز   403    │
```

---

## 🗑️ Endpoint 5: حذف اقامتگاه

### مسیر: `DELETE /api/properties/:id`

```javascript
router.delete('/:id', protect, authorize('host', 'admin'), async (req, res) => {
    const property = await Property.findById(req.params.id);

    // Check ownership (unless admin)
    if (property.host.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({...});
    }

    await property.deleteOne();
});
```

---

## 🏠 Endpoint 6: اقامتگاه‌های من (Host)

### مسیر: `GET /api/properties/host/my-properties`

```javascript
router.get('/host/my-properties', protect, authorize('host', 'admin'), async (req, res) => {
    const properties = await Property.find({ host: req.user.id })
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: properties
    });
});
```

**کاربرد:** صفحه داشبورد میزبان

---

## ✅ Endpoint 7: تأیید اقامتگاه (Admin)

### مسیر: `PUT /api/properties/:id/approve`

```javascript
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
    const property = await Property.findByIdAndUpdate(
        req.params.id,
        { isApproved: true },
        { new: true }
    );
    // ...
});
```

**جریان تأیید:**

```
┌─────────────────────┐
│ Host ایجاد می‌کند   │
│ isApproved: false   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ در لیست pending     │
│ ادمین می‌بیند       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Admin approve می‌کند │
│ isApproved: true    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ در سایت عمومی      │
│ نمایش داده می‌شود  │
└─────────────────────┘
```

---

## ⏳ Endpoint 8: اقامتگاه‌های در انتظار (Admin)

### مسیر: `GET /api/properties/admin/pending`

```javascript
router.get('/admin/pending', protect, authorize('admin'), async (req, res) => {
    const properties = await Property.find({ isApproved: false })
        .populate('host', 'name email')
        .sort({ createdAt: -1 });
    // ...
});
```

**Response نمونه:**
```json
{
    "success": true,
    "data": [
        {
            "_id": "65abc...",
            "title": "آپارتمان در تهران",
            "isApproved": false,
            "host": {
                "_id": "65host...",
                "name": "محمد",
                "email": "mohammad@example.com"
            }
        }
    ]
}
```

---

## 📁 Export

```javascript
module.exports = router;
```

این router در `server.js` با prefix `/api/properties` استفاده می‌شود.
