# Environment Configuration Summary

## Overview

Seluruh konfigurasi deployment sekarang menggunakan file `.env` sebagai single source of truth. Baik `deploy.sh` maupun `docker-compose.yml` akan otomatis membaca dan menggunakan variabel dari file ini.

---

## Perubahan yang Dilakukan

### 1. **File `.env` dan `.env.example`**

File `.env.example` telah diperluas dengan semua variabel yang diperlukan untuk deployment:

```env
# Backend Configuration
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend Configuration
FRONTEND_PORT=3030
FRONTEND_HOST=0.0.0.0
VITE_API_URL=http://localhost:8000

# CORS Configuration
CORS_ORIGINS=http://localhost:3030,http://localhost:5173

# Rust Backend Configuration
RUST_LOG=info

# Docker Configuration
COMPOSE_PROJECT_NAME=konversi-data

# Production Settings
NODE_ENV=production
BACKEND_WORKERS=4
```

### 2. **docker-compose.yml**

Updated untuk membaca semua variabel dari `.env`:

**Python Backend:**
```yaml
container_name: ${COMPOSE_PROJECT_NAME:-konversi-data}-backend-python
environment:
  - HOST=${BACKEND_HOST:-0.0.0.0}
  - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3030}
  - BACKEND_WORKERS=${BACKEND_WORKERS:-4}
```

**Rust Backend:**
```yaml
container_name: ${COMPOSE_PROJECT_NAME:-konversi-data}-backend-rust
environment:
  - RUST_LOG=${RUST_LOG:-info}
  - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3030}
  - BACKEND_HOST=${BACKEND_HOST:-0.0.0.0}
```

**Frontend:**
```yaml
container_name: ${COMPOSE_PROJECT_NAME:-konversi-data}-frontend
build:
  args:
    - VITE_API_URL=${VITE_API_URL:-http://localhost:8000}
environment:
  - NODE_ENV=${NODE_ENV:-production}
  - PORT=${FRONTEND_PORT:-3030}
  - HOST=${FRONTEND_HOST:-0.0.0.0}
```

### 3. **deploy.sh**

Added dua fungsi baru:

**a. `load_env()` - Load variabel dari .env**
```bash
load_env() {
    if [ -f .env ]; then
        set -a
        source <(grep -v '^#' .env | grep -v '^$' | sed 's/\r$//')
        set +a
    fi
}
```

**b. `validate_env()` - Set default values**
```bash
validate_env() {
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
```

**c. `print_backend_info()` - Enhanced output**

Menampilkan configuration summary saat start/status:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuration Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Backend Type:    rust
  Backend Port:    8000
  Frontend Port:   3030
  CORS Origins:    http://localhost:3030,http://localhost:5173
  API URL:         http://localhost:8000
  Project Name:    konversi-data
  Rust Log Level:  info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**d. Volume names menggunakan COMPOSE_PROJECT_NAME**

Semua operasi backup/restore sekarang menggunakan dynamic volume names:
```bash
if [ "$BACKEND_TYPE" = "python" ]; then
    VOLUME_NAME="${COMPOSE_PROJECT_NAME}_backend-data"
else
    VOLUME_NAME="${COMPOSE_PROJECT_NAME}_backend-rust-data"
fi
```

### 4. **DEPLOYMENT_GUIDE.md**

Updated dokumentasi dengan:
- Penjelasan lengkap semua variabel environment
- Contoh konfigurasi production
- Important notes tentang setiap variabel
- Informasi tentang automatic loading

---

## Keuntungan

### ✅ **Centralized Configuration**
- Semua konfigurasi di satu tempat (`.env`)
- Tidak perlu edit multiple files
- Mudah di-version control dengan `.env.example`

### ✅ **Consistency**
- `deploy.sh` dan `docker-compose.yml` gunakan sumber yang sama
- Tidak ada mismatch antara script dan Docker
- Guaranteed sync configuration

### ✅ **Flexibility**
- Gampang switch antara development dan production
- Copy `.env.example` → `.env` → edit sesuai kebutuhan
- Override via environment variables di sistem

### ✅ **Better Defaults**
- Semua variabel punya default values
- Graceful fallback jika `.env` tidak ada
- Dokumentasi inline di `.env.example`

