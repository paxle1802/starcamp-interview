# Starcamp Interview

Structured technical interview platform for interviewers. Manage question banks, conduct timed interviews by section, score candidates, and export results as PDF/Excel.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 7, Styled Components |
| Backend  | Node.js, Express 5, TypeScript                  |
| Database | PostgreSQL 16, Prisma 7                         |
| Auth     | JWT + bcrypt                                    |
| Export   | PDFKit (PDF), ExcelJS (Excel)                   |

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Docker** & **Docker Compose** (for PostgreSQL)

### Install Docker

**macOS:**
```bash
brew install --cask docker
# Then open Docker.app from Applications
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

**Windows:**
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) from the official site.

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/paxle1802/starcamp-interview.git
cd starcamp-interview
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5432` with:
- User: `postgres`
- Password: `postgres`
- Database: `starcamp_interview`

Verify it's running:
```bash
docker ps
# Should show "starcamp-db" container running
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
```

Default `.env` contents (works out of the box with Docker):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/starcamp_interview?schema=public"
JWT_SECRET="change-this-to-a-random-secret-key-at-least-32-chars"
PORT=3001
```

> Change `JWT_SECRET` to a random string for production use.

### 4. Install dependencies

```bash
npm install
```

This installs dependencies for both `client/` and `server/` workspaces.

### 5. Initialize the database

```bash
# Run migrations to create tables
cd server
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed sample data (sections + sample questions)
npx prisma db seed

cd ..
```

### 6. Start development servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Project Structure

```
starcamp-interview/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       ├── services/       # API client services
│       └── types/          # TypeScript type definitions
├── server/                 # Express backend
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # SQL migrations
│   │   └── seed.ts         # Seed data script
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── middleware/      # Auth middleware
│       ├── routes/         # Express routes
│       ├── services/       # Business logic
│       ├── types/          # TypeScript types
│       └── utils/          # Prisma client, helpers
├── docker-compose.yml      # PostgreSQL container
└── package.json            # Workspace root
```

## Features

- **Auth** — Register/login with JWT authentication
- **Question Bank** — CRUD questions organized by sections (e.g., JavaScript, React, System Design) with difficulty levels (Easy/Medium/Hard)
- **Interview Setup** — 3-step wizard: candidate info → select questions (manual or random) → configure time per section
- **Live Interview** — Section timer with countdown, question progress dots, color-coded scoring (1-5), auto-save every 30s
- **Results** — Section-weighted overall average score, per-question breakdown with notes
- **Export** — Download results as PDF or Excel report
- **Delete** — Delete questions and interviews with confirmation popup

## Useful Commands

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# Reset database (drop all data and re-migrate)
cd server && npx prisma migrate reset

# Open Prisma Studio (visual DB browser)
cd server && npx prisma studio

# Run tests
cd server && npm test

# Build for production
npm run build
```

## Database Schema

```
User ──< InterviewSession ──< InterviewSectionConfig >── Section
  │              │
  │              ├──< InterviewQuestion >── Question ──< Section
  │              │
  └──< Question  └──< Score >── Question
```

**Models:** User, Section, Question, InterviewSession, InterviewSectionConfig, InterviewQuestion, Score
