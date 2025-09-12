# ECE-RKV: Smart Department Portal

> **ECE-RKV** is a modern, full-stack portal designed to streamline and digitize department operations for educational institutions. It provides a seamless interface for students, faculty, and administrators to manage attendance, marks, scheduling, notifications, real-time chat, and more—powered by a robust backend and a cutting-edge frontend.

---

## 🚀 Features

- **Role-based Authentication & Authorization**
  - Secure JWT-based login for students, faculty, and admins
- **Attendance Management**
  - Mark, view, and analyze attendance trends interactively
- **Marks & Assessment Tracking**
  - Record, summarize, and visualize marks and progress
- **Real-time Notifications**
  - Web push and email alerts for key events
- **Smart Scheduling**
  - Timetable and class management
- **Chat Feature**
  - Secure, real-time messaging for students, faculty, and admins
- **Customizable API**
  - RESTful backend with extensive endpoints for integration
- **Responsive UI**
  - Built with React, shadcn-ui, and Tailwind CSS for a modern experience

---

## 🛠️ Tech Stack

| Frontend             | Backend            | Infrastructure         |
|----------------------|-------------------|------------------------|
| React + TypeScript   | Node.js + Express | MySQL                  |
| Vite                 | JWT Auth          | Firebase (for push)    |
| Tailwind CSS         | Nodemailer        | Render (deployment)    |
| shadcn-ui            | Web Push, Socket.io| GitHub Codespaces      |

---

## 📦 Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/AdiCoder33/ECE-RKV.git
cd ECE-RKV
```

### 2. Install Dependencies

**Frontend:**
```sh
npm install
```

**Backend:**
```sh
cd backend
npm install
```

### 3. Environment Configuration

- Copy `.env.example` to `.env` in both root and `/backend`
- Set the following variables (see backend/README.md for full list):

```env
# Frontend (.env)
VITE_API_URL=https://your-backend-url/api

# Backend (.env)
PORT=5000
DB_HOST=localhost
DB_NAME=ece_db
DB_USER=youruser
DB_PASSWORD=yourpassword
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:5173
EMAIL_HOST=smtp.example.com
...
```

### 4. Development

**Frontend:**
```sh
npm run dev
```

**Backend:**
```sh
npm run dev
```

Access the frontend at `http://localhost:5173` and the backend API at `http://localhost:5000/api`

---

## 🏗️ Project Structure

```
ECE-RKV/
├── backend/         # Express API & business logic
├── public/          # Static assets
├── src/             # Frontend source (React)
├── .env             # Frontend env variables
└── README.md
```

---

## 🔒 Security & Best Practices

- All sensitive operations require JWT authentication.
- CORS and allowed origins are configurable for production.
- Passwords and secrets are **never** hardcoded.

---

## 🌐 Deployment

- **Render:** Configure environment variables and deploy backend and frontend as needed. You can use Render, Vercel, Netlify, or any cloud provider that supports Node.js and static site hosting.
- **Custom Domain:** Set up using your hosting provider’s domain configuration guide.

---

## 📓 API Overview

See [`backend/README.md`](./backend/README.md) for detailed API documentation, including endpoints for:

- `/students` – Fetch class rosters
- `/attendance/student/:id` – Attendance stats
- `/marks/student/:id/summary` – Mark summaries
- `/chat` – Real-time chat endpoints and WebSocket integration

All endpoints require JWT and role validation for access control.

---

## 📝 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.

---

## 📫 Contact

- **Repository:** [GitHub](https://github.com/AdiCoder33/ECE-RKV)
- **Maintainer:** [AdiCoder33](https://github.com/AdiCoder33)

---

> _Transforming department management for the digital age. Experience seamless, secure, and smart education workflows with ECE-RKV._
