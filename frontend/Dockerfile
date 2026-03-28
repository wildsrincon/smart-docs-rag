# frontend/Dockerfile - Development version
FROM node:20-slim

WORKDIR /app

# Install system dependencies needed for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./

# Install dependencies (works with or without package-lock.json)
RUN npm install

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Check if Docker-specific .env exists and use it, otherwise skip
RUN if [ -f .env.docker ]; then cp .env.docker .env; fi

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
