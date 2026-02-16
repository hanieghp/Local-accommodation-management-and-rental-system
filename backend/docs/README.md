# 📚 مستندات Backend - StayLocal

## 🏠 سیستم مدیریت و اجاره اقامتگاه‌های محلی

این پوشه شامل مستندات کامل تمام فایل‌های Backend پروژه است.

---

## 📁 ساختار فایل‌ها

```
backend/
├── server.js                    # سرور اصلی Express
├── package.json                 # وابستگی‌ها
├── .env                         # متغیرهای محیطی
│
├── config/
│   └── db.js                    # اتصال به MongoDB
│
├── middleware/
│   └── auth.js                  # احراز هویت JWT
│
├── models/
│   ├── User.js                  # مدل کاربر
│   ├── Property.js              # مدل اقامتگاه
│   ├── Reservation.js           # مدل رزرو
│   ├── Notification.js          # مدل نوتیفیکیشن
│   └── Ticket.js                # مدل تیکت پشتیبانی
│
├── routes/
│   ├── auth.js                  # مسیرهای احراز هویت
│   ├── users.js                 # مدیریت کاربران
│   ├── properties.js            # مدیریت اقامتگاه‌ها
│   ├── reservations.js          # مدیریت رزروها
│   ├── notifications.js         # مدیریت نوتیفیکیشن‌ها
│   ├── reports.js               # گزارشات و آمار
│   └── tickets.js               # تیکت پشتیبانی
│
├── scripts/
│   ├── createAdmin.js           # ایجاد ادمین
│   └── resetAdminPassword.js    # ریست رمز ادمین
│
└── docs/                        # ← شما اینجا هستید
    ├── README.md                # این فایل
    ├── server.md
    ├── package-json.md
    ├── config-db.md
    ├── middleware-auth.md
    ├── models-User.md
    ├── models-Property.md
    ├── models-Reservation.md
    ├── models-Notification.md
    ├── models-Ticket.md
    ├── routes-auth.md
    ├── routes-users.md
    ├── routes-properties.md
    ├── routes-reservations.md
    ├── routes-notifications.md
    ├── routes-reports.md
    ├── routes-tickets.md
    ├── scripts-createAdmin.md
    └── scripts-resetAdminPassword.md
```

---

## 📖 فهرست مستندات

### ⚙️ پیکربندی

| فایل | مستند | توضیح |
|------|-------|-------|
| `server.js` | [server.md](server.md) | سرور اصلی Express، middleware، routing |
| `package.json` | [package-json.md](package-json.md) | وابستگی‌ها و scripts |
| `config/db.js` | [config-db.md](config-db.md) | اتصال به MongoDB |
| `middleware/auth.js` | [middleware-auth.md](middleware-auth.md) | JWT و بررسی نقش |

### 📊 مدل‌ها (Schemas)

| فایل | مستند | توضیح |
|------|-------|-------|
| `models/User.js` | [models-User.md](models-User.md) | کاربران (traveler, host, admin) |
| `models/Property.js` | [models-Property.md](models-Property.md) | اقامتگاه‌ها |
| `models/Reservation.js` | [models-Reservation.md](models-Reservation.md) | رزروها و قیمت‌گذاری |
| `models/Notification.js` | [models-Notification.md](models-Notification.md) | اعلان‌ها |
| `models/Ticket.js` | [models-Ticket.md](models-Ticket.md) | تیکت پشتیبانی |

### 🛤️ مسیرها (Routes/APIs)

| فایل | مستند | توضیح |
|------|-------|-------|
| `routes/auth.js` | [routes-auth.md](routes-auth.md) | ثبت‌نام، ورود، پروفایل |
| `routes/users.js` | [routes-users.md](routes-users.md) | مدیریت کاربران (Admin) |
| `routes/properties.js` | [routes-properties.md](routes-properties.md) | CRUD اقامتگاه‌ها |
| `routes/reservations.js` | [routes-reservations.md](routes-reservations.md) | رزرو، تأیید، لغو، PDF |
| `routes/notifications.js` | [routes-notifications.md](routes-notifications.md) | نوتیفیکیشن‌ها |
| `routes/reports.js` | [routes-reports.md](routes-reports.md) | داشبورد و آمار |
| `routes/tickets.js` | [routes-tickets.md](routes-tickets.md) | تیکت پشتیبانی |

### 🔧 اسکریپت‌ها

| فایل | مستند | توضیح |
|------|-------|-------|
| `scripts/createAdmin.js` | [scripts-createAdmin.md](scripts-createAdmin.md) | ایجاد کاربر ادمین |
| `scripts/resetAdminPassword.js` | [scripts-resetAdminPassword.md](scripts-resetAdminPassword.md) | ریست رمز ادمین |

---

## 🚀 راه‌اندازی سریع

