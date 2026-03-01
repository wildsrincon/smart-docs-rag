# Fullstack Starter Kit

A modern fullstack boilerplate with **Next.js 15** and **FastAPI**, following best practices for both frontend and backend development.

## 🚀 Features

### Frontend (Next.js 15)
- ✨ Modern React 19 with App Router
- 🎨 Tailwind CSS 4 with dark mode
- 🔐 JWT Authentication (Login/Signup)
- 📦 Zustand 5 for state management
- ✅ Todo CRUD operations
- 🎯 Form validation with Zod 4 + React Hook Form
- 📱 Responsive design
- 🛡️ Protected routes with middleware

### Backend (FastAPI)
- ⚡ FastAPI with async/await
- 🐘 PostgreSQL database
- 🔄 SQLAlchemy async ORM
- 📝 Pydantic V2 validation
- 🔒 Password hashing with bcrypt
- 🎫 JWT token authentication
- 📊 Rate limiting
- 🔒 CORS configuration
- ✅ Full CRUD for todos
- 🧪 Comprehensive tests with pytest

## 📋 Tech Stack

### Frontend
```
Next.js 15      → React framework
React 19        → UI library
TypeScript      → Type safety
Tailwind CSS 4  → Styling
Zustand 5       → State management
Zod 4           → Validation
Axios           → HTTP client
Lucide React    → Icons
```

### Backend
```
FastAPI         → Web framework
PostgreSQL      → Database
SQLAlchemy      → ORM
Pydantic V2     → Data validation
bcrypt          → Password hashing
JWT             → Authentication
pytest          → Testing
```

## 🏗️ Project Structure

```
fullstack-starter-kit/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   ├── auth/           # Authentication logic
│   │   ├── users/          # User management
│   │   ├── todos/          # Todo CRUD
│   │   ├── entities/       # Database models
│   │   ├── database/       # DB connection
│   │   └── core/           # Config & security
│   ├── tests/              # Pytest tests
│   ├── Dockerfile
│   └── pyproject.toml
│
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities & API client
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   ├── Dockerfile
│   ├── next.config.js
│   └── package.json
│
├── docker-compose.yml       # Orchestrate all services
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js** 18+ (for local development)
- **Python** 3.14+ (for local development)

### Using Docker (Recommended)

1. Clone the repository
```bash
git clone <repository-url>
cd fullstack-starter-kit
```

2. Start all services
```bash
docker-compose up -d
```

3. Access the applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Local Development

#### Backend
```bash
cd backend
# Install dependencies (using uv for speed)
pip install uv
uv sync

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows

# Run database migrations (if needed)
# Create tables via FastAPI or Alembic

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

# Fullstack Starter Kit

A modern fullstack boilerplate with **Next.js** and **FastAPI**, featuring robust, persistent authentication and best practices for both frontend and backend development.

## 🚀 Features

### Frontend (Next.js)
- ✨ **React 19** with App Router
- 🎨 **Tailwind CSS** for styling
- 🔐 **Robust JWT Authentication** with persistent sessions (Auth Guard pattern)
- 🔄 **Automatic Session Restoration** on page reload
- 📦 **Zustand** for global state management
- ✅ **Todo CRUD** operations
- 🎯 **Form Validation** with Zod + React Hook Form
- 📱 Responsive design
- 🛡️ **Protected Routes** with Next.js Middleware
- 🤫 **Hydration Error Suppression** for browser extension compatibility

### Backend (FastAPI)
- ⚡ **FastAPI** with async/await
- 🐘 **PostgreSQL** database with SQLAlchemy
- 📝 **Pydantic V2** for robust data validation and parsing
- 🔒 **Password Hashing** with `bcrypt`
- 🎫 **JWT Token Authentication** (OAuth2 Password Flow)
- 🛠️ **Swagger UI Friendly** JSON login endpoint for easy testing
- 📊 Rate limiting and CORS configuration
- ✅ Full CRUD for todos
- 🧪 Comprehensive tests with Pytest

## 🏗️ Project Structure

