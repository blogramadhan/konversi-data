#!/bin/bash

# Script untuk deploy aplikasi Konversi Data ke server
# Usage: ./deploy.sh [start|stop|restart|status|logs|update]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo ""
    echo "========================================="
    echo "🚀 $1"
    echo "========================================="
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Install Docker: https://docs.docker.com/engine/install/"
        exit 1
    fi
    print_success "Docker installed: $(docker --version)"

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose installed: $(docker-compose --version)"
}

# Start application
start_app() {
    print_header "Starting Application"

    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env file not found, copying from .env.example"
        cp .env.example .env
        print_info "Please edit .env file with your configuration"
        print_info "Press Enter to continue after editing .env, or Ctrl+C to exit"
        read -r
    fi

    print_info "Building and starting containers..."
    docker-compose up -d --build

    print_success "Application started successfully!"
    echo ""
    print_info "Waiting for services to be ready (30 seconds)..."
    sleep 30

    # Check status
    show_status
}

# Stop application
stop_app() {
    print_header "Stopping Application"

    print_info "Stopping containers..."
    docker-compose down

    print_success "Application stopped successfully!"
}

# Restart application
restart_app() {
    print_header "Restarting Application"

    stop_app
    sleep 5
    start_app
}

# Show status
show_status() {
    print_header "Application Status"

    echo "Container Status:"
    docker-compose ps
    echo ""

    echo "Health Checks:"

    # Backend health
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend: Running (http://localhost:8000)"
    else
        print_error "Backend: Not responding"
    fi

    # Frontend health
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend: Running (http://localhost:3000)"
    else
        print_error "Frontend: Not responding"
    fi

    echo ""
    echo "Access URLs:"
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:8000"
    echo "  API Docs:  http://localhost:8000/docs"
}

# Show logs
show_logs() {
    print_header "Application Logs"

    echo "Showing logs (Ctrl+C to exit)..."
    echo ""
    docker-compose logs -f
}

# Update application
update_app() {
    print_header "Updating Application"

    print_info "Pulling latest code from git..."
    git pull

    print_info "Rebuilding containers..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d

    print_success "Application updated successfully!"

    sleep 10
    show_status
}

# Backup data
backup_data() {
    print_header "Backing Up Data"

    BACKUP_DIR="./backups"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"

    mkdir -p "$BACKUP_DIR"

    print_info "Creating backup..."
    docker run --rm \
        -v konversi-data_backend-temp:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/$BACKUP_FILE" /data

    print_success "Backup created: $BACKUP_DIR/$BACKUP_FILE"
}

# Show usage
show_usage() {
    echo "Usage: ./deploy.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the application"
    echo "  stop      - Stop the application"
    echo "  restart   - Restart the application"
    echo "  status    - Show application status"
    echo "  logs      - Show application logs"
    echo "  update    - Update application from git and rebuild"
    echo "  backup    - Backup application data"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh start"
    echo "  ./deploy.sh logs"
    echo "  ./deploy.sh restart"
}

# Main
main() {
    case "$1" in
        start)
            check_prerequisites
            start_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        update)
            check_prerequisites
            update_app
            ;;
        backup)
            backup_data
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
