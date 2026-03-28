# Smart Docs RAG

Una plataforma de chat inteligente con documentos basada en RAG (Retrieval-Augmented Generation) que permite conversar con tus documentos PDF, DOCX, TXT y más.

## 🚀 Características

- **Chat con documentos** - Preguntas y respuestas sobre tus documentos usando IA
- **Búsqueda semántica** - Recuperación inteligente usando embeddings
- **Soporte multi-formato** - PDF, DOCX, XLSX, PPTX, TXT, MD
- **Autenticación OAuth** - Login con Google
- **Interface moderna** - Sidebar fijo y header responsive
- **Streaming en tiempo real** - Respuestas del chat en tiempo real con WebSocket

## 🛠️ Tech Stack

### Backend
- FastAPI - Framework web asíncrono
- PostgreSQL con pgvector - Base de datos vectorial
- OpenAI API - Embeddings y chat GPT-4
- LangChain - Orquestación de RAG
- Python 3.12+ - Lenguaje principal

### Frontend
- Next.js 15 - Framework React con App Router
- React 19 - Biblioteca UI
- TypeScript - Type safety
- Tailwind CSS 4 - Estilos
- Playwright - Tests E2E

## 📋 Requisitos previos

- Docker y Docker Compose instalados
- Cuenta de Google (para OAuth)
- API Key de OpenAI

## 🔧 Configuración

1. **Clonar el repositorio:**
```bash
git clone https://github.com/wildsrincon/smart-docs-rag.git
cd smart-docs-rag
```

2. **Configurar variables de entorno:**
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales:
# - OPENAI_API_KEY: Tu API key de OpenAI
# - GOOGLE_CLIENT_ID: Client ID de Google OAuth
# - GOOGLE_CLIENT_SECRET: Client Secret de Google OAuth
```

3. **Iniciar los servicios:**
```bash
docker-compose up -d
```

4. **Configurar Google OAuth:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto
   - Habilita Google Sign-In API
   - Crea credenciales OAuth 2.0
   - Agrega `http://localhost:3000/auth/callback/google` como authorized redirect URI
   - Copia Client ID y Client Secret a `.env`

## 🚀 Ejecutar

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

Los servicios estarán disponibles en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- PostgreSQL: localhost:5432

## 📁 Estructura del proyecto

```
smart-docs-rag/
├── backend/               # API FastAPI
│   ├── app/
│   │   ├── api/          # Rutas API
│   │   ├── auth/         # Autenticación
│   │   ├── chat/         # Chat service
│   │   ├── documents/    # Document upload
│   │   ├── rag/          # RAG system
│   │   └── entities/     # SQLAlchemy models
│   ├── tests/            # Tests
│   └── alembic/          # Migraciones DB
├── frontend/             # Next.js App
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # UI Components
│   │   ├── lib/          # Utilities
│   │   └── store/        # State management
│   └── tests/            # E2E tests
├── docker/               # Docker configs
└── docker-compose.yml    # Docker Compose
```

## 🔄 Flujo de trabajo

### Branches
- `main` - Rama de producción (protegida)
- `dev` - Rama de desarrollo
- `feat/*` - Branches de features

### Flujo
1. Crear feature branch desde `dev`:
```bash
git checkout dev
git pull origin dev
git checkout -b feat/nueva-feature
```

2. Hacer cambios y commitear:
```bash
git add .
git commit -m "feat: descripción del cambio"
```

3. Hacer push y crear PR:
```bash
git push -u origin feat/nueva-feature
gh pr create --title "feat: descripción" --body "detalles..."
```

4. Hacer merge a `dev`:
```bash
# Después de revisión y aprobación
gh pr merge --squash
```

5. Actualizar `dev` local:
```bash
git checkout dev
git pull origin dev
```

## 🧪 Testing

```bash
# Tests backend
docker-compose exec backend pytest

# Tests E2E
docker-compose exec frontend npx playwright test
```

## 📖 Documentación

- [API Docs](http://localhost:8000/docs) - Swagger UI
- [RAG System](docs/rag.md) - Documentación del sistema RAG
- [OAuth Setup](docs/oauth.md) - Guía de configuración OAuth

## 🤝 Contribuir

1. Fork el repositorio
2. Crear una feature branch
3. Commitear cambios con conventional commits
4. Hacer push a la branch
5. Crear Pull Request

## 📄 Licencia

MIT License

## 👥 Autores

- @wildsrincon