```
fullstack-starter-kit/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── api.py
│   │   │   └── debug.py          # <-- Endpoints para testing fácil
│   │   ├── auth/
│   │   ├── users/
│   │   ├── todos/
│   │   └── ...
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── AuthProvider.tsx  # <-- Auth Guard para persistencia
│   │   │   └── FullScreenLoader.tsx
│   │   ├── store/
│   │   │   └── auth.ts           # <-- Lógica de sesión robusta
│   │   └── ...
│   └── middleware.ts
│
├── docker-compose.yml
├── README.md
└── ... (otros archivos de documentación)
```

## 🔐 Authentication Flow (Robust Version)

This starter kit implements a robust "Auth Guard" pattern to ensure session persistence.

1.  **Login**: User logs in. Token and user data are saved to `localStorage` via Zustand's `persist` middleware.
2.  **Page Reload**:
    *   `AuthProvider` component wraps the entire app.
    *   It displays a full-screen loader, "pausing" the app render.
    *   It calls `restoreSession()` from the auth store.
    *   `restoreSession` verifies the token from `localStorage` against the backend API.
    *   If valid, it fetches user data and sets the auth state.
    *   The loader is removed, and the app renders with the user already logged in.
3.  **Result**: No more redirects to login on page reload. The session is reliably persisted.

## 📖 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - (OAuth2 Form) For clients.
- `POST /api/v1/auth/login-simple` - (JSON) **For easy testing in Swagger UI**.
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/verify`

### Debug (For easy testing)
- `POST /api/v1/debug/login-simple` - Alternative JSON login.
- `GET /api/v1/debug/test-auth`

### Users & Todos
- `GET /api/v1/users/me`
- `GET/POST/PUT/DELETE /api/v1/todos/...`
- `GET /api/v1/todos/stats`

---
*El resto del README (Tech Stack, Quick Start, etc.) sigue siendo válido y no necesita cambios.*

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest                          # Run all tests
pytest -v                        # Verbose output
pytest tests/test_auth.py        # Specific test file
pytest --cov                     # With coverage
```

### Frontend
For E2E testing, you can use Playwright or Cypress (to be added).

## 🛠️ Development Tools

### Backend
- **FastAPI**: Automatic OpenAPI docs at `/docs`
- **Pytest**: Testing framework
- **ruff**: Fast Python linter
- **mypy**: Type checking

### Frontend
- **Next.js**: Hot reload, file-based routing
- **React DevTools**: Debug components
- **ESLint**: Code linting
- **TypeScript**: Type checking (`npm run type-check`)

## 📝 Key Patterns

### Backend: Clean Architecture
- **Controllers** → Handle HTTP requests/responses
- **Services** → Business logic
- **Entities** → Database models
- **Dependency Injection** → FastAPI Depends()

### Frontend: Modern React
- **Server Components** by default (no state/effects)
- **Client Components** only when needed (marked with "use client")
- **Zustand** for global state (no Context API)
- **Zod** for runtime type validation
- **No manual memoization** (React Compiler handles it)

### State Management
- **Auth Store**: User data, token, authentication state
- **Todos Store**: Todo list, CRUD operations
- **Persist Middleware**: Auth state saved across reloads
- **Immer Middleware**: Immutable state updates

## 🎨 Styling

- **Tailwind CSS 4**: Utility-first CSS framework
- **Dark Mode**: Automatic based on system preference
- **Semantic Colors**: Primary, slate scales
- **Responsive**: Mobile-first design

## 🔒 Security

- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt
- **Rate Limiting**: Prevent abuse
- **CORS**: Configured for frontend origin
- **Input Validation**: Pydantic schemas (backend) + Zod (frontend)

## 🐳 Docker Services

```yaml
db:         PostgreSQL 15 (port 5432)
backend:    FastAPI (port 8000)
frontend:   Next.js (port 3000)
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)

## 🤝 Contributing

This is a starter kit. Feel free to fork and customize for your needs!

## 📄 License

MIT

---

**Built with ❤️ using Next.js 15 and FastAPI**
