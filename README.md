# ByteDental

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white&style=flat)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?logo=fastapi&logoColor=white&style=flat)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black&style=flat)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite&logoColor=white&style=flat)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white&style=flat)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-24-2496ED?logo=docker&logoColor=white&style=flat)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

A full-stack dental clinic management system built with FastAPI and React. ByteDental handles patient records, clinical histories (SOAP), treatment tracking, role-based access control, and automated auditing — designed to streamline daily operations for dental offices.

---

## Main Features

### Authentication & Security

- **Google OAuth + Email Login** — Seamless sign-in via Google or email credentials, powered by Firebase Authentication with JWT token verification on every backend request.
- **Role-Based Access Control** — Four system roles (Administrator, Doctor, Assistant, Auditor) with granular per-endpoint permissions enforced through FastAPI dependencies.
- **OTP Password Recovery** — Three-step email verification flow using 4-digit codes with automatic expiration, allowing secure self-service password resets.
- **Forced Password Change** — First-time users are redirected to a mandatory password update screen before accessing the system.

### Administrator

- **User Management** — Full lifecycle control over system users: register new accounts with auto-generated temporary passwords, activate or deactivate users, and assign roles.
- **Dental Services Catalog** — Maintain a catalog of available dental procedures with pricing, descriptions, and active/inactive status.
- **Reports & Export** — Generate monthly activity reports and procedure distribution summaries in both PDF and JSON formats with date-range filtering.
- **Statistics Dashboard** — Visual overview with charts for active patient counts, procedures per doctor, treatment distribution by month, and employee breakdown by role.

### Doctor

- **Clinical Histories (SOAP)** — Create and manage electronic clinical records using the SOAP format (Subjective, Objective, Assessment, Plan) with automatic status lifecycle (open → closed).
- **Treatment Planning** — Register treatments linked to clinical histories with procedure type, tooth mapping, and clinical notes.
- **Patient History Timeline** — Browse a chronological view of all past clinical encounters for any assigned patient.
- **Patient Read Access** — View patient profiles and guardian information for clinical reference.

### Assistant

- **Patient Registration** — Full CRUD for patient records with document number validation, age auto-calculation, blood type selection, and disability tracking.
- **Guardian Management** — Create and link guardians to minor patients with automatic guardian requirement validation based on patient age.
- **Person Records** — Manage personal information (names, contact details, birth date) that feeds into patient and guardian profiles.

### Auditor

- **Audit Trail** — Read-only access to a comprehensive log of every system operation (INSERT, UPDATE, DELETE) across all tables, with before/after snapshots and user attribution.
- **Event Filtering** — Filter audit records by date range, affected entity, event type, or specific user for compliance reviews.

### System-Wide

- **Automated Audit Triggers** — PostgreSQL database triggers capture every data mutation with before/after snapshots, user ID, and IP address — no application-level code required.
- **Email Notifications** — Transactional emails via SendGrid or SMTP (Gmail) for welcome credentials, OTP codes, and password reset links using Jinja2 HTML templates.
- **Real-Time Validation** — Pydantic schemas enforce data integrity on every API request with descriptive error messages.

---

## Pages & Views

| View | Description |
|---|---|
| **Login** | Google OAuth and email authentication screen |
| **Force Password Change** | Mandatory password update for first-time users |
| **Password Reset (1/2/3)** | Three-step OTP-based password recovery flow |
| **Dashboard** | Admin overview with active patients, procedures, and monthly stats |
| **User Management** | Admin panel to register, activate, and deactivate system users |
| **Dental Services** | Admin catalog of dental procedures and pricing |
| **Reports** | Admin PDF/JSON export of monthly activities and distributions |
| **Statistics** | Admin charts for procedures by doctor and treatment trends |
| **Patient Management** | Assistant/Doctor list of patients with search and filters |
| **Register Patient** | Assistant form to create new patient records with guardian assignment |
| **Clinical History** | Doctor form for SOAP-format clinical records and treatment plans |
| **Appointment History** | Doctor timeline of past clinical encounters per patient |
| **Audit Log** | Auditor view of all system operations with filters and export |

