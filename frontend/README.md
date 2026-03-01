# Fullstack Starter Kit - Frontend

A modern fullstack application built with Next.js 15 and FastAPI.

## Features

- 🔐 Authentication (Login/Signup) with JWT tokens
- ✅ Todo management with CRUD operations
- 🎨 Modern UI with Tailwind CSS 4
- 🚀 Server-side and client-side components
- 📦 State management with Zustand
- ✨ Form validation with Zod and React Hook Form

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **Zustand 5** - State management
- **Zod 4** - Schema validation
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Pydantic V2** - Data validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Python 3.11+
- Docker and Docker Compose

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd fullstack-starter-kit
```

2. Install frontend dependencies

```bash
cd frontend
npm install
# or
pnpm install
# or
yarn install
```

3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults are set for local development):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Start the backend

```bash
cd ..
docker-compose up -d db backend
```

The backend will be available at `http://localhost:8000`

5. Start the frontend development server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── dashboard/    # Dashboard page
│   │   ├── login/        # Login page
│   │   ├── signup/       # Signup page
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── TodoForm.tsx  # Form to create todos
│   │   └── TodoList.tsx  # List of todos
│   ├── lib/              # Utilities
│   │   ├── api.ts        # API client with axios
│   │   └── utils.ts      # cn() utility
│   ├── store/            # Zustand stores
│   │   ├── auth.ts       # Authentication state
│   │   └── todos.ts      # Todos state
│   └── types/            # TypeScript types
│       └── api.ts        # API types
├── public/               # Static assets
├── .env.example          # Environment variables template
├── middleware.ts         # Next.js middleware (auth protection)
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Endpoints

### Authentication
- `POST /api/v1/auth` - Register new user
- `POST /api/v1/auth/token` - Login (OAuth2)

### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/change-password` - Change password

### Todos
- `GET /api/v1/todos` - Get all todos
- `POST /api/v1/todos` - Create todo
- `GET /api/v1/todos/:id` - Get single todo
- `PUT /api/v1/todos/:id` - Update todo
- `PUT /api/v1/todos/:id/complete` - Complete todo
- `DELETE /api/v1/todos/:id` - Delete todo

## Key Features Explained

### Authentication Flow

1. User registers/logs in via form
2. JWT token stored in localStorage
3. Token added to all API requests via axios interceptor
4. Protected routes checked by Next.js middleware
5. 401 responses trigger logout and redirect

### State Management

- **Zustand** for global state (auth, todos)
- **Immer middleware** for immutable state updates
- **Persist middleware** to save auth state across reloads
- **useShallow selector** to prevent unnecessary re-renders

### Form Validation

- **Zod schemas** for type-safe validation
- **React Hook Form** for efficient form handling
- **zodResolver** to integrate Zod with React Hook Form
- Client-side validation before API calls

### API Client

- **Axios** with interceptors for:
  - Automatic token injection
  - 401 error handling
  - Request/response logging
- Centralized API modules (auth, users, todos)

### Styling

- **Tailwind CSS 4** with dark mode support
- **cn() utility** for conditional classes
- Semantic color palette
- Responsive design patterns

## Development Tips

### Adding New Features

1. Create Zod schemas in `src/types/api.ts`
2. Add API methods in `src/lib/api.ts`
3. Create Zustand store if needed
4. Build components with "use client" directive
5. Use Server Components for data fetching when possible

### Type Safety

- All API responses are typed
- Form inputs validated with Zod
- No `any` types - use `unknown` when needed
- TypeScript strict mode enabled

### Performance

- React 19 Compiler handles optimization
- Zustand selectors prevent unnecessary re-renders
- Code splitting with Next.js App Router
- Lazy loading for large components

## License

MIT