### ✅ **Dynamic Container Names**
- `COMPOSE_PROJECT_NAME` mempengaruhi nama containers dan volumes
- Bisa deploy multiple instances di satu server
- Backup/restore otomatis gunakan nama yang benar

---

## Usage

### Development

```bash
# Copy example
cp .env.example .env

# Edit untuk development (port 5173 untuk Vite dev server)
nano .env

# Start
./deploy.sh start python
```

### Production

```bash
# Copy example
cp .env.example .env

# Edit untuk production
nano .env
```

**Production `.env` example:**
```env
BACKEND_PORT=8000
FRONTEND_PORT=80
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
RUST_LOG=warn
NODE_ENV=production
BACKEND_WORKERS=8
COMPOSE_PROJECT_NAME=konversi-data-prod
```

```bash
# Deploy
./deploy.sh start rust
```

### Multiple Instances

```env
# Instance 1: Production
COMPOSE_PROJECT_NAME=konversi-prod
BACKEND_PORT=8000
FRONTEND_PORT=80

# Instance 2: Staging
COMPOSE_PROJECT_NAME=konversi-staging
BACKEND_PORT=8001
FRONTEND_PORT=8080
```

---

## Variables Reference

| Variable | Default | Description | Used By |
|----------|---------|-------------|---------|
| `BACKEND_PORT` | `8000` | Backend API port | Docker, Deploy Script |
| `BACKEND_HOST` | `0.0.0.0` | Backend bind address | Backend Containers |
| `FRONTEND_PORT` | `3030` | Frontend web port | Docker, Deploy Script |
| `FRONTEND_HOST` | `0.0.0.0` | Frontend bind address | Frontend Container |
| `VITE_API_URL` | `http://localhost:8000` | API URL for frontend build | Frontend Build |
| `CORS_ORIGINS` | `http://localhost:3030,...` | Allowed CORS origins | Backend Containers |
| `RUST_LOG` | `info` | Rust log level | Rust Backend |
| `NODE_ENV` | `production` | Node environment | Frontend Container |
| `BACKEND_WORKERS` | `4` | Python/Uvicorn workers | Python Backend |
| `COMPOSE_PROJECT_NAME` | `konversi-data` | Docker project name | Docker Compose |

---

## Migration Guide

### Dari Versi Sebelumnya

1. **Backup existing .env**
   ```bash
   cp .env .env.backup
   ```

2. **Update .env dengan variabel baru**
   ```bash
   # Add these to your .env
   NODE_ENV=production
   BACKEND_WORKERS=4
   COMPOSE_PROJECT_NAME=konversi-data
   ```

3. **Restart services**
   ```bash
   ./deploy.sh restart
   ```

### Troubleshooting

**Problem: Container names berbeda**
- **Cause**: `COMPOSE_PROJECT_NAME` changed
- **Solution**: Use same `COMPOSE_PROJECT_NAME` or recreate containers

**Problem: CORS errors**
- **Cause**: `CORS_ORIGINS` tidak include frontend URL
- **Solution**: Add frontend domain to `CORS_ORIGINS`

**Problem: Frontend can't reach backend**
- **Cause**: `VITE_API_URL` tidak accessible dari browser
- **Solution**: Use public URL, not Docker internal address

---

## Testing Configuration

```bash
# Check current configuration
./deploy.sh status

# Will display:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configuration Summary:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   Backend Type:    rust
#   Backend Port:    8000
#   Frontend Port:   3030
#   CORS Origins:    http://localhost:3030
#   API URL:         http://localhost:8000
#   ...
```

---

## Security Recommendations

1. **Never commit `.env` to git**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use secrets management in production**
   - External secrets manager
   - Docker secrets
   - Environment variables dari orchestrator

3. **Restrict CORS_ORIGINS**
   - Only add trusted domains
   - Use specific URLs, not wildcards

4. **Use HTTPS in production**
   - Update `VITE_API_URL` to https://
   - Configure reverse proxy
   - Add to `CORS_ORIGINS` with https://

---

*Last Updated: 2025-11-04*  
*Related: DEPLOYMENT_GUIDE.md, docker-compose.yml, deploy.sh*
