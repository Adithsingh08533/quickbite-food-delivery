# QuickBite 🍔

> A production-grade food delivery platform inspired by Swiggy, Zomato, and Uber Eats.  
> Built with React + TypeScript (frontend) and Node.js + Express + PostgreSQL (backend).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query |
| Backend | Node.js · Express · TypeScript · PostgreSQL (pg) · Socket.IO |
| Auth | JWT + Refresh Tokens + RBAC |
| Payments | Razorpay (Test Mode) |
| Storage | Cloudinary |
| DevOps | Docker · GitHub Actions · Vercel · Render · Neon |

## Quick Start

### Prerequisites
- Node.js ≥ 20
- PostgreSQL ≥ 15 (or Docker)
- npm ≥ 10

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env.development
# Fill in your environment variables in .env.development

npm run migrate    # Run database migrations
npm run seed       # Seed demo data
npm run dev        # Start development server (port 5000)
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.development
# Fill in VITE_API_BASE_URL=http://localhost:5000/api/v1

npm run dev        # Start Vite dev server (port 5173)
```

### Docker Setup

```bash
docker-compose up -d   # Starts PostgreSQL + Backend + Frontend
```

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Customer | customer1@demo.com | Demo@123 |
| Customer | customer2@demo.com | Demo@123 |
| Customer | customer3@demo.com | Demo@123 |
| Owner | owner1@demo.com | Demo@123 |
| Owner | owner2@demo.com | Demo@123 |
| Admin | admin@demo.com | Admin@123 |

## API Documentation

Swagger UI is available at `http://localhost:5000/api/docs` when running in development.

## Project Structure

```
quickbite/
├── frontend/     # React + Vite + TypeScript
├── backend/      # Express + TypeScript + PostgreSQL
├── docs/         # Architecture diagrams & documentation
├── docker/       # Dockerfiles
└── .github/      # CI/CD workflows
```

## License

MIT
