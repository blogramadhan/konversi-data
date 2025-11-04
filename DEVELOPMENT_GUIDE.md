# Development Guide

## Overview

Panduan ini menjelaskan cara menjalankan aplikasi Konversi Data di environment development lokal. Development script (`dev.sh`) menyediakan cara mudah untuk menjalankan backend (Python atau Rust) dan frontend secara bersamaan dengan hot-reload enabled.

---

## Prerequisites

### System Requirements

**For Python Backend:**
- Python 3.8+
- pip
- Node.js 16+
- npm

**For Rust Backend:**
- Rust 1.70+ (Install from: https://rustup.rs/)
- Node.js 16+
- npm

### Installation

**Install Python (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv
```

**Install Node.js (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Install Rust:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

---

## Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd konversi-data

# Copy environment configuration
cp .env.example .env

# Make dev script executable (if not already)
chmod +x dev.sh
```

### 2. Configure Environment

Edit `.env` file untuk development:

```env
# Backend Configuration
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend Configuration (Vite dev server)
FRONTEND_PORT=5173
FRONTEND_HOST=0.0.0.0

# Frontend API URL
VITE_API_URL=http://localhost:8000

# CORS Configuration (penting untuk development)
CORS_ORIGINS=http://localhost:5173,http://localhost:3030

# Rust Backend Configuration
RUST_LOG=debug
```

**Note:** Port frontend default untuk development adalah `5173` (Vite dev server).

### 3. Start Development

**With Python Backend:**
```bash
./dev.sh start python
```

**With Rust Backend:**
```bash
./dev.sh start rust
```

**Use saved/default backend:**
```bash
./dev.sh start
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Python only): http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Stats**: http://localhost:8000/stats

---

## Development Commands

### Start Application

```bash
# Start with Python backend
./dev.sh start python

# Start with Rust backend
./dev.sh start rust

# Start with last used backend
./dev.sh start
```

### Stop Application

```bash
./dev.sh stop
```

### Restart Application

```bash
# Restart with same backend
./dev.sh restart

# Restart with different backend
./dev.sh restart rust
```

### Switch Backend

```bash
# Switch from Python to Rust (stops current, starts new)
./dev.sh switch rust

# Switch from Rust to Python
./dev.sh switch python
```

### Check Status

```bash
./dev.sh status
```

Output example:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Development Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Backend Type:    rust
  Backend Port:    8000
  Frontend Port:   5173 (Vite dev server)
  CORS Origins:    http://localhost:5173
  Rust Log Level:  debug
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Backend (rust): Running (PID: 12345, Port: 8000)
✓ Frontend: Running (PID: 12346, Port: 5173)

Access URLs:
  Frontend:  http://localhost:5173
  Backend:   http://localhost:8000 (rust)
  Health:    http://localhost:8000/health
  Stats:     http://localhost:8000/stats
```

### View Logs

```bash
# Follow logs for both backend and frontend
./dev.sh logs

# View specific log file
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Build Backend

```bash
# Build Rust backend (release mode)
./dev.sh build rust

# Python backend doesn't need pre-building
./dev.sh build python
```

---

## Development Features

### Hot Reload / Live Reload

**Python Backend:**
- Uses `uvicorn --reload`
- Auto-restarts when `.py` files change
- Changes reflect immediately

**Rust Backend:**
- Uses release binary (faster)
- Manual restart needed after code changes
- For development with hot-reload, use `cargo watch`:
  ```bash
  cd backend-rust
  cargo watch -x run
  ```

**Frontend:**
- Vite dev server with HMR (Hot Module Replacement)
- Changes reflect instantly in browser
- No page refresh needed for most changes

### Debugging

**Python Backend:**
```bash
# Stop dev.sh backend first
./dev.sh stop

# Run manually with debugger
cd backend
source .venv/bin/activate
python -m debugpy --listen 5678 -m uvicorn main:app --reload
```

**Rust Backend:**
```bash
# Stop dev.sh backend first
./dev.sh stop

# Run with debug logging
cd backend-rust
RUST_LOG=debug cargo run
```

**Frontend:**
```bash
# Stop dev.sh frontend first
./dev.sh stop

# Run manually
cd frontend
npm run dev
```

### Environment Variables

Development script automatically loads `.env` file. Priority:

1. System environment variables
2. `.env` file in root directory
3. Default values in scripts

---

## Backend Comparison

### Python Backend (FastAPI)

**Pros:**
- ✅ Faster development (no compilation)
- ✅ Hot-reload out of the box
- ✅ Interactive API docs at `/docs`
- ✅ Easy debugging

**Cons:**
- ❌ Slower performance
- ❌ Higher memory usage
- ❌ Need virtual environment

**Use Case:** General development, quick prototyping

### Rust Backend (Actix-web)

**Pros:**
- ✅ Production-like performance
- ✅ Fast request handling
- ✅ Low memory footprint
- ✅ Type safety

**Cons:**
- ❌ Compilation time (1-2 minutes)
- ❌ Need manual restart after changes
- ❌ Harder to debug

**Use Case:** Performance testing, production simulation

---

## Common Workflows

### Daily Development Flow

```bash
# Morning: Start development
./dev.sh start python

# Work on code...
# Python backend auto-reloads
# Frontend HMR updates instantly

# Check status occasionally
./dev.sh status

# View logs if needed
./dev.sh logs

# End of day: Stop
./dev.sh stop
```

### Testing Performance

```bash
# Switch to Rust for performance testing
./dev.sh switch rust

# Run tests...

# Switch back to Python for development
./dev.sh switch python
```

### Adding New Features

```bash
# Start with Python (faster iteration)
./dev.sh start python

# Develop feature...
# Test functionality...

# Switch to Rust to ensure compatibility
./dev.sh switch rust

# Test with Rust backend...
```

---

## Directory Structure

```
konversi-data/
├── backend/              # Python backend (FastAPI)
│   ├── main.py
│   ├── requirements.txt
│   └── .venv/           # Created by dev.sh
├── backend-rust/        # Rust backend (Actix-web)
│   ├── src/
│   ├── Cargo.toml
│   └── target/          # Created by cargo
├── frontend/            # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── node_modules/    # Created by npm
├── logs/                # Development logs (created by dev.sh)
│   ├── backend.log
│   └── frontend.log
├── .env                 # Your configuration
├── .backend             # Current backend choice
├── .dev.pids.backend    # Backend PID (created by dev.sh)
├── .dev.pids.frontend   # Frontend PID (created by dev.sh)
├── dev.sh               # Development script
└── deploy.sh            # Production deployment script
```

---

## Troubleshooting

### Port Already in Use

**Error:** "Address already in use" or port conflict

**Solution:**
```bash
# Stop dev.sh services
./dev.sh stop

# Check what's using the ports
sudo lsof -i :8000  # Backend
sudo lsof -i :5173  # Frontend

# Kill the processes
sudo kill -9 <PID>

# Start again
./dev.sh start
```

### Backend Not Starting

**Python Backend:**
```bash
# Check Python version
python3 --version  # Should be 3.8+

# Manually test
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Rust Backend:**
```bash
# Check Rust installation
rustc --version
cargo --version

# Rebuild
cd backend-rust
cargo clean
cargo build --release
```

### Frontend Not Starting

```bash
# Check Node.js version
node --version  # Should be 16+
npm --version

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### CORS Errors

**Problem:** Frontend can't access backend API

**Solution:** Update `.env`:
```env
# Add frontend dev server URL to CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3030
```

Restart:
```bash
./dev.sh restart
```

### Process Not Stopping

```bash
# Force stop all related processes
pkill -f uvicorn
pkill -f konversi-data-backend
pkill -f vite

# Clean PID files
rm -f .dev.pids.*
```

### Logs Not Showing

```bash
# Check if logs directory exists
ls -la logs/

# If not, create it
mkdir -p logs

# Check file permissions
ls -la logs/*.log
```

---

## Tips & Best Practices

### 1. Use Python for Active Development

Python backend has hot-reload, making it faster for rapid development cycles.

```bash
./dev.sh start python
```

### 2. Test with Rust Before Committing

Ensure code works with both backends before committing.

```bash
# After Python development
./dev.sh switch rust
# Test everything works
```

### 3. Monitor Logs During Development

Keep logs open in separate terminal:

```bash
# Terminal 1: Development
./dev.sh start python

# Terminal 2: Logs
./dev.sh logs
```

### 4. Use Status to Debug

```bash
# Check if services are running properly
./dev.sh status
```

### 5. Clean Restart

If things seem broken:

```bash
./dev.sh stop
rm -rf backend/.venv frontend/node_modules
./dev.sh start python
```

### 6. Environment Variables

Always use `.env` file, don't hardcode:

```env
# Good ✅
BACKEND_PORT=8000

# Bad ❌ - hardcoded in code
```

### 7. Backend Selection Persistence

Script remembers your last backend choice:

```bash
./dev.sh start python   # Sets Python
./dev.sh stop
./dev.sh start          # Uses Python (saved)
```

---

## Integration with IDEs

### VS Code

**Python Backend:**
1. Install Python extension
2. Select interpreter: `.venv/bin/python`
3. Use built-in debugger

**Rust Backend:**
1. Install rust-analyzer extension
2. Use CodeLLDB for debugging

**Frontend:**
1. Install ES7+ React/Redux snippets
2. Use Chrome debugger extension

### PyCharm / IntelliJ

1. Open project root
2. Configure Python interpreter from `.venv`
3. Set run configuration for `uvicorn main:app`

### RustRover

1. Open `backend-rust` folder
2. Use built-in Cargo integration
3. Run/Debug from IDE

---

## Performance Comparison

| Metric | Python Backend | Rust Backend |
|--------|---------------|--------------|
| Startup Time | ~2 seconds | ~100ms |
| Memory Usage | ~100-150 MB | ~10-20 MB |
| Request Latency | ~50-100ms | ~5-10ms |
| Hot Reload | ✅ Yes | ❌ No |
| Build Time | - | ~2 minutes |
| Development Speed | ⚡ Fast | 🐢 Slower |
| Production Performance | 🐢 Slower | ⚡ Fast |

**Recommendation:** Use Python for development, Rust for production.

---

## CI/CD Integration

For automated testing in CI/CD:

```bash
# In CI pipeline
cp .env.example .env
./dev.sh start rust
./dev.sh status
# Run tests...
./dev.sh stop
```

---

## Next Steps

- Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment
- Read [ENV_CONFIGURATION_SUMMARY.md](ENV_CONFIGURATION_SUMMARY.md) for configuration details
- Read [README.md](README.md) for project overview

---

*Last Updated: 2025-11-04*
*Related: dev.sh, deploy.sh, .env.example*
