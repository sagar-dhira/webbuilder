# Framely Rebuilt

A full-stack website builder refactored from Framely, with a **separate Node.js backend** and **React frontend**, using **JWT auth**, **PostgreSQL**, **shadcn/ui**, and **SCSS modules**.

## Tech Stack

### Backend
- Node.js + Express
- Prisma + PostgreSQL
- JWT authentication (no Clerk)
- bcryptjs for password hashing

### Frontend
- React + Vite
- shadcn/ui components
- SCSS modules for styling
- React Router
- React Hook Form + Zod

## Project Structure

```
framely-rebuilt/
├── backend/          # Node.js API
│   ├── prisma/       # Schema & migrations
│   └── src/
│       ├── routes/   # Auth, sites, public
│       └── middleware/
└── frontend/         # React app
    ├── src/
    │   ├── components/
    │   │   ├── layout/   # Modular AppLayout (extensible)
    │   │   └── ui/       # shadcn components
    │   ├── contexts/     # Auth, Editor
    │   └── pages/        # Auth, Dashboard, Editor, Site view
    └── ...
```

## Modular Layout Design

The layout is built to be **extensible**. When you add new features:

1. **AppLayout** accepts optional slots: `header`, `sidebar`, `leftSlot`, `rightSlot`, `children`
2. New features can plug into these slots without modifying existing layout code
3. Each page uses SCSS modules (e.g. `DashboardPage.module.scss`) so new styles are isolated

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Start PostgreSQL (Docker)
docker-compose up -d

# Install & run migrations
npm install
npx prisma migrate dev
npm run dev
```

Backend runs at `http://localhost:3001`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL should point to backend (or use proxy)

npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 3. Environment Variables

**Backend (.env)**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing tokens
- `PORT` - Default 3001

**Frontend (.env)**
- `VITE_API_URL` - Backend API base (e.g. `http://localhost:3001/api`)
- `VITE_ROOT_DOMAIN` - Domain for site URLs (e.g. `localhost:5173`)

## Features

- **Auth**: Register, Login, JWT-based sessions
- **Dashboard**: List sites, create new site (title + subdomain)
- **Editor**: Drag-and-drop builder with:
  - Components: headings, paragraphs, containers, images, 2/3 columns
  - Layers panel
  - Settings: transform, appearance, typography, stroke
  - Device preview (Desktop, Tablet, Mobile)
  - Public/private visibility
  - Undo/Redo
- **Site Viewer**: Public view at `/s/:subdomain`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/sites | Yes | List user's sites |
| POST | /api/sites | Yes | Create site |
| GET | /api/sites/:id | Yes | Get site |
| PUT | /api/sites/:id | Yes | Update site |
| DELETE | /api/sites/:id | Yes | Delete site |
| GET | /api/site/:subdomain | No | Public site by subdomain |
