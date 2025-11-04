#!/bin/bash

# Script untuk deploy aplikasi Konversi Data ke server
# Usage: ./deploy.sh [start|stop|restart|status|logs|update|switch] [python|rust]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default backend
BACKEND_TYPE=${BACKEND_TYPE:-python}

# Load environment variables from .env
load_env() {
    if [ -f .env ]; then
        # Export variables from .env, ignoring comments and empty lines
        set -a
        source <(grep -v '^#' .env | grep -v '^$' | sed 's/\r$//')
        set +a
    fi
}

# Validate environment configuration
validate_env() {
    # Set defaults if not defined
    export BACKEND_PORT=${BACKEND_PORT:-8000}
    export FRONTEND_PORT=${FRONTEND_PORT:-3030}
    export BACKEND_HOST=${BACKEND_HOST:-0.0.0.0}
    export FRONTEND_HOST=${FRONTEND_HOST:-0.0.0.0}
    export CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3030,http://localhost:5173}
    export VITE_API_URL=${VITE_API_URL:-http://localhost:8000}
    export RUST_LOG=${RUST_LOG:-info}
    export NODE_ENV=${NODE_ENV:-production}
    export BACKEND_WORKERS=${BACKEND_WORKERS:-4}
    export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-konversi-data}
}

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

print_backend_info() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Configuration Summary:${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Backend Type:    ${YELLOW}$BACKEND_TYPE${NC}"
    echo -e "  Backend Port:    ${YELLOW}$BACKEND_PORT${NC}"
    echo -e "  Frontend Port:   ${YELLOW}$FRONTEND_PORT${NC}"
    echo -e "  CORS Origins:    ${YELLOW}$CORS_ORIGINS${NC}"
    echo -e "  API URL:         ${YELLOW}$VITE_API_URL${NC}"
    echo -e "  Project Name:    ${YELLOW}$COMPOSE_PROJECT_NAME${NC}"
    if [ "$BACKEND_TYPE" = "rust" ]; then
        echo -e "  Rust Log Level:  ${YELLOW}$RUST_LOG${NC}"
    else
        echo -e "  Backend Workers: ${YELLOW}$BACKEND_WORKERS${NC}"
    fi
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Load and validate environment variables
    load_env
    validate_env

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Install Docker: https://docs.docker.com/engine/install/"
        exit 1
    fi
    print_success "Docker installed: $(docker --version)"

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        print_success "Docker Compose installed: $(docker-compose --version)"
    else
        COMPOSE_CMD="docker compose"
        print_success "Docker Compose installed: $(docker compose version)"
    fi

    print_success "Environment variables loaded from .env"
}

# Detect or set backend type
detect_backend() {
    if [ -n "$2" ]; then
        BACKEND_TYPE="$2"
    elif [ -f .backend ]; then
        BACKEND_TYPE=$(cat .backend)
    fi

    case "$BACKEND_TYPE" in
        python|py)
            BACKEND_TYPE="python"
            ;;
        rust|rs)
            BACKEND_TYPE="rust"
            ;;
        *)
            print_warning "Invalid backend type: $BACKEND_TYPE"
            print_info "Defaulting to Python backend"
            BACKEND_TYPE="python"
            ;;
    esac

    # Save backend choice
    echo "$BACKEND_TYPE" > .backend

    print_backend_info
}

# Start application
start_app() {
    print_header "Starting Application"

    detect_backend "$@"

    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env file not found, copying from .env.example"
        cp .env.example .env
        print_info "Please edit .env file with your configuration"
        print_info "Press Enter to continue after editing .env, or Ctrl+C to exit"
        read -r
    fi

    print_info "Building and starting containers with $BACKEND_TYPE backend..."
    $COMPOSE_CMD --profile $BACKEND_TYPE up -d --build

    print_success "Application started successfully with $BACKEND_TYPE backend!"
    echo ""
    print_info "Waiting for services to be ready (30 seconds)..."
    sleep 30

    # Check status
    show_status
}

# Stop application
stop_app() {
    print_header "Stopping Application"

    detect_backend "$@"

    print_info "Stopping containers..."
    $COMPOSE_CMD --profile $BACKEND_TYPE down

    print_success "Application stopped successfully!"
}

# Restart application
restart_app() {
    print_header "Restarting Application"

    detect_backend "$@"

    stop_app "$@"
    sleep 5
    start_app "$@"
}

