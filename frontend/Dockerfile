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

# Expose port
EXPOSE 3000

# Start application dengan serve
CMD ["serve", "-s", "dist", "-l", "3000"]
