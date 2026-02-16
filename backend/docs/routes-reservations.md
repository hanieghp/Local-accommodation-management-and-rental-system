# 📄 routes/reservations.js - مسیرهای رزرو

## 📋 توضیحات کلی
این فایل تمام endpoint‌های مربوط به رزرو اقامتگاه‌ها را تعریف می‌کند: ایجاد رزرو، تأیید، لغو، ثبت نظر و تولید رسید PDF.

---

## 📊 خلاصه Endpoint‌ها

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/api/reservations` | Private | رزروهای من (مهمان) |
| GET | `/api/reservations/host` | Host | رزروهای دریافتی (میزبان) |
| GET | `/api/reservations/:id` | Private | جزئیات رزرو |
| POST | `/api/reservations` | Private | ایجاد رزرو |
| PUT | `/api/reservations/:id/confirm` | Host | تأیید رزرو |
| PUT | `/api/reservations/:id/cancel` | Private | لغو رزرو |
| PUT | `/api/reservations/:id/review` | Guest | ثبت نظر |
| GET | `/api/reservations/admin/all` | Admin | همه رزروها |
| GET | `/api/reservations/:id/receipt` | Private | دانلود رسید PDF |

---

## 📝 تحلیل خط به خط

### خطوط 1-8: Import‌ها

```javascript
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const Reservation = require('../models/Reservation');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
```

| ماژول | کاربرد |
|-------|--------|
| PDFDocument | تولید فایل PDF |
| Notification | ارسال نوتیفیکیشن |

---

### خطوط 10-16: Helper تولید نوتیفیکیشن

```javascript
const createNotification = async (data) => {
    try {
        await Notification.create(data);
    } catch (error) {
        console.error('Notification creation error:', error);
    }
};
```

**نکته:** خطا در ایجاد نوتیفیکیشن، عملیات اصلی را متوقف نمی‌کند.

---

## 📋 Endpoint 1: لیست رزروهای من

### مسیر: `GET /api/reservations`

```javascript
router.get('/', protect, async (req, res) => {
    let query = {};
    
    // Admin can see all reservations
    if (req.user.role === 'admin') {
        // No filter
    } else {
        // Regular users see only their reservations
        query = { guest: req.user.id };
    }

    if (req.query.status) {
        query.status = req.query.status;
    }

    const reservations = await Reservation.find(query)
        .populate('property', 'title images address price')
        .populate('host', 'name avatar')
        .populate('guest', 'name email phone avatar')
        .sort({ createdAt: -1 });
});
```

### Query Parameters:

| پارامتر | توضیح | مثال |
|---------|-------|------|
| status | فیلتر وضعیت | `?status=confirmed` |
| page | صفحه | `?page=2` |
| limit | تعداد | `?limit=10` |

---

## 🏠 Endpoint 2: رزروهای میزبان

### مسیر: `GET /api/reservations/host`

```javascript
router.get('/host', protect, authorize('host', 'admin'), async (req, res) => {
    const query = { host: req.user.id };

    if (req.query.status) {
        query.status = req.query.status;
    }

    const reservations = await Reservation.find(query)
        .populate('property', 'title images address')
        .populate('guest', 'name email phone avatar')
        .sort({ createdAt: -1 });
});
```

**کاربرد:** داشبورد میزبان - نمایش رزروهای دریافتی

---

## 📖 Endpoint 3: جزئیات رزرو

### مسیر: `GET /api/reservations/:id`

```javascript
router.get('/:id', protect, async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate('property')
        .populate('guest', 'name email phone avatar')
        .populate('host', 'name email phone avatar');

    // Check authorization
    const isGuest = reservation.guest._id.toString() === req.user.id;
    const isHost = reservation.host._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isGuest && !isHost && !isAdmin) {
        return res.status(403).json({...});
    }
});
```

**دسترسی:** فقط مهمان، میزبان یا ادمین

---

## ➕ Endpoint 4: ایجاد رزرو

### مسیر: `POST /api/reservations`

```javascript
router.post('/', protect, [
    body('property').notEmpty().withMessage('Property ID is required'),
    body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
    body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
    body('guests').isInt({ min: 1 }).withMessage('At least 1 guest required')
], async (req, res) => {
    // ...
});
```

### جریان ایجاد رزرو:

```
┌─────────────────────────────────────┐
│ 1. Validation ورودی‌ها             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 2. پیدا کردن اقامتگاه              │
│    - وجود داشته باشد               │
│    - isAvailable: true             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 3. بررسی ظرفیت                     │
│    guests <= property.capacity     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 4. بررسی تداخل تاریخ               │
│    آیا در این تاریخ رزرو هست؟      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 5. محاسبه قیمت                     │
│    subtotal = perNight × nights    │
│    serviceFee = 10%                │
│    taxes = 8%                      │
│    total = subtotal + fees + tax   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 6. ذخیره رزرو                       │
│    status: 'pending'               │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ 7. نوتیفیکیشن به میزبان            │
│    type: 'reservation_request'     │
└─────────────────────────────────────┘
```

### بررسی تداخل تاریخ:

```javascript
const conflictingReservation = await Reservation.findOne({
    property: propertyId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
        { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
    ]
});
```

**منطق تداخل:**
```
درخواست جدید:     |-----|
رزرو موجود:    |---------|
                    ↑ تداخل