# Switch backend
switch_backend() {
    print_header "Switching Backend"

    if [ -z "$2" ]; then
        print_error "Please specify backend type: python or rust"
        echo "Usage: ./deploy.sh switch [python|rust]"
        exit 1
    fi

    NEW_BACKEND="$2"

    case "$NEW_BACKEND" in
        python|py)
            NEW_BACKEND="python"
            ;;
        rust|rs)
            NEW_BACKEND="rust"
            ;;
        *)
            print_error "Invalid backend type: $NEW_BACKEND"
            echo "Choose: python or rust"
            exit 1
            ;;
    esac

    # Get current backend
    if [ -f .backend ]; then
        CURRENT_BACKEND=$(cat .backend)
    else
        CURRENT_BACKEND="python"
    fi

    if [ "$CURRENT_BACKEND" = "$NEW_BACKEND" ]; then
        print_warning "Already using $NEW_BACKEND backend"
        exit 0
    fi

    print_info "Switching from $CURRENT_BACKEND to $NEW_BACKEND backend..."

    # Stop current backend
    print_info "Stopping $CURRENT_BACKEND backend..."
    $COMPOSE_CMD --profile $CURRENT_BACKEND down

    # Save new backend choice
    echo "$NEW_BACKEND" > .backend

    # Start new backend
    print_info "Starting $NEW_BACKEND backend..."
    $COMPOSE_CMD --profile $NEW_BACKEND up -d --build

    print_success "Successfully switched to $NEW_BACKEND backend!"

    sleep 30
    show_status
}

# Show status
show_status() {
    print_header "Application Status"

    detect_backend "$@"

    # Load and validate environment variables
    load_env
    validate_env

    print_backend_info

    echo ""
    echo "Container Status:"
    $COMPOSE_CMD ps
    echo ""

    echo "Health Checks:"

    # Backend health
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        print_success "Backend ($BACKEND_TYPE): Running (http://localhost:$BACKEND_PORT)"
    else
        print_error "Backend ($BACKEND_TYPE): Not responding"
    fi

    # Frontend health
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        print_success "Frontend: Running (http://localhost:$FRONTEND_PORT)"
    else
        print_error "Frontend: Not responding"
    fi

    echo ""
    echo "Access URLs:"
    echo "  Frontend:  http://localhost:$FRONTEND_PORT"
    echo "  Backend:   http://localhost:$BACKEND_PORT ($BACKEND_TYPE)"
    if [ "$BACKEND_TYPE" = "python" ]; then
        echo "  API Docs:  http://localhost:$BACKEND_PORT/docs (FastAPI Swagger)"
    fi
    echo "  Health:    http://localhost:$BACKEND_PORT/health"
    echo "  Stats:     http://localhost:$BACKEND_PORT/stats"
}

# Show logs
show_logs() {
    print_header "Application Logs"

    detect_backend "$@"

    echo "Showing logs for $BACKEND_TYPE backend (Ctrl+C to exit)..."
    echo ""
    $COMPOSE_CMD --profile $BACKEND_TYPE logs -f
}

# Update application
update_app() {
    print_header "Updating Application"

    detect_backend "$@"

    # Backup database before update
    print_info "Creating database backup before update..."
    BACKUP_DIR="./backups"
    BACKUP_FILE="db-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    mkdir -p "$BACKUP_DIR"

    # Load environment for project name
    load_env
    validate_env

    # Backup based on backend type
    if [ "$BACKEND_TYPE" = "python" ]; then
        VOLUME_NAME="${COMPOSE_PROJECT_NAME}_backend-data"
    else
        VOLUME_NAME="${COMPOSE_PROJECT_NAME}_backend-rust-data"
    fi

    # Backup database from volume
    docker run --rm \
        -v $VOLUME_NAME:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/$BACKUP_FILE" -C /data . 2>/dev/null || true

    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        print_success "Database backup created: $BACKUP_DIR/$BACKUP_FILE"
    else
        print_warning "No database found to backup (this is normal for first deployment)"
    fi

    print_info "Pulling latest code from git..."
    git pull

    print_info "Rebuilding containers (preserving data volumes)..."
    # Don't use --volumes flag to preserve data
    $COMPOSE_CMD --profile $BACKEND_TYPE down
    $COMPOSE_CMD --profile $BACKEND_TYPE build --no-cache
    $COMPOSE_CMD --profile $BACKEND_TYPE up -d

    print_success "Application updated successfully!"
    print_info "Database has been preserved in persistent volume"

    sleep 10
    show_status
}

