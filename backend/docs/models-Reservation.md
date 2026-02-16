# 📄 models/Reservation.js - مدل رزرو

## 📋 توضیحات کلی
این فایل Schema و Model رزروها را تعریف می‌کند. شامل اطلاعات رزرو، قیمت‌گذاری، وضعیت، نظرات و لغو است.

---

## 📊 ساختار کامل Schema

```
┌──────────────────────────────────────────────────────────────┐
│                       Reservation                            │
├──────────────────────────────────────────────────────────────┤
│ _id          : ObjectId (auto)                               │
│ property     : ObjectId → Property (required)                │
│ guest        : ObjectId → User (required)                    │
│ host         : ObjectId → User (required)                    │
├──────────────────────────────────────────────────────────────┤
│ checkIn      : Date (required)                               │
│ checkOut     : Date (required)                               │
│ guests       : Number (min: 1, default: 1)                   │
├──────────────────────────────────────────────────────────────┤
│ pricing: {                                                   │
│   perNight   : Number (required)                             │
│   nights     : Number (required)                             │
│   subtotal   : Number (required)                             │
│   serviceFee : Number (default: 0)                           │
│   cleaningFee: Number (default: 0)                           │
│   taxes      : Number (default: 0)                           │
│   total      : Number (required)                             │
│   currency   : String (default: USD)                         │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ status       : Enum [pending|confirmed|cancelled|completed|  │
│                      rejected] (default: pending)            │
│ paymentStatus: Enum [pending|paid|refunded|failed]           │
│               (default: pending)                             │
├──────────────────────────────────────────────────────────────┤
│ specialRequests: String (max 500)                            │
├──────────────────────────────────────────────────────────────┤
│ review: {                                                    │
│   rating     : Number (1-5)                                  │
│   comment    : String                                        │
│   createdAt  : Date                                          │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ cancellation: {                                              │
│   cancelledBy  : ObjectId → User                             │
│   reason       : String                                      │
│   cancelledAt  : Date                                        │
│   refundAmount : Number                                      │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ createdAt    : Date (auto)                                   │
│ updatedAt    : Date (auto)                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 تحلیل فیلدها

### رفرنس‌ها به مدل‌های دیگر

```javascript
property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
},
guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
},
host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
}
```

| فیلد | رفرنس به | توضیح |
|------|----------|-------|
| `property` | Property | اقامتگاه رزرو شده |
| `guest` | User | مهمان (رزرو کننده) |
| `host` | User | میزبان (صاحب اقامتگاه) |

**چرا host ذخیره می‌شود؟**
برای سرعت بالاتر در query‌ها بدون نیاز به populate کردن property.

---

### تاریخ‌ها

```javascript
checkIn: {
    type: Date,
    required: [true, 'Check-in date is required']
},
checkOut: {
    type: Date,
    required: [true, 'Check-out date is required']
}
```

**مثال:**
```json
{
    "checkIn": "2026-03-15T14:00:00.000Z",
    "checkOut": "2026-03-18T11:00:00.000Z"
}
```

---

### آبجکت: pricing

```javascript
pricing: {
    perNight: { type: Number, required: true },
    nights: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    cleaningFee: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
}
```

**نحوه محاسبه:**
```javascript
const nights = 3;
const perNight = 100;

const subtotal = perNight * nights;        // $300
const serviceFee = subtotal * 0.10;        // $30 (10%)
const taxes = subtotal * 0.08;             // $24 (8%)
const cleaningFee = 50;                    // $50
const total = subtotal + serviceFee + taxes + cleaningFee;  // $404
```

**مثال document:**
```json
{
    "pricing": {
        "perNight": 100,
        "nights": 3,
        "subtotal": 300,
        "serviceFee": 30,
        "cleaningFee": 50,
        "taxes": 24,
        "total": 404,
        "currency": "USD"
    }
}
```

---

### فیلد: status

```javascript
status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
    default: 'pending'
}
```

**چرخه وضعیت:**

```
                    ┌─────────────┐
                    │   pending   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  confirmed  │ │  cancelled  │ │  rejected   │
    └──────┬──────┘ └─────────────┘ └─────────────┘
           │
           ├────────────────┐
           ▼                ▼
    ┌─────────────┐  ┌─────────────┐
    │  completed  │  │  cancelled  │
    └─────────────┘  └─────────────┘
