# ECE-RKV Backend API

This is the backend service for the ECE-RKV Smart Department Portal. Built with Node.js and Express, it powers authentication, user management, attendance, marks, chat, and notifications for the platform.

---

## 🚀 Features

- **Secure JWT Authentication & Role-based Access**
- **Student, Faculty, and Admin Management**
- **Attendance Tracking and Analytics**
- **Marks and Assessment Management**
- **Real-time Notifications (Web Push, Email)**
- **Chat System with WebSockets (Socket.io)**
- **RESTful API and WebSocket Endpoints**
- **Environment-based Configurations**

---

## 🛠️ Tech Stack

- **Node.js** + **Express** (REST API)
- **MySQL** (Relational Database)
- **Socket.io** (Real-time chat)
- **Nodemailer** (Email notifications)
- **Web Push** (Push notifications)
- **JWT** (Authentication)
- **Firebase** (Web push key storage/management)
- **dotenv** (Environment management)

---

## ⚙️ Environment Variables

Create a `.env` file in the backend directory and define the following variables:

```env
PORT=5000
DB_HOST=localhost
DB_NAME=ece_db
DB_USER=youruser
DB_PASSWORD=yourpassword
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:5173
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
VAPID_PUBLIC=your_vapid_public_key
VAPID_PRIVATE=your_vapid_private_key
VAPID_SUBJECT=mailto:your@email.com
OTP_EXPIRY_MINUTES=10
TZ=Asia/Kolkata
API_BASE_URL=https://your-backend-url
```

---

## 📦 Installation & Running

1. **Install dependencies**
    ```sh
    npm install
    ```
2. **Run database migrations**  
   *(if applicable, describe your migration step here)*

3. **Start in development mode**
    ```sh
    npm run dev
    ```
   Or in production:
    ```sh
    npm start
    ```

---

## 📚 API Overview

### Authentication

- `POST /api/auth/login` — User login (JWT issued)
- `POST /api/auth/register` — Register user (admin/faculty)
- `POST /api/auth/otp` — OTP verification (if enabled)
- `POST /api/auth/refresh` — Refresh token

### Students

- `GET /api/students` — Fetch class roster (by year, semester, section, etc.)
- `GET /api/students/:id` — Fetch student profile

### Attendance

- `GET /api/attendance/student/:id` — Attendance stats for a student
- `POST /api/attendance/mark` — Mark attendance (faculty/admin)

### Marks

- `GET /api/marks/student/:id/summary` — Marks summary for a student
- `POST /api/marks/record` — Record marks (faculty/admin)

### Chat

- **WebSocket endpoint:** `/api/chat`
- Real-time messaging via Socket.io for authenticated users

### Notifications

- Web push and email notifications for important events

---

## 🛡️ Security

- All endpoints (except authentication) require a valid JWT token.
- CORS and allowed origins are enforced based on configuration.
- Passwords and secrets are never stored in code.

---

## 📝 License

Distributed under the MIT License. See [`../LICENSE`](../LICENSE) for details.

---

## 📫 Contact

For questions or support, contact the maintainer at [AdiCoder33](https://github.com/AdiCoder33).

---
