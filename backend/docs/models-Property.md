# 📄 models/Property.js - مدل اقامتگاه

## 📋 توضیحات کلی
این فایل Schema و Model اقامتگاه‌ها را تعریف می‌کند. شامل اطلاعات کامل ملک، آدرس، قیمت، ظرفیت، امکانات و قوانین است.

---

## 📊 ساختار کامل Schema

```
┌──────────────────────────────────────────────────────────────┐
│                         Property                             │
├──────────────────────────────────────────────────────────────┤
│ _id          : ObjectId (auto)                               │
│ title        : String (required, max 100)                    │
│ description  : String (required, max 2000)                   │
│ type         : Enum [villa|apartment|suite|...]              │
│ host         : ObjectId → User (required)                    │
├──────────────────────────────────────────────────────────────┤
│ address: {                                                   │
│   city       : String (required)                             │
│   state      : String                                        │
│   country    : String (default: USA)                         │
│   zipCode    : String                                        │
│   fullAddress: String                                        │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ location: {                                                  │
│   type       : Enum [Point]                                  │
│   coordinates: [Number] (longitude, latitude)                │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ price: {                                                     │
│   perNight   : Number (required, min 0)                      │
│   currency   : String (default: USD)                         │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ capacity: {                                                  │
│   guests     : Number (required, min 1)                      │
│   bedrooms   : Number (default: 1)                           │
│   beds       : Number (default: 1)                           │
│   bathrooms  : Number (default: 1)                           │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ amenities    : [Enum] (wifi, pool, parking, ...)             │
│ images       : [{url, caption}]                              │
├──────────────────────────────────────────────────────────────┤
│ rules: {                                                     │
│   checkIn         : String (default: 15:00)                  │
│   checkOut        : String (default: 11:00)                  │
│   smokingAllowed  : Boolean (default: false)                 │
│   petsAllowed     : Boolean (default: false)                 │
│   partiesAllowed  : Boolean (default: false)                 │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ rating: {                                                    │
│   average    : Number (0-5, default: 0)                      │
│   count      : Number (default: 0)                           │
│ }                                                            │
├──────────────────────────────────────────────────────────────┤
│ isAvailable  : Boolean (default: true)                       │
│ isApproved   : Boolean (default: false)                      │
│ createdAt    : Date (auto)                                   │
│ updatedAt    : Date (auto)                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 تحلیل فیلدها

### فیلدهای اصلی

#### title - عنوان
```javascript
title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
}
```
**مثال:** `"ویلای ساحلی با استخر خصوصی"`

---

#### description - توضیحات
```javascript
description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
}
```
**مثال:** توضیحات کامل درباره اقامتگاه

---

#### type - نوع اقامتگاه
```javascript
type: {
    type: String,
    enum: ['villa', 'apartment', 'suite', 'eco-lodge', 'cabin', 'hotel', 'house', 'cottage', 'room', 'eco'],
    required: [true, 'Property type is required']
}
```

| نوع | توضیح |
|-----|-------|
| `villa` | ویلا |
| `apartment` | آپارتمان |
| `suite` | سوئیت |
| `eco-lodge` | اقامتگاه بوم‌گردی |
| `cabin` | کلبه |
| `hotel` | هتل |
| `house` | خانه |
| `cottage` | کلبه روستایی |
| `room` | اتاق |
| `eco` | اکو |

---

#### host - میزبان
```javascript
host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
}
```

**توضیح:**
- **`ObjectId`**: رفرنس به کاربر میزبان
- **`ref: 'User'`**: برای populate کردن
- **کاربرد:** ارتباط با مدل User

**استفاده:**
```javascript
// بدون populate
property.host // "65abc123..."

