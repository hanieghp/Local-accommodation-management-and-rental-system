# 📄 models/User.js - مدل کاربر

## 📋 توضیحات کلی
این فایل Schema و Model کاربران را تعریف می‌کند. شامل فیلدها، اعتبارسنجی، متدهای کمکی و middleware‌های Mongoose است.

---

## 📝 کد کامل

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['traveler', 'host', 'admin'],
        default: 'traveler'
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

## 📝 تحلیل خط به خط

### خط 1-2: Import وابستگی‌ها
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
```

| Import | کاربرد |
|--------|--------|
| `mongoose` | ODM برای MongoDB |
| `bcrypt` | هش کردن رمز عبور |

---

## 📊 ساختار Schema

### خط 4: شروع تعریف Schema
```javascript
const userSchema = new mongoose.Schema({
```
**توضیح:** یک Schema جدید ایجاد می‌کند که ساختار document‌های کاربر را مشخص می‌کند.

---

### فیلد: name
```javascript
name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
}
```

| Option | مقدار | توضیح |
|--------|-------|-------|
| `type` | `String` | نوع داده |
| `required` | `[true, 'message']` | اجباری با پیام خطا |
| `trim` | `true` | حذف فاصله‌های اضافی |
| `maxlength` | `[50, 'message']` | حداکثر طول |

**مثال:**
```javascript
// ✅ معتبر
{ name: "Ali Ahmadi" }

// ❌ نامعتبر
{ name: "" }  // Name is required
{ name: "A".repeat(51) }  // Name cannot exceed 50 characters
```

---

### فیلد: email
```javascript
email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
}
```

| Option | مقدار | توضیح |
|--------|-------|-------|
| `unique` | `true` | ایمیل باید یکتا باشد |
| `lowercase` | `true` | تبدیل به حروف کوچک |
| `match` | `[regex, 'message']` | اعتبارسنجی با regex |

**Regex توضیح:**
```
^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$

^             شروع رشته
\w+           یک یا چند کاراکتر word
([.-]?\w+)*   صفر یا چند بار: نقطه/خط تیره اختیاری + کاراکترها
@             علامت @
\w+           یک یا چند کاراکتر (دامنه)
([.-]?\w+)*   ساب‌دامنه‌های اختیاری
(\.\w{2,3})+  یک یا چند بار: نقطه + 2-3 کاراکتر (com, ir, ...)
$             پایان رشته
```

**مثال:**
```javascript
// ✅ معتبر
"ali@gmail.com"
"test.user@example.co.uk"

// ❌ نامعتبر
"ali@"
"ali.gmail.com"
```

---

### فیلد: password
```javascript
password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
}
```

| Option | مقدار | توضیح |
|--------|-------|-------|
| `minlength` | `[6, 'message']` | حداقل 6 کاراکتر |
| `select` | `false` | 🔒 در query‌ها برنگردد |

**`select: false` چیست؟**
```javascript
// بدون select: false
const user = await User.findById(id);
// user.password قابل دسترسی است ❌

// با select: false
const user = await User.findById(id);
// user.password = undefined ✅