---

## Execution and Development Guide

### Prerequisites

- Python >= 3.13
- Node.js >= 18.x
- PostgreSQL >= 17
- Docker (optional, for database)
- A Firebase project with Authentication enabled
- A Gmail account with App Password (or SendGrid API key) for email sending

### 1. Clone the repository

```bash
git clone https://github.com/your-org/ByteDental.git
cd ByteDental
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your database, Firebase, and SMTP credentials.

### 3. Start the database

```bash
cd backend
docker-compose up -d
```

This starts PostgreSQL on port **5433** and pgAdmin on port **8080**.

> **Note:** If you have a local PostgreSQL instance running on port 5432, Docker will use 5433 to avoid conflicts.

### 4. Start the backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API docs will be available at `http://localhost:8000/docs`.

### 5. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 6. Create the admin user

After the backend starts, the admin user must be synced with Firebase. Use the Firebase console to create a user with email `admin@bytedental.com`, then insert the corresponding record in the `users` table with `role_id = 1` (Administrator).

---

## Project Structure

```text
ByteDental/
├── backend/
│   ├── app/
│   │   ├── middleware/         ← Auth & role-based access control
│   │   ├── models/            ← SQLAlchemy ORM models
│   │   ├── routers/           ← FastAPI endpoint definitions
│   │   ├── services/          ← Business logic (email, OTP, Firebase, reports)
│   │   └── templates/         ← Jinja2 email templates
│   ├── init-scripts/          ← PostgreSQL initialization scripts
│   ├── scripts/               ← Utility scripts (role seeding, etc.)
│   ├── docker-compose.yml     ← PostgreSQL & pgAdmin containers
│   ├── requirements.txt       ← Python dependencies
│   └── main.py                ← Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/        ← Reusable UI components
│   │   ├── pages/             ← Page components organized by role
│   │   ├── services/          ← API client functions
│   │   ├── contexts/          ← React Context (auth state)
│   │   ├── Firebase/          ← Firebase client config
│   │   └── App.jsx            ← Router and route guards
│   ├── .env                   ← Firebase & API URL config
│   └── package.json           ← Node dependencies
├── .github/workflows/         ← CI/CD (deploy, CodeQL, security testing)
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18.3, Vite 7.1, React Router 7.8, Tailwind CSS 4.1 |
| **UI Libraries** | FontAwesome, React Icons, Framer Motion, Headless UI, Driver.js |
| **Backend** | FastAPI 0.116, Uvicorn, Pydantic 2.11, Jinja2 |
| **Database** | PostgreSQL 17, SQLAlchemy 2.0, Alembic 1.16, psycopg |
| **Authentication** | Firebase Auth (Google OAuth + email), Firebase Admin SDK 7.1 |
| **Email** | SendGrid 6.11, SMTP (Gmail) |
| **Reporting** | ReportLab 4.0 (PDF), JSON export |
| **Infrastructure** | Docker, Docker Compose |
| **Testing** | Pytest 8.3, Jest 29.7, React Testing Library |
| **CI/CD** | GitHub Actions (CodeQL, security testing, deployment) |

---

## Authors

| Name | GitHub |
|---|---|
| **Camilo Andres Arias Tenjo** | [@CamiloAT](https://github.com/CamiloAT) |
| **Ronald Samir Molinares Sanabria** | [@Ronaldmolinares](https://github.com/Ronaldmolinares) |
| **Karen Juliana Pena Suarez** | [@KarenSuarez4](https://github.com/KarenSuarez4) |
| **Maria Fernanda Sogamoso Rodriguez** | [@maria-sogamoso](https://github.com/maria-sogamoso) |
| **Lunna Karina Sosa Espitia** | [@lunna21](https://github.com/lunna21) |


*Full-Stack Software Engineering.*
