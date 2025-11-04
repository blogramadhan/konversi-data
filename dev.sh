#!/bin/bash

# Development script untuk menjalankan aplikasi secara lokal
# Usage: ./dev.sh [start|stop|restart|logs] [python|rust]

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

# PIDs file
PIDS_FILE=".dev.pids"

# Load environment variables from .env
load_env() {
    if [ -f .env ]; then
        export $(grep -v '^#' .env | grep -v '^$' | xargs)
    fi
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

print_dev_info() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Development Configuration:${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Backend Type:    ${YELLOW}$BACKEND_TYPE${NC}"
    echo -e "  Backend Port:    ${YELLOW}${BACKEND_PORT:-8000}${NC}"
    echo -e "  Frontend Port:   ${YELLOW}${FRONTEND_PORT:-5173}${NC} (Vite dev server)"
    echo -e "  CORS Origins:    ${YELLOW}${CORS_ORIGINS}${NC}"
    if [ "$BACKEND_TYPE" = "rust" ]; then
        echo -e "  Rust Log Level:  ${YELLOW}${RUST_LOG:-debug}${NC}"
    fi
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Load environment variables
    load_env

    if [ "$BACKEND_TYPE" = "python" ]; then
        if ! command -v python3 &> /dev/null; then
            print_error "Python 3 is not installed"
            exit 1
        fi
        print_success "Python installed: $(python3 --version)"
    else
        if ! command -v cargo &> /dev/null; then
            print_error "Rust/Cargo is not installed"
            print_info "Install from: https://rustup.rs/"
            exit 1
        fi
        print_success "Rust installed: $(rustc --version)"
    fi

    if ! command -v npm &> /dev/null; then
        print_error "Node.js/npm is not installed"
        exit 1
    fi
    print_success "Node.js installed: $(node --version)"
    print_success "npm installed: $(npm --version)"
}

# Start Python backend
start_python_backend() {
    print_info "Starting Python backend..."

    cd backend

    # Create virtual environment if not exists
    if [ ! -d ".venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi

    # Activate virtual environment and install dependencies
    source .venv/bin/activate
    print_info "Installing Python dependencies..."
    pip install -q -r requirements.txt

    # Start backend in background
    print_info "Starting FastAPI server on port ${BACKEND_PORT:-8000}..."
    PYTHONUNBUFFERED=1 uvicorn main:app --reload --host ${BACKEND_HOST:-0.0.0.0} --port ${BACKEND_PORT:-8000} > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!

    cd ..

    echo $BACKEND_PID > "$PIDS_FILE.backend"
    print_success "Python backend started (PID: $BACKEND_PID)"
}

# Start Rust backend
start_rust_backend() {
    print_info "Starting Rust backend..."

    cd backend-rust

    # Check if release binary exists, otherwise build
    if [ ! -f "target/release/konversi-data-backend" ]; then
        print_info "Building Rust backend (release mode, this may take a while)..."
        cargo build --release
    fi

    # Start backend in background
    print_info "Starting Actix-web server on port ${BACKEND_PORT:-8000}..."
    RUST_LOG=${RUST_LOG:-debug} ./target/release/konversi-data-backend > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!

    cd ..

    echo $BACKEND_PID > "$PIDS_FILE.backend"
    print_success "Rust backend started (PID: $BACKEND_PID)"
}

# Start frontend
start_frontend() {
    print_info "Starting Frontend (Vite dev server)..."

    cd frontend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    fi

    # Start frontend in background
    print_info "Starting Vite dev server on port ${FRONTEND_PORT:-5173}..."
    npm run dev -- --host ${FRONTEND_HOST:-0.0.0.0} --port ${FRONTEND_PORT:-5173} > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!

    cd ..

    echo $FRONTEND_PID > "$PIDS_FILE.frontend"
    print_success "Frontend started (PID: $FRONTEND_PID)"
}

# Start application
start_app() {
    print_header "Starting Development Environment"

    detect_backend "$@"
    check_prerequisites

    # Create logs directory
    mkdir -p logs

    # Check if already running
    if [ -f "$PIDS_FILE.backend" ] || [ -f "$PIDS_FILE.frontend" ]; then
        print_warning "Application seems to be already running"
        print_info "Run './dev.sh stop' first to stop it"
        exit 1
    fi

    print_dev_info
    echo ""

    # Start backend
    if [ "$BACKEND_TYPE" = "python" ]; then
        start_python_backend
    else
        start_rust_backend
    fi

    # Wait a bit for backend to start
    sleep 2

    # Start frontend
    start_frontend

    # Wait a bit for services to start
    sleep 3

    echo ""
    print_success "Development environment started successfully!"
    echo ""
    show_status
    echo ""
    print_info "Logs:"
    echo "  Backend:  tail -f logs/backend.log"
    echo "  Frontend: tail -f logs/frontend.log"
    echo ""
    print_info "To stop: ./dev.sh stop"
}

# Stop application
stop_app() {
    print_header "Stopping Development Environment"

    STOPPED=0

    # Stop backend
    if [ -f "$PIDS_FILE.backend" ]; then
        BACKEND_PID=$(cat "$PIDS_FILE.backend")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_info "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID 2>/dev/null || true
            sleep 1
            kill -9 $BACKEND_PID 2>/dev/null || true
            print_success "Backend stopped"
            STOPPED=1
        fi
        rm -f "$PIDS_FILE.backend"
    fi

    # Stop frontend
    if [ -f "$PIDS_FILE.frontend" ]; then
        FRONTEND_PID=$(cat "$PIDS_FILE.frontend")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_info "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID 2>/dev/null || true
            sleep 1
            kill -9 $FRONTEND_PID 2>/dev/null || true
            print_success "Frontend stopped"
            STOPPED=1
        fi
        rm -f "$PIDS_FILE.frontend"
    fi

    # Cleanup Python virtual environment processes
    pkill -f "uvicorn main:app" 2>/dev/null || true

    # Cleanup Vite dev server
    pkill -f "vite" 2>/dev/null || true

    if [ $STOPPED -eq 0 ]; then
        print_warning "No running processes found"
    else
        print_success "Development environment stopped"
    fi
}

# Restart application
restart_app() {
    print_header "Restarting Development Environment"

    detect_backend "$@"

    stop_app
    sleep 2
    start_app "$@"
}

# Show status
show_status() {
    print_header "Development Environment Status"

    detect_backend "$@"
    load_env

    print_dev_info
    echo ""

    # Check backend
    if [ -f "$PIDS_FILE.backend" ]; then
        BACKEND_PID=$(cat "$PIDS_FILE.backend")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            if curl -s http://localhost:${BACKEND_PORT:-8000}/health > /dev/null 2>&1; then
                print_success "Backend ($BACKEND_TYPE): Running (PID: $BACKEND_PID, Port: ${BACKEND_PORT:-8000})"
            else
                print_warning "Backend ($BACKEND_TYPE): Process running but not responding (PID: $BACKEND_PID)"
            fi
        else
            print_error "Backend ($BACKEND_TYPE): Not running"
        fi
    else
        print_error "Backend ($BACKEND_TYPE): Not running"
    fi

    # Check frontend
    if [ -f "$PIDS_FILE.frontend" ]; then
        FRONTEND_PID=$(cat "$PIDS_FILE.frontend")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            if curl -s http://localhost:${FRONTEND_PORT:-5173} > /dev/null 2>&1; then
                print_success "Frontend: Running (PID: $FRONTEND_PID, Port: ${FRONTEND_PORT:-5173})"
            else
                print_warning "Frontend: Process running but not responding (PID: $FRONTEND_PID)"
            fi
        else
            print_error "Frontend: Not running"
        fi
    else
        print_error "Frontend: Not running"
    fi

    echo ""
    echo "Access URLs:"
    echo "  Frontend:  http://localhost:${FRONTEND_PORT:-5173}"
    echo "  Backend:   http://localhost:${BACKEND_PORT:-8000} ($BACKEND_TYPE)"
    if [ "$BACKEND_TYPE" = "python" ]; then
        echo "  API Docs:  http://localhost:${BACKEND_PORT:-8000}/docs (FastAPI Swagger)"
    fi
    echo "  Health:    http://localhost:${BACKEND_PORT:-8000}/health"
    echo "  Stats:     http://localhost:${BACKEND_PORT:-8000}/stats"
}

# Show logs
show_logs() {
    print_header "Development Logs"

    detect_backend "$@"

    if [ ! -d "logs" ]; then
        print_error "No logs directory found"
        exit 1
    fi

    print_info "Following logs (Ctrl+C to exit)..."
    echo ""

    # Follow both logs
    tail -f logs/backend.log logs/frontend.log 2>/dev/null
}

# Switch backend
switch_backend() {
    print_header "Switching Backend"

    if [ -z "$2" ]; then
        print_error "Please specify backend type: python or rust"
        echo "Usage: ./dev.sh switch [python|rust]"
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

    # Stop current
    stop_app

    # Update backend choice
    echo "$NEW_BACKEND" > .backend
    BACKEND_TYPE="$NEW_BACKEND"

    sleep 2

    # Start new backend
    start_app
}

# Build backend (useful for Rust)
build_backend() {
    print_header "Building Backend"

    detect_backend "$@"

    if [ "$BACKEND_TYPE" = "rust" ]; then
        print_info "Building Rust backend in release mode..."
        cd backend-rust
        cargo build --release
        cd ..
        print_success "Rust backend built successfully!"
        print_info "Binary location: backend-rust/target/release/konversi-data-backend"
    else
        print_info "Python backend doesn't need pre-building"
        print_success "Python dependencies will be installed on start"
    fi
}

# Show usage
show_usage() {
    echo "Usage: ./dev.sh [COMMAND] [BACKEND_TYPE]"
    echo ""
    echo "Commands:"
    echo "  start [python|rust]   - Start development environment"
    echo "  stop                  - Stop development environment"
    echo "  restart [python|rust] - Restart development environment"
    echo "  switch [python|rust]  - Switch backend type"
    echo "  status                - Show status of services"
    echo "  logs                  - Show and follow logs"
    echo "  build [python|rust]   - Build backend (mainly for Rust)"
    echo ""
    echo "Backend Types:"
    echo "  python (default)      - Use Python/FastAPI backend"
    echo "  rust                  - Use Rust/Actix-web backend"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh start                 # Start with saved/default backend"
    echo "  ./dev.sh start python          # Start with Python backend"
    echo "  ./dev.sh start rust            # Start with Rust backend"
    echo "  ./dev.sh switch rust           # Switch to Rust backend"
    echo "  ./dev.sh logs                  # Follow logs"
    echo "  ./dev.sh stop                  # Stop all services"
    echo ""
    echo "Current backend: $([ -f .backend ] && cat .backend || echo 'python (default)')"
    echo ""
    echo "Development Configuration:"
    echo "  - Backend runs with hot-reload enabled"
    echo "  - Frontend runs with Vite dev server (HMR enabled)"
    echo "  - Logs stored in: logs/backend.log, logs/frontend.log"
}

# Main
main() {
    case "$1" in
        start)
            start_app "$@"
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app "$@"
            ;;
        switch)
            switch_backend "$@"
            ;;
        status)
            show_status "$@"
            ;;
        logs)
            show_logs "$@"
            ;;
        build)
            build_backend "$@"
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
