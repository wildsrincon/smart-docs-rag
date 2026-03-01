# Project Structure

This document describes the correct directory structure for the Fullstack Starter Kit.

## Root Directory

```
fullstack-starter-kit/
├── .gitignore                  # Root .gitignore for the entire project
├── .pre-commit-config.yaml       # Pre-commit hooks configuration
├── docker-compose.yml           # Docker Compose configuration
├── README.md                   # Project documentation
├── backend/                    # FastAPI backend application
└── frontend/                   # Next.js frontend application
```

## Backend Directory (`backend/`)

```
backend/
├── .dockerignore               # Files to exclude from Docker build
├── .env                       # Environment variables (not in git)
├── .python-version             # Python version specification
├── .venv/                     # Virtual environment (not in git)
├── alembic/                   # Database migrations
│   ├── env.py                 # Alembic environment configuration
│   ├── script.py.mako         # Migration template
│   └── versions/              # Migration files
├── app/                       # Application code
│   ├── api/                   # API routes
│   │   └── v1/             # API v1 routes
│   ├── auth/                  # Authentication logic
│   ├── core/                  # Core configuration
│   ├── database/              # Database setup
│   ├── entities/              # SQLAlchemy models
│   ├── todos/                 # Todos feature
│   └── users/                 # Users feature
├── tests/                     # Test files
├── alembic.ini               # Alembic configuration
├── Dockerfile                 # Docker image for backend
├── pyproject.toml            # Python dependencies (uv)
└── uv.lock                   # Locked dependencies
```

## Frontend Directory (`frontend/`)

```
frontend/
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore patterns
├── .next/                     # Next.js build cache (not in git)
├── node_modules/              # npm dependencies (not in git)
├── src/                       # Source code
│   ├── app/                   # App router
│   ├── components/            # React components
│   └── lib/                  # Utility functions
├── .env.example               # Environment variables template
├── Dockerfile                 # Docker image for frontend
├── middleware.ts             # Next.js middleware
├── next-env.d.ts            # Next.js TypeScript definitions
├── next.config.js           # Next.js configuration
├── package.json            # npm dependencies
├── package-lock.json        # Locked npm dependencies
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Important Rules

1. **No root-level dependencies**: `package.json`, `pyproject.toml`, `node_modules`, etc. should NOT be in the root directory.

2. **Each service has its own config**:
   - Backend uses `backend/pyproject.toml` for Python dependencies
   - Frontend uses `frontend/package.json` for Node.js dependencies

3. **Docker Compose** builds each service from its respective directory:
   ```yaml
   backend:
     build:
       context: ./backend
   frontend:
     build:
       context: ./frontend
   ```

4. **Environment files**:
   - Root `.gitignore` ensures `node_modules/` and `.venv/` are ignored
   - Each service has its own `.env` file
   - Never commit `.env` files to git

5. **Volumes in Docker**:
   - `./backend:/app` - Backend code mounted for hot reload
   - `./frontend:/app` - Frontend code mounted for hot reload
   - `/app/node_modules` - Prevents node_modules conflicts
