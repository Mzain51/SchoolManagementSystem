# Production School Management System (Pakistan)

A secure, multi-tenant School Management System tailored for private and public schools across Pakistan. Digitizes student registers, daily attendance, fee vouchers and ledgers in PKR, examination mark sheets, syllabus tracking, and operational analytics.

---

## Architecture Overview

- **Frontend**: Next.js 15 (App Router), TypeScript (strict), Tailwind CSS, Lucide icons, Recharts, `@supabase/ssr`.
- **Backend**: Python FastAPI, SQLAlchemy 2.0 ORM, Alembic migrations, Pydantic v2, Pytest.
- **Database & Services**: Supabase PostgreSQL (or local SQLite/PostgreSQL in dev), Supabase Auth JWT verification, Supabase Storage.
- **Regional Defaults**:
  - Currency: **PKR** (Pakistani Rupee, formatted as `Rs.`)
  - Timezone: **Asia/Karachi** (PKT, UTC+5)
  - Multi-School Isolation: Complete tenant partitioning by `school_id`.

---

## Quickstart & Local Setup

### 1. Prerequisites
- Python 3.12+
- Node.js 20+ and npm
- (Optional) Docker & Docker Compose

### 2. Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env
```

Configure your Supabase credentials if using Supabase Auth & PostgreSQL:
```ini
DATABASE_URL=postgresql+psycopg://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```
For local development, use SQLite and explicitly set `ENABLE_DEV_AUTH_BYPASS=true` in `backend/.env`. The bypass only accepts the built-in demo roles and is ignored unless `ENVIRONMENT=development`. Production must use verified Supabase access tokens and keep the bypass disabled.

---

### 3. Backend Setup & Admin Provisioning

Activate the virtual environment and install dependencies:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Provision the initial School and Administrator safely:
```bash
python scripts/provision_admin.py --email admin@schools.pk --name "Principal M. Tariq" --school-name "Lahore Model Academy" --school-code "LMA-01"
```
In production, first create the user in Supabase Auth and pass its user ID with `--auth-sub`; local demo mode uses the matching `dev-admin-id` fixture when the bypass is enabled.

Run database migrations:
```bash
alembic upgrade head
```

Run automated backend test suite:
```bash
pytest backend/tests -v
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 4. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Implemented student workflow

- Open `/academic-setup` to create academic years, classes, and sections.
- Open `/students` to search and filter the roster, register a student, inspect a profile, or edit the record.
- The page calls the typed client in `frontend/src/lib/api-client.ts`, which sends requests to `/api/v1/students` and `/api/v1/academic/*`.
- FastAPI validates the request and school/role context, then delegates to the service layer. SQLAlchemy persists the student, enrollment links, and audit entry.
- In ASP.NET Core MVC terms: `app/students/page.tsx` is the routed UI, `api-client.ts` is the frontend HTTP service, the decorated FastAPI function is the JSON controller action, Pydantic schemas are request/response models, and the service/model layers contain business and persistence logic.

The remaining sidebar modules are planned but not implemented yet; the working routes for this milestone are Students and Academic Setup.

---

## Role-Based Access Control (RBAC)

The system enforces permissions on the backend API:
- **Admin**: Full school control, admissions, fees configuration, exam result publication, school settings.
- **Teacher**: Class attendance register, exam mark entry for assigned subjects, homework, syllabus coverage.
- **Accountant**: Fee voucher generation, cash/bank payment collection, receipt printing, overdue ledgers.

---

## Testing & Quality

To execute backend unit and integration tests:
```bash
pytest backend/tests -v
```
Checks:
- System and DB health endpoints (`/api/v1/health`, `/api/v1/health/db`)
- JWT authentication & rejection of unauthenticated requests
- Multi-school tenant isolation
- Role-based access control (Admin vs Teacher vs Accountant)
- Live dashboard calculation queries in PKR