### 1. نصب وابستگی‌ها
```bash
cd backend
npm install
```

### 2. تنظیم متغیرهای محیطی
```bash
# ایجاد فایل .env
MONGODB_URI=mongodb://localhost:27017/staylocal
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
PORT=5000
```

### 3. ایجاد ادمین
```bash
cd scripts
node createAdmin.js
```

### 4. اجرای سرور
```bash
cd backend
npm run dev
```

---

## 📡 خلاصه API‌ها

### 🔐 احراز هویت (`/api/auth`)

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| POST | `/register` | Public | ثبت‌نام |
| POST | `/login` | Public | ورود |
| GET | `/me` | Private | پروفایل |
| PUT | `/updateprofile` | Private | بروزرسانی |
| PUT | `/changepassword` | Private | تغییر رمز |
| POST | `/forgotpassword` | Public | فراموشی رمز |

### 👥 کاربران (`/api/users`)

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/` | Admin | لیست کاربران |
| GET | `/:id` | Admin | جزئیات کاربر |
| PUT | `/:id/role` | Admin | تغییر نقش |
| PUT | `/:id/status` | Admin | فعال/غیرفعال |
| DELETE | `/:id` | Admin | حذف |

### 🏠 اقامتگاه‌ها (`/api/properties`)

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/` | Public | لیست با فیلتر |
| GET | `/:id` | Public | جزئیات |
| POST | `/` | Host | ایجاد |
| PUT | `/:id` | Host/Admin | بروزرسانی |
| DELETE | `/:id` | Host/Admin | حذف |
| GET | `/host/my-properties` | Host | اقامتگاه‌های من |
| PUT | `/:id/approve` | Admin | تأیید |
| GET | `/admin/pending` | Admin | در انتظار تأیید |

### 📅 رزروها (`/api/reservations`)

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/` | Private | رزروهای من |
| GET | `/host` | Host | رزروهای دریافتی |
| GET | `/:id` | Private | جزئیات |
| POST | `/` | Private | ایجاد رزرو |
| PUT | `/:id/confirm` | Host | تأیید |
| PUT | `/:id/cancel` | Private | لغو |
| PUT | `/:id/review` | Guest | ثبت نظر |
| GET | `/:id/receipt` | Private | دانلود PDF |

### 🔔 نوتیفیکیشن‌ها (`/api/notifications`)

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/` | Private | لیست |
| PUT | `/:id/read` | Private | خواندن |
| PUT | `/read-all` | Private | همه خوانده |
| DELETE | `/:id` | Private | حذف |
| DELETE | `/` | Private | حذف همه |

### 📊 گزارشات (`/api/reports`)

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/dashboard` | Admin | داشبورد ادمین |
| GET | `/host-stats` | Host | آمار میزبان |

### 🎫 تیکت‌ها (`/api/tickets`)

| متد | مسیر | دسترسی | توضیح |
|-----|------|--------|-------|
| GET | `/` | Private | لیست تیکت‌ها |
| GET | `/:id` | Private | جزئیات |
| POST | `/` | Private | ایجاد تیکت |
| POST | `/:id/reply` | Private | پاسخ |
| PUT | `/:id/status` | Admin | تغییر وضعیت |

---

## 🔑 نقش‌ها و دسترسی‌ها

| نقش | توضیح | دسترسی‌ها |
|-----|-------|-----------|
| `traveler` | مسافر | رزرو، نظر، نوتیفیکیشن، تیکت |
| `host` | میزبان | + ایجاد اقامتگاه، تأیید رزرو |
| `admin` | مدیر | + مدیریت کاربران، تأیید اقامتگاه، گزارشات |

---

## 🛡️ احراز هویت

### ارسال توکن در Header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### ساختار توکن JWT:
```json
{
  "id": "65abc123...",
  "iat": 1704067200,
  "exp": 1704672000
}
```

---

## 📦 وابستگی‌ها

| پکیج | نسخه | کاربرد |
|------|------|--------|
| express | 4.18.2 | فریم‌ورک وب |
| mongoose | 8.0.0 | MongoDB ODM |
| jsonwebtoken | 9.0.2 | احراز هویت |
| bcryptjs | 2.4.3 | هش رمز عبور |
| cors | 2.8.5 | Cross-Origin |
| express-validator | 7.0.1 | اعتبارسنجی |
| pdfkit | 0.15.0 | تولید PDF |
| dotenv | 16.3.1 | متغیرهای محیطی |

---

## 📞 پشتیبانی

در صورت وجود سؤال یا مشکل:
1. ابتدا مستندات مربوطه را مطالعه کنید
2. مشکلات را در Issues گیت‌هاب ثبت کنید
3. برای سؤالات فوری از تیکت پشتیبانی استفاده کنید
