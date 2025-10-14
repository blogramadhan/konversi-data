#!/bin/bash

# Script untuk test Docker deployment
# Usage: ./test-docker.sh

set -e

echo "========================================="
echo "🐳 Testing Docker Deployment"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
echo "1. Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_success "Docker is installed ($(docker --version))"
echo ""

# Check if Docker Compose is installed
echo "2. Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi
print_success "Docker Compose is installed ($(docker-compose --version))"
echo ""

# Build and start containers
echo "3. Building and starting containers..."
print_info "This may take a few minutes on first run..."
docker-compose up -d --build
print_success "Containers started"
echo ""

# Wait for services to be healthy
echo "4. Waiting for services to be ready..."
sleep 10
print_success "Services should be ready"
echo ""

# Check if containers are running
echo "5. Checking container status..."
if [ $(docker-compose ps -q | wc -l) -eq 2 ]; then
    print_success "Both containers are running"
else
    print_error "Not all containers are running"
    docker-compose ps
    exit 1
fi
echo ""

# Test backend health
echo "6. Testing backend health endpoint..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    exit 1
fi
echo ""

# Test frontend
echo "7. Testing frontend..."
if curl -s http://localhost:3000 | grep -q "Konversi Data"; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    exit 1
fi
echo ""

# Test API endpoint
echo "8. Testing backend API..."
if curl -s http://localhost:8000/ | grep -q "Konversi Data API"; then
    print_success "Backend API is working"
else
    print_error "Backend API test failed"
    exit 1
fi
echo ""

# Show logs
echo "9. Container logs (last 20 lines):"
echo ""
echo "=== Backend Logs ==="
docker-compose logs --tail=20 backend
echo ""
echo "=== Frontend Logs ==="
docker-compose logs --tail=20 frontend
echo ""

# Summary
echo "========================================="
echo "✅ All tests passed!"
echo "========================================="
echo ""
echo "📝 Access the application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
echo ""