// با populate
const property = await Property.findById(id).populate('host', 'name email');
property.host // { _id: "...", name: "Ali", email: "..." }
```

---

### آبجکت: address

```javascript
address: {
    city: {
        type: String,
        required: [true, 'City is required']
    },
    state: String,
    country: {
        type: String,
        default: 'USA'
    },
    zipCode: String,
    fullAddress: String
}
```

**مثال document:**
```json
{
    "address": {
        "city": "Tehran",
        "state": "Tehran",
        "country": "Iran",
        "zipCode": "1234567890",
        "fullAddress": "خیابان ولیعصر، پلاک 123"
    }
}
```

---

### آبجکت: location (GeoJSON)

```javascript
location: {
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number],
        default: [0, 0]
    }
}
```

**فرمت GeoJSON:**
```json
{
    "location": {
        "type": "Point",
        "coordinates": [51.3890, 35.6892] // [longitude, latitude]
    }
}
```

**⚠️ توجه:** ترتیب مختصات: **[طول جغرافیایی, عرض جغرافیایی]**

**کاربرد:** جستجوی جغرافیایی با index `2dsphere`

---

### آبجکت: price

```javascript
price: {
    perNight: {
        type: Number,
        required: [true, 'Price per night is required'],
        min: [0, 'Price cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD'
    }
}
```

**مثال:**
```json
{
    "price": {
        "perNight": 150,
        "currency": "USD"
    }
}
```

---

### آبجکت: capacity

```javascript
capacity: {
    guests: {
        type: Number,
        required: [true, 'Guest capacity is required'],
        min: [1, 'At least 1 guest required']
    },
    bedrooms: { type: Number, default: 1 },
    beds: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 }
}
```

**مثال:**
```json
{
    "capacity": {
        "guests": 6,
        "bedrooms": 3,
        "beds": 4,
        "bathrooms": 2
    }
}
```

---

### آرایه: amenities

```javascript
amenities: [{
    type: String,
    enum: ['wifi', 'parking', 'pool', 'kitchen', 'ac', 'heating', 'tv', 
           'washer', 'dryer', 'balcony', 'garden', 'bbq', 'gym', 
           'hot-tub', 'fireplace', 'beach-access', 'mountain-view', 'pet-friendly']
}]
```

| امکانات | توضیح |
|---------|-------|
| `wifi` | اینترنت وایرلس |
| `parking` | پارکینگ |
| `pool` | استخر |
| `kitchen` | آشپزخانه |
| `ac` | کولر |
| `heating` | گرمایش |
| `tv` | تلویزیون |
| `washer` | ماشین لباسشویی |
| `dryer` | خشک‌کن |
| `balcony` | بالکن |
| `garden` | باغ |
| `bbq` | باربیکیو |
| `gym` | باشگاه |
| `hot-tub` | جکوزی |
| `fireplace` | شومینه |
| `beach-access` | دسترسی به ساحل |
| `mountain-view` | منظره کوهستان |
| `pet-friendly` | حیوان خانگی مجاز |

**مثال:**
```json
{
    "amenities": ["wifi", "parking", "pool", "kitchen", "ac"]
}
```

---

### آرایه: images

```javascript
images: [{
    url: String,
    caption: String
}]
```

**مثال:**
```json
{
    "images": [
        {
            "url": "data:image/jpeg;base64,/9j/4AAQ...",
            "caption": "نمای بیرونی"
        },
        {
            "url": "https://example.com/image2.jpg",
            "caption": "اتاق خواب اصلی"
        }
    ]
}
```

---

### آبجکت: rules

```javascript
rules: {
    checkIn: { type: String, default: '15:00' },
    checkOut: { type: String, default: '11:00' },
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    partiesAllowed: { type: Boolean, default: false }
}
```

**مثال:**
```json
{
    "rules": {
        "checkIn": "14:00",
        "checkOut": "12:00",
        "smokingAllowed": false,
        "petsAllowed": true,
        "partiesAllowed": false
    }
}
```

---

### آبجکت: rating

```javascript
rating: {
    average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    count: {
        type: Number,
        default: 0
    }
}
```

**توضیح:**
- **average:** میانگین امتیاز (0-5)
- **count:** تعداد نظرات

**نحوه محاسبه:**
```javascript
rating.average = totalStars / numberOfReviews
rating.count = numberOfReviews
```

---

### فیلدهای وضعیت

```javascript
isAvailable: { type: Boolean, default: true },
isApproved: { type: Boolean, default: false },
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now }
```

| فیلد | توضیح |
|------|-------|
| `isAvailable` | آیا برای رزرو موجود است؟ |
| `isApproved` | آیا توسط ادمین تأیید شده؟ |
| `createdAt` | تاریخ ایجاد |
| `updatedAt` | تاریخ آخرین بروزرسانی |

**جریان تأیید:**
```
1. میزبان اقامتگاه را ثبت می‌کند (isApproved: false)
2. ادمین بررسی می‌کند
3. ادمین تأیید می‌کند (isApproved: true)
4. اقامتگاه در لیست عمومی نمایش داده می‌شود
```

---

## 🔍 Index‌ها

```javascript
// جستجوی متنی
propertySchema.index({ 'address.city': 'text', title: 'text', description: 'text' });

// مرتب‌سازی قیمت
propertySchema.index({ 'price.perNight': 1 });

// فیلتر نوع
propertySchema.index({ type: 1 });

// فیلتر ظرفیت
propertySchema.index({ 'capacity.guests': 1 });

// جستجوی جغرافیایی
propertySchema.index({ location: '2dsphere' });
```

**چرا Index؟**
- **سرعت:** جستجوی سریع‌تر
- **Text Index:** جستجوی full-text
- **2dsphere:** جستجوی مکانی

**استفاده از Text Index:**
```javascript
// جستجوی متنی
await Property.find({ $text: { $search: "ویلا ساحلی" } });
```

**استفاده از 2dsphere:**
```javascript
// اقامتگاه‌های نزدیک یک نقطه
await Property.find({
    location: {
        $near: {
            $geometry: { type: "Point", coordinates: [51.38, 35.68] },
            $maxDistance: 10000 // 10 کیلومتر
        }
    }
});
```

---

## 🧪 مثال‌های استفاده

### ایجاد اقامتگاه
```javascript
const property = await Property.create({
    title: "ویلای ساحلی زیبا",
    description: "ویلای سه خوابه با استخر...",
    type: "villa",
    host: req.user.id,
    address: { city: "Chalus", country: "Iran" },
    price: { perNight: 200 },
    capacity: { guests: 8, bedrooms: 3 },
    amenities: ["wifi", "pool", "parking"]
});
```

### جستجوی پیشرفته
```javascript
const properties = await Property.find({
    isApproved: true,
    isAvailable: true,
    'address.city': 'Tehran',
    'price.perNight': { $gte: 100, $lte: 300 },
    'capacity.guests': { $gte: 4 },
    amenities: { $all: ['wifi', 'pool'] }
}).populate('host', 'name').sort({ 'price.perNight': 1 });
```

### بروزرسانی امتیاز
```javascript
property.rating.average = 4.5;
property.rating.count = 25;
await property.save();
```
