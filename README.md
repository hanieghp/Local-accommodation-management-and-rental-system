# StayLocal - Accommodation Management & Rental System

A full-stack web application for managing and renting local accommodations including villas, apartments, eco-lodges, and suites.

![StayLocal](frontend/assets/images/img_1.png)

## 📁 Project Structure

```
Local-accommodation-management-and-rental-system/
├── frontend/                 # Frontend (HTML, CSS, JS)
│   ├── index.html           # Main landing page
│   ├── pages/               # HTML pages
│   │   ├── add-property.html
│   │   ├── admin.html
│   │   ├── contact.html
│   │   ├── loginup.html
│   │   ├── profile.html
│   │   ├── properties.html
│   │   └── property-detail.html
│   └── assets/
│       ├── css/
│       │   └── style.css
│       ├── js/
│       │   ├── utils.js
│       │   └── api.js       # API service for backend
│       └── images/
│
├── backend/                  # Backend (Node.js + Express + MongoDB)
│   ├── server.js            # Main server file
│   ├── package.json         # Dependencies
│   ├── .env                 # Environment variables
│   ├── config/
│   │   └── db.js            # Database connection
│   ├── models/
│   │   ├── User.js          # User model
│   │   ├── Property.js      # Property model
│   │   ├── Reservation.js   # Reservation model
│   │   └── Notification.js  # Notification model
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User management routes
│   │   ├── properties.js    # Property CRUD routes
│   │   ├── reservations.js  # Reservation CRUD routes
│   │   ├── notifications.js # Notification routes
│   │   └── reports.js       # Reporting routes
│   └── middleware/
│       └── auth.js          # JWT authentication
│
└── README.md
```

## 🌟 Features

### For Travelers
- **Browse Properties**: Explore a wide variety of accommodations with detailed information
- **Advanced Search**: Search by location with smart city aliases (e.g., "LA" finds "Los Angeles")
- **Filter Options**: Filter by price range, property type, capacity, and amenities
- **Booking System**: Easy reservation process with date selection and guest count
- **User Profile**: Manage personal information, view reservations, and track booking history
- **Reviews**: Read and write reviews for properties

### For Hosts
- **Property Management**: Add, edit, and manage your property listings
- **Booking Management**: View and manage incoming booking requests
- **Dashboard**: Track your properties' performance and reservations
- **Property Details**: Add comprehensive information including amenities, photos, and pricing

### For Administrators
- **User Management**: Full CRUD operations for managing users
- **Property Approval**: Review and approve/reject property listings
- **Reservation Oversight**: Monitor all reservations across the platform
- **Reports Dashboard**: View statistics on users, properties, and bookings
- **Role Management**: Assign roles (Traveler, Host, Admin) to users

## 🛠️ Technologies Used

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **UI Framework**: Bootstrap 5.3.3
- **Fonts**: Google Fonts (Inter)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, CORS, express-validator

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- VS Code with Live Server extension (recommended)

### Backend Setup

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/staylocal
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5500
   ```

4. **Start the server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

### Frontend Setup

1. Open VS Code in the `frontend` folder
2. Right-click on `index.html` → "Open with Live Server"
3. Frontend will be available at `http://localhost:5500`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/updateprofile` | Update profile |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | Get all (with search & filter) |
| GET | `/api/properties/:id` | Get single property |
| POST | `/api/properties` | Create property (Host) |
| PUT | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |

### Reservations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reservations` | Get user's reservations |
| POST | `/api/reservations` | Create reservation |
| PUT | `/api/reservations/:id/confirm` | Confirm (Host) |
| PUT | `/api/reservations/:id/cancel` | Cancel reservation |

### Reports (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Dashboard stats |
| GET | `/api/reports/revenue` | Revenue report |

## 📁 Project Structure (Legacy Files)

The root `index.html`, `pages/`, and `assets/` folders are kept for backward compatibility. 
The main development should be done in the `frontend/` folder.

## 👤 User Roles & Access

### Traveler (Default)
- Browse and search properties
- Make reservations
- Manage personal profile
- View booking history

### Host
- All Traveler features
- Add and manage properties
- View incoming bookings
- Access host dashboard

### Admin
- Full system access
- User management (CRUD)
- Property approval/rejection
- Reservation management
- System reports

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@staylocal.com | any password |
| Host | Register with "Host" role | your choice |
| Traveler | Register with "Traveler" role | your choice |

## 📱 Pages Overview

### Home Page (`index.html`)
- Hero section with search functionality
- Featured properties carousel
- "Why Choose Us" section
- FAQ accordion
- Customer testimonials

### Properties (`pages/properties.html`)
- Grid view of all available properties
- Search bar with smart matching
- Filter sidebar (price, type, capacity, amenities)
- Property cards with quick info

### Property Details (`pages/property-detail.html`)
- Full property information
- Photo gallery
- Amenities list
- Host information
- Booking form with date picker
- Customer reviews

### Login/Register (`pages/loginup.html`)
- Toggle between login and registration
- Role selection (Traveler/Host)
- Form validation
- Remember me functionality

### User Profile (`pages/profile.html`)
- Personal information management
- Reservation history
- My Properties (hosts only)
- Incoming Bookings (hosts only)
- Notifications
- Settings

### Admin Panel (`pages/admin.html`)
- Dashboard with statistics
- User management table
- Property approval queue
- Reservation overview
- Reports section

### Add Property (`pages/add-property.html`)
- Multi-section form
- Property details input
- Amenities selection
- Photo upload
- Pricing configuration

### Contact (`pages/contact.html`)
- Contact form
- FAQ section
- Office information

## 💾 Data Storage

This demo application uses **localStorage** for data persistence. The following keys are used:

| Key | Description |
|-----|-------------|
| `userLoggedIn` | Boolean login status |
| `userName` | Current user's name |
| `userEmail` | Current user's email |
| `userRole` | User role (traveler/host/admin) |
| `userProfile` | JSON object with profile details |
| `registeredUsers` | Array of all registered users |
| `adminUsers` | Admin panel user data |
| `adminProperties` | Admin panel property data |
| `adminReservations` | Admin panel reservation data |
---
