# UniLift - Student Transportation Management System

## Overview

UniLift is a full-stack web application designed to simplify and improve campus transportation by connecting students with registered drivers. The platform provides a secure and user-friendly environment where students can request rides, while drivers can manage incoming requests and trip information through dedicated dashboards.

The system streamlines transportation management by offering role-based authentication, ride request management, profile management, and administrative oversight.

---

## Features

### Student Features

- Student Registration and Login
- Secure Authentication
- Forgot Password Functionality
- Student Dashboard
- Request a Ride
- View Ride History
- Cancel Ride Requests
- Update Personal Profile
- Account Management

### Driver Features

- Driver Registration and Login
- Driver Dashboard
- Accept or Reject Ride Requests
- View Assigned Trips
- Update Driver Profile
- Manage Vehicle Information
- Help and Support Section

### Administrator Features

- Manage Students
- Manage Drivers
- Manage Vehicles
- View Ride Requests
- Monitor System Activity
- Manage User Accounts

---

## Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript
- Bootstrap

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Authentication

- JWT (JSON Web Tokens)
- Password Encryption

### Development Tools

- Visual Studio Code
- Git & GitHub
- Postman
- MySQL Workbench

---

## System Modules

### Authentication Module

- User Registration
- Login
- Logout
- Password Reset
- Role-Based Access Control

### Student Module

- Request Transportation
- Manage Ride Requests
- View Dashboard
- Update Profile

### Driver Module

- Accept Ride Requests
- View Assigned Trips
- Update Availability
- Manage Driver Information

### Admin Module

- User Management
- Driver Management
- Vehicle Management
- Ride Monitoring
- System Administration

---

## Key Features

- Secure User Authentication
- Role-Based Authorization
- Responsive User Interface
- CRUD Operations
- RESTful API Architecture
- Ride Request Management
- Dashboard Analytics
- Profile Management
- MySQL Database Integration

---

## Database Entities

- Students
- Drivers
- Vehicles
- Ride Requests
- Campuses
- Residential Addresses
- Trip Logs
- Trip Ratings
- Vehicle Maintenance
- Dispute Reports
- Administrators

---

## Project Structure

```
UniLift/
│
├── client/
│   ├── public/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── assets/
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── services/
│
├── database/
│   └── schema.sql
│
├── documentation/
│   └── UniLift_Documentation.pdf
│
├── screenshots/
│
└── README.md
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/yourusername/unilift.git
```

### Navigate into the Project

```bash
cd unilift
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file and configure:

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=unilift

JWT_SECRET=your_secret_key
```

### Start the Server

```bash
npm start
```

or

```bash
npm run dev
```

---

## API Features

- User Authentication
- Student Registration
- Driver Registration
- Login Authentication
- Ride Request Creation
- Ride Status Updates
- Profile Management
- Vehicle Management
- User CRUD Operations

---

## Future Improvements

- Real-time GPS Tracking
- Live Driver Location
- In-App Messaging
- Push Notifications
- Mobile Application
- Online Payments
- Route Optimization
- Emergency SOS Feature
- Google Maps API Integration
- Ride Scheduling

---

## Learning Outcomes

This project provided practical experience in:

- Full-Stack Web Development
- REST API Development
- Node.js & Express.js
- MySQL Database Design
- Authentication & Authorization
- CRUD Operations
- MVC Architecture
- Database Relationships
- Git Version Control
- Team Collaboration
- Software Development Lifecycle (SDLC)

---

## Authors

**Mbali Dyobiso**

Bachelor of Science in Information Technology

---

## License

This project was developed for educational purposes and is intended for learning, demonstration, and portfolio use.