درخواست جدید:           |-----|
رزرو موجود:    |-----|
                       ↑ بدون تداخل
```

### محاسبه قیمت:

```javascript
const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

const subtotal = property.price.perNight * nights;
const serviceFee = Math.round(subtotal * 0.1);  // 10%
const taxes = Math.round(subtotal * 0.08);       // 8%
const total = subtotal + serviceFee + taxes;
```

**مثال:**
```
3 شب × $100 = $300 (subtotal)
Service Fee: $30 (10%)
Taxes: $24 (8%)
─────────────────
Total: $354
```

---

## ✅ Endpoint 5: تأیید رزرو

### مسیر: `PUT /api/reservations/:id/confirm`

```javascript
router.put('/:id/confirm', protect, authorize('host', 'admin'), async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);

    // فقط میزبان یا ادمین
    if (reservation.host.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({...});
    }

    // فقط pending قابل تأیید است
    if (reservation.status !== 'pending') {
        return res.status(400).json({...});
    }

    reservation.status = 'confirmed';
    await reservation.save();

    // نوتیفیکیشن به مهمان
    await createNotification({
        recipient: reservation.guest,
        type: 'reservation_confirmed',
        title: 'Reservation Confirmed',
        message: `Your reservation for ${reservation.property.title} has been confirmed!`
    });
});
```

---

## ❌ Endpoint 6: لغو رزرو

### مسیر: `PUT /api/reservations/:id/cancel`

```javascript
router.put('/:id/cancel', protect, async (req, res) => {
    // مهمان، میزبان یا ادمین می‌تواند لغو کند
    const isGuest = reservation.guest.toString() === req.user.id;
    const isHost = reservation.host.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // فقط pending یا confirmed قابل لغو است
    if (!['pending', 'confirmed'].includes(reservation.status)) {
        return res.status(400).json({...});
    }

    reservation.status = 'cancelled';
    reservation.cancellation = {
        cancelledBy: req.user.id,
        reason: req.body.reason || 'No reason provided',
        cancelledAt: Date.now(),
        refundAmount: reservation.pricing.total
    };
    await reservation.save();

    // نوتیفیکیشن به طرف مقابل
    const notifyUser = isGuest ? reservation.host : reservation.guest;
    await createNotification({
        recipient: notifyUser,
        type: 'reservation_cancelled'
    });
});
```

---

## ⭐ Endpoint 7: ثبت نظر

### مسیر: `PUT /api/reservations/:id/review`

```javascript
router.put('/:id/review', protect, [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 500 })
], async (req, res) => {
    // فقط مهمان می‌تواند نظر بدهد
    if (reservation.guest.toString() !== req.user.id) {
        return res.status(403).json({...});
    }

    // فقط رزروهای تکمیل شده
    if (reservation.status !== 'completed') {
        return res.status(400).json({...});
    }

    // فقط یک بار
    if (reservation.review && reservation.review.rating) {
        return res.status(400).json({...});
    }

    reservation.review = {
        rating: req.body.rating,
        comment: req.body.comment,
        createdAt: Date.now()
    };
    await reservation.save();

    // بروزرسانی امتیاز اقامتگاه
    const allReviews = await Reservation.find({
        property: reservation.property,
        'review.rating': { $exists: true }
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.review.rating, 0);
    property.rating.average = Math.round((totalRating / allReviews.length) * 10) / 10;
    property.rating.count = allReviews.length;
    await property.save();
});
```

**شرایط ثبت نظر:**
1. کاربر باید مهمان باشد
2. رزرو باید `completed` باشد
3. نظر قبلی وجود نداشته باشد

---

## 📄 Endpoint 8: تولید رسید PDF

### مسیر: `GET /api/reservations/:id/receipt`

```javascript
router.get('/:id/receipt', protect, async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
        .populate('property', 'title address price images')
        .populate('guest', 'name email phone')
        .populate('host', 'name email phone');

    // Create PDF document
    const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        bufferPages: true
    });
    
    // Collect PDF data in buffer
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${reservation._id}.pdf`);
        res.send(pdfData);
    });

    // ... محتوای PDF
    
    doc.end();
});
```

