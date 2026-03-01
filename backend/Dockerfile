FROM python:3.14-slim

WORKDIR /app

# Instalar uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copiar archivos de dependencias
COPY pyproject.toml ./

# Instalar dependencias
RUN uv sync --no-dev

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando para ejecutar
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
