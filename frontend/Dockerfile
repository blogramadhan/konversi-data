# Frontend Dockerfile untuk Production
FROM node:20-alpine

WORKDIR /app

# Build argument untuk API URL
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application dengan environment variable
RUN npm run build

# Install serve untuk static file serving
RUN npm install -g serve

# Environment variable untuk port
ENV PORT=3030

# Expose port (akan dioverride oleh docker-compose)
EXPOSE 3030

# Start application dengan serve menggunakan PORT variable
CMD sh -c "serve -s dist -l $PORT"