### ساختار PDF:

```
┌──────────────────────────────────────────────────────┐
│                    StayLocal                         │
│               Reservation Receipt                    │
├──────────────────────────────────────────────────────┤
│ Reservation ID: 65abc123...                          │
│ Booking Date: January 15, 2026                       │
│ Status: ● Confirmed                                  │
├──────────────────────────────────────────────────────┤
│ 👤 Guest Information                                 │
│ Name: علی احمدی                                      │
│ Email: ali@example.com                               │
│ Phone: 09123456789                                   │
├──────────────────────────────────────────────────────┤
│ 🏠 Property Details                                  │
│ Property: ویلای ساحلی                                │
│ Address: رامسر، مازندران                             │
│ Host: محمد حسینی                                     │
├──────────────────────────────────────────────────────┤
│ 📅 Stay Details                                      │
│ Check-in: Friday, March 15, 2026                     │
│ Check-out: Monday, March 18, 2026                    │
│ Guests: 4                                            │
│ Nights: 3                                            │
├──────────────────────────────────────────────────────┤
│ 💰 Payment Summary                                   │
│ Price per Night: $100                                │
│ Subtotal: $300                                       │
│ Service Fee: $30                                     │
│ ────────────────                                     │
│ Total: $330                                          │
├──────────────────────────────────────────────────────┤
│       Thank you for choosing StayLocal!              │
│    This is an electronically generated receipt.      │
└──────────────────────────────────────────────────────┘
```

### نکته فنی PDF:

```javascript
// روش Buffer (صحیح)
const buffers = [];
doc.on('data', buffers.push.bind(buffers));
doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    res.send(pdfData);
});

// به جای pipe مستقیم که گاهی خالی می‌شد
// doc.pipe(res);  ← مشکل‌دار
```

---

## 🔔 نوتیفیکیشن‌ها

| عملیات | نوتیفیکیشن | گیرنده |
|--------|------------|--------|
| ایجاد رزرو | reservation_request | میزبان |
| تأیید رزرو | reservation_confirmed | مهمان |
| لغو رزرو | reservation_cancelled | طرف مقابل |

---

## 📁 Export

```javascript
module.exports = router;
```

این router در `server.js` با prefix `/api/reservations` استفاده می‌شود.
