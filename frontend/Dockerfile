# frontend/Dockerfile - Development version
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (works with or without package-lock.json)
RUN npm install

# Check if Docker-specific .env exists and use it, otherwise skip
RUN if [ -f .env.docker ]; then cp .env.docker .env; fi

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