// اگر نیاز به password داشتیم:
const user = await User.findById(id).select('+password');
```

---

### فیلد: phone
```javascript
phone: {
    type: String,
    trim: true
}
```

| Option | توضیح |
|--------|-------|
| اختیاری | `required` ندارد |
| `trim` | حذف فاصله‌ها |

---

### فیلد: role
```javascript
role: {
    type: String,
    enum: ['traveler', 'host', 'admin'],
    default: 'traveler'
}
```

| Option | مقدار | توضیح |
|--------|-------|-------|
| `enum` | `[...]` | فقط این مقادیر مجازند |
| `default` | `'traveler'` | مقدار پیش‌فرض |

**نقش‌ها:**
| نقش | توضیح |
|-----|-------|
| `traveler` | مسافر - می‌تواند رزرو کند |
| `host` | میزبان - می‌تواند اقامتگاه اضافه کند |
| `admin` | مدیر - دسترسی کامل |

---

### فیلد: avatar
```javascript
avatar: {
    type: String,
    default: 'default-avatar.png'
}
```

**توضیح:** آدرس تصویر پروفایل. می‌تواند Base64 یا URL باشد.

---

### فیلد: isActive
```javascript
isActive: {
    type: Boolean,
    default: true
}
```

**کاربرد:** 
- `true`: حساب فعال
- `false`: حساب مسدود شده

**مزیت:** به جای حذف کامل، حساب غیرفعال می‌شود (soft delete).

---

### فیلد: createdAt
```javascript
createdAt: {
    type: Date,
    default: Date.now
}
```

**توضیح:** تاریخ ایجاد حساب - به صورت خودکار تنظیم می‌شود.

---

## 🪝 Middleware: هش کردن رمز

```javascript
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
```

### توضیح خط به خط:

**خط 1:** Pre-save hook
```javascript
userSchema.pre('save', async function(next) {
```
- **`pre('save')`**: قبل از ذخیره document اجرا شود
- **`async function`**: باید function معمولی باشد (نه arrow) تا `this` کار کند

**خط 2-4:** بررسی تغییر password
```javascript
    if (!this.isModified('password')) {
        next();
    }
```
- **`this.isModified('password')`**: آیا password تغییر کرده؟
- اگر تغییر نکرده، نیازی به هش مجدد نیست

**چرا مهم است؟**
```javascript
// ویرایش نام - password تغییر نکرده
user.name = "New Name";
await user.save(); // password دوباره هش نمی‌شود ✅

// تغییر رمز
user.password = "newpassword";
await user.save(); // password هش می‌شود ✅
```

**خط 5-6:** ایجاد salt و هش
```javascript
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
```

**Salt چیست؟**
یک رشته تصادفی که به password اضافه می‌شود تا هش یکتا باشد.

**عدد 10 چیست؟**
تعداد rounds - هرچه بیشتر، امن‌تر ولی کندتر.

| Rounds | زمان تقریبی |
|--------|-------------|
| 10 | ~100ms |
| 12 | ~300ms |
| 14 | ~1s |

---

## 🔧 متد: مقایسه رمز

```javascript
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
```

**توضیح:**
- **`userSchema.methods`**: متدهای instance
- **`matchPassword`**: نام متد
- **`bcrypt.compare()`**: مقایسه رمز وارد شده با هش ذخیره شده

**استفاده:**
```javascript
const user = await User.findOne({ email }).select('+password');
const isMatch = await user.matchPassword('password123');
if (isMatch) {
    // ورود موفق
}
```

---

## 📤 Export مدل

```javascript
module.exports = mongoose.model('User', userSchema);
```

**توضیح:**
- **`mongoose.model('User', userSchema)`**: مدل را ایجاد می‌کند
- **`'User'`**: نام مدل (collection در MongoDB: `users`)
- **خروجی:** Model class برای کار با دیتابیس

---

## 📊 نمای کامل Schema

```
┌────────────────────────────────────────────┐
│                   User                     │
├────────────────────────────────────────────┤
│ _id        : ObjectId (auto)               │
│ name       : String (required, max 50)     │
│ email      : String (required, unique)     │
│ password   : String (required, min 6) 🔒   │
│ phone      : String (optional)             │
│ role       : Enum [traveler|host|admin]    │
│ avatar     : String (default)              │
│ isActive   : Boolean (default: true)       │
│ createdAt  : Date (auto)                   │
└────────────────────────────────────────────┘
```

---

## 🧪 مثال‌های استفاده

### ایجاد کاربر جدید
```javascript
const user = await User.create({
    name: 'Ali Ahmadi',
    email: 'ali@example.com',
    password: 'password123',
    role: 'host'
});
// password به صورت خودکار هش می‌شود
```

### یافتن کاربر
```javascript
// بدون password
const user = await User.findById(id);

// با password
const user = await User.findById(id).select('+password');
```

### بروزرسانی کاربر
```javascript
await User.findByIdAndUpdate(id, { name: 'New Name' });
```

### بررسی رمز
```javascript
const user = await User.findOne({ email }).select('+password');
const isValid = await user.matchPassword('enteredPassword');
```

---

## 📁 ساختار Document در MongoDB

```json
{
    "_id": "65abc123def456789012",
    "name": "Ali Ahmadi",
    "email": "ali@example.com",
    "password": "$2a$10$xyz...", // هش شده
    "phone": "+989121234567",
    "role": "host",
    "avatar": "data:image/jpeg;base64,...",
    "isActive": true,
    "createdAt": "2026-02-16T12:00:00.000Z",
    "__v": 0
}
```