```

| وضعیت | توضیح | می‌تواند برود به |
|-------|-------|------------------|
| `pending` | در انتظار تأیید میزبان | confirmed, cancelled, rejected |
| `confirmed` | تأیید شده | completed, cancelled |
| `cancelled` | لغو شده | - (پایانی) |
| `completed` | تکمیل شده | - (پایانی) |
| `rejected` | رد شده توسط میزبان | - (پایانی) |

---

### فیلد: paymentStatus

```javascript
paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
}
```

| وضعیت | توضیح |
|-------|-------|
| `pending` | در انتظار پرداخت |
| `paid` | پرداخت شده |
| `refunded` | بازگشت داده شده |
| `failed` | پرداخت ناموفق |

---

### آبجکت: review

```javascript
review: {
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    comment: String,
    createdAt: Date
}
```

**شرط ثبت نظر:**
- فقط مهمان می‌تواند نظر بدهد
- فقط پس از `completed` شدن رزرو
- فقط یک بار

**مثال:**
```json
{
    "review": {
        "rating": 5,
        "comment": "اقامتگاه عالی بود. کاملاً توصیه می‌کنم.",
        "createdAt": "2026-03-20T10:00:00.000Z"
    }
}
```

---

### آبجکت: cancellation

```javascript
cancellation: {
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: String,
    cancelledAt: Date,
    refundAmount: Number
}
```

**مثال:**
```json
{
    "cancellation": {
        "cancelledBy": "65abc123...",
        "reason": "برنامه سفر تغییر کرد",
        "cancelledAt": "2026-03-10T12:00:00.000Z",
        "refundAmount": 404
    }
}
```

---

## 🪝 Middleware: اعتبارسنجی تاریخ

```javascript
reservationSchema.pre('save', function(next) {
    if (this.checkOut <= this.checkIn) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});
```

**توضیح:**
- قبل از ذخیره بررسی می‌کند
- checkOut باید بعد از checkIn باشد
- در غیر این صورت خطا throw می‌شود

---

## 🔍 Index‌ها

```javascript
// جستجوی رزروهای مهمان
reservationSchema.index({ guest: 1, status: 1 });

// جستجوی رزروهای میزبان
reservationSchema.index({ host: 1, status: 1 });

// بررسی تداخل تاریخ
reservationSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
```

**چرا این Index‌ها؟**

1. **guest + status:** نمایش رزروهای کاربر فعلی
2. **host + status:** نمایش رزروهای دریافتی میزبان
3. **property + dates:** بررسی تداخل زمانی

---

## 🧪 مثال‌های استفاده

### ایجاد رزرو
```javascript
const reservation = await Reservation.create({
    property: propertyId,
    guest: req.user.id,
    host: property.host,
    checkIn: new Date('2026-03-15'),
    checkOut: new Date('2026-03-18'),
    guests: 4,
    pricing: {
        perNight: 100,
        nights: 3,
        subtotal: 300,
        serviceFee: 30,
        taxes: 24,
        total: 354
    }
});
```

### بررسی تداخل تاریخ
```javascript
const conflicting = await Reservation.findOne({
    property: propertyId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
        { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
    ]
});

if (conflicting) {
    throw new Error('این تاریخ‌ها قبلاً رزرو شده‌اند');
}
```

### تأیید رزرو
```javascript
reservation.status = 'confirmed';
await reservation.save();

// ارسال نوتیفیکیشن به مهمان
await Notification.create({
    recipient: reservation.guest,
    type: 'reservation_confirmed',
    title: 'رزرو تأیید شد'
});
```

### لغو رزرو
```javascript
reservation.status = 'cancelled';
reservation.cancellation = {
    cancelledBy: req.user.id,
    reason: 'تغییر برنامه',
    cancelledAt: new Date(),
    refundAmount: reservation.pricing.total
};
await reservation.save();
```

### ثبت نظر
```javascript
reservation.review = {
    rating: 5,
    comment: 'عالی بود!',
    createdAt: new Date()
};
await reservation.save();

// بروزرسانی امتیاز اقامتگاه
const allReviews = await Reservation.find({
    property: reservation.property,
    'review.rating': { $exists: true }
});

const avgRating = allReviews.reduce((sum, r) => sum + r.review.rating, 0) / allReviews.length;
await Property.findByIdAndUpdate(reservation.property, {
    'rating.average': avgRating,
    'rating.count': allReviews.length
});
```

---

## 📁 مثال Document کامل

```json
{
    "_id": "65def456...",
    "property": "65abc123...",
    "guest": "65ghi789...",
    "host": "65jkl012...",
    "checkIn": "2026-03-15T14:00:00.000Z",
    "checkOut": "2026-03-18T11:00:00.000Z",
    "guests": 4,
    "pricing": {
        "perNight": 100,
        "nights": 3,
        "subtotal": 300,
        "serviceFee": 30,
        "cleaningFee": 0,
        "taxes": 24,
        "total": 354,
        "currency": "USD"
    },
    "status": "confirmed",
    "paymentStatus": "paid",
    "specialRequests": "لطفاً یک صندلی کودک آماده باشد",
    "review": {
        "rating": 5,
        "comment": "اقامت فوق‌العاده‌ای بود!",
        "createdAt": "2026-03-20T10:00:00.000Z"
    },
    "createdAt": "2026-02-16T12:00:00.000Z",
    "updatedAt": "2026-03-20T10:00:00.000Z",
    "__v": 0
}
```