# Backup data
backup_data() {
    print_header "Backing Up Data"

    detect_backend "$@"

    BACKUP_DIR="./backups"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"

    mkdir -p "$BACKUP_DIR"

    # Load environment for project name
    load_env
    validate_env

    print_info "Creating backup of database and temp files ($BACKEND_TYPE backend)..."

    # Determine volume names based on backend type
    if [ "$BACKEND_TYPE" = "python" ]; then
        DATA_VOLUME="${COMPOSE_PROJECT_NAME}_backend-data"
        TEMP_VOLUME="${COMPOSE_PROJECT_NAME}_backend-temp"
    else
        DATA_VOLUME="${COMPOSE_PROJECT_NAME}_backend-rust-data"
        TEMP_VOLUME="${COMPOSE_PROJECT_NAME}_backend-rust-temp"
    fi

    # Backup database (persistent data)
    docker run --rm \
        -v $DATA_VOLUME:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/db-$BACKUP_FILE" -C /data . 2>/dev/null || true

    # Backup temp files
    docker run --rm \
        -v $TEMP_VOLUME:/temp \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/temp-$BACKUP_FILE" -C /temp . 2>/dev/null || true

    print_success "Backups created in: $BACKUP_DIR/"
    ls -lh "$BACKUP_DIR"/*"$BACKUP_FILE" 2>/dev/null || print_warning "No files to backup"
}

# Restore database from backup
restore_data() {
    print_header "Restoring Database"

    detect_backend "$@"

    BACKUP_DIR="./backups"

    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi

    # List available backups
    print_info "Available database backups:"
    ls -lh "$BACKUP_DIR"/db-backup-*.tar.gz 2>/dev/null || {
        print_error "No database backups found"
        exit 1
    }

    echo ""
    read -p "Enter backup filename to restore (e.g., db-backup-20250120-143000.tar.gz): " BACKUP_FILE

    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
        exit 1
    fi

    print_warning "This will REPLACE the current $BACKEND_TYPE backend database!"
    read -p "Are you sure? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        print_info "Restore cancelled"
        exit 0
    fi

    # Load environment for project name
    load_env
    validate_env

    print_info "Stopping application..."
    $COMPOSE_CMD --profile $BACKEND_TYPE down

    # Determine volume name based on backend type
    if [ "$BACKEND_TYPE" = "python" ]; then
        DATA_VOLUME="${COMPOSE_PROJECT_NAME}_backend-data"
    else
        DATA_VOLUME="${COMPOSE_PROJECT_NAME}_backend-rust-data"
    fi

    print_info "Restoring database from: $BACKUP_FILE"
    docker run --rm \
        -v $DATA_VOLUME:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/$BACKUP_FILE -C /data"

    print_success "Database restored successfully!"

    print_info "Starting application..."
    $COMPOSE_CMD --profile $BACKEND_TYPE up -d

    sleep 10
    show_status
}

# Show usage
show_usage() {
    echo "Usage: ./deploy.sh [COMMAND] [BACKEND_TYPE]"
    echo ""
    echo "Commands:"
    echo "  start [python|rust]   - Start the application with specified backend"
    echo "  stop [python|rust]    - Stop the application"
    echo "  restart [python|rust] - Restart the application"
    echo "  switch [python|rust]  - Switch between Python and Rust backend"
    echo "  status [python|rust]  - Show application status"
    echo "  logs [python|rust]    - Show application logs"
    echo "  update [python|rust]  - Update application from git and rebuild"
    echo "  backup [python|rust]  - Backup application data and database"
    echo "  restore [python|rust] - Restore database from backup"
    echo ""
    echo "Backend Types:"
    echo "  python (default)      - Use Python/FastAPI backend"
    echo "  rust                  - Use Rust/Actix-web backend"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh start python           # Start with Python backend"
    echo "  ./deploy.sh start rust             # Start with Rust backend"
    echo "  ./deploy.sh switch rust            # Switch to Rust backend"
    echo "  ./deploy.sh logs                   # Show logs (uses saved backend choice)"
    echo "  ./deploy.sh status                 # Check status"
    echo "  ./deploy.sh backup                 # Backup database"
    echo ""
    echo "Current backend: $([ -f .backend ] && cat .backend || echo 'python (default)')"
}

# Main
main() {
    case "$1" in
        start)
            check_prerequisites
            start_app "$@"
            ;;
        stop)
            stop_app "$@"
            ;;
        restart)
            restart_app "$@"
            ;;
        switch)
            check_prerequisites
            switch_backend "$@"
            ;;
        status)
            show_status "$@"
            ;;
        logs)
            show_logs "$@"
            ;;
        update)
            check_prerequisites
            update_app "$@"
            ;;
        backup)
            backup_data "$@"
            ;;
        restore)
            restore_data "$@"
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
