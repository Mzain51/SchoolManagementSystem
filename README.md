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
*(In development, SQLite fallback `sqlite:///./sms_dev.db` and dev token bypass are enabled automatically).*

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
