# Pragati Placement Portal - Backend API

Backend service for the **Pragati Placement Portal**, built with Node.js, Express, Sequelize, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Admin, Student, Company, College).
- **Admin Dashboard**: College management, assessment tracking, dispute resolution, and portal metrics.
- **Company Module**: Job postings, applicant tracking, and interview scheduling.
- **Student Module**: Profile management, course enrollments, assessment submissions, and placement tracking.
- **College Module**: Student performance analytics, company drives, and reporting.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Security & Validation**: JWT, bcryptjs, Joi
- **Notifications/Email**: Resend

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
DB_NAME=pragati_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
```

### 3. Installation
```bash
npm install
```

### 4. Database Seed & Migration
```bash
npm run seed
```

### 5. Running the Application
```bash
# Development / Production
npm start
```
