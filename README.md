# StayLocal - Accommodation Management & Rental System

A modern, responsive web application for managing and renting local accommodations including villas, apartments, eco-lodges, and suites.

![StayLocal](assets/images/img_1.png)

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

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3.3
- **Storage**: LocalStorage (for demo purposes)
- **Icons**: Bootstrap Icons
- **Fonts**: Google Fonts

## 📁 Project Structure

```
Local-accommodation-management-and-rental-system/
├── index.html                 # Landing page
├── README.md                  # Project documentation
├── assets/
│   ├── css/
│   │   └── style.css         # Global styles
│   ├── images/               # Property and UI images
│   └── js/
│       └── utils.js          # Utility functions
└── pages/
    ├── add-property.html     # Add new property (hosts only)
    ├── admin.html            # Admin dashboard
    ├── contact.html          # Contact page with FAQ
    ├── homePage.html         # Alternative home page
    ├── loginup.html          # Login & Registration
    ├── profile.html          # User profile management
    ├── properties.html       # Property listings with search
    └── property-detail.html  # Individual property details
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, but recommended)

### Installation

1. **Clone or Download** the repository:
   ```bash
   git clone https://github.com/yourusername/Local-accommodation-management-and-rental-system.git
   ```

2. **Navigate** to the project directory:
   ```bash
   cd Local-accommodation-management-and-rental-system
   ```

3. **Open** the project:
   - **Option A**: Simply open `index.html` in your browser
   - **Option B**: Use a local server (recommended):
     ```bash
     # Using Python 3
     python -m http.server 8080
     
     # Using Node.js (with http-server)
     npx http-server
     
     # Using VS Code Live Server extension
     # Right-click index.html → "Open with Live Server"
     ```

4. **Access** the application at `http://localhost:8080` (or your configured port)

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
