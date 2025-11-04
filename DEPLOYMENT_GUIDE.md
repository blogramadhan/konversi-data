# Production Deployment Guide

## Overview

This guide explains how to deploy the Konversi Data application to production with the option to choose between Python (FastAPI) or Rust (Actix-web) backend.

---

## Prerequisites

### System Requirements
- Docker Engine 20.10+
- Docker Compose V2 or docker-compose 1.29+
- 2GB+ RAM
- 10GB+ disk space

### Installation
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose (if not included)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd konversi-data
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Edit configuration
```

### 3. Deploy with Python Backend (Default)
```bash
chmod +x deploy.sh
./deploy.sh start python
```

### 4. Deploy with Rust Backend
```bash
./deploy.sh start rust
```

---

## Deployment Commands

### Start Application
```bash
# Python backend
./deploy.sh start python

# Rust backend
./deploy.sh start rust

# Use saved backend choice
./deploy.sh start
```

### Stop Application
```bash
./deploy.sh stop
```

### Restart Application
```bash
./deploy.sh restart
```

### Switch Backend
```bash
# Switch from Python to Rust
./deploy.sh switch rust

# Switch from Rust to Python
./deploy.sh switch python
```

### Check Status
```bash
./deploy.sh status
```

### View Logs
```bash
./deploy.sh logs
```

### Update Application
```bash
# Pull latest code and rebuild (preserves database)
./deploy.sh update
```

### Backup Data
```bash
./deploy.sh backup
```

### Restore Data
```bash
./deploy.sh restore
```

---

## Architecture

### Docker Compose Profiles

The application uses Docker Compose profiles to manage backend selection:

- **Profile: python** - Python/FastAPI backend
- **Profile: rust** - Rust/Actix-web backend
- **Frontend** - Always runs, connects to active backend

### Volumes

**Python Backend:**
- `backend-data` - SQLite database
- `backend-temp` - Temporary uploads/outputs

**Rust Backend:**
- `backend-rust-data` - SQLite database
- `backend-rust-temp` - Temporary uploads/outputs

**Note:** Each backend has separate data volumes to prevent conflicts.

---

## Backend Selection

### How It Works

1. **Command-line argument**: `./deploy.sh start rust`
2. **Saved choice**: Stored in `.backend` file
3. **Default**: Python backend if no choice specified

### Backend Choice Persistence

The deploy script saves your backend choice in `.backend` file:
```bash
# Check current backend
cat .backend

# Output: python or rust
```

### Switching Backends

```bash
# Stop Python backend and start Rust backend
./deploy.sh switch rust

# Stop Rust backend and start Python backend
./deploy.sh switch python
```

**Note:** Switching backends is seamless - the script handles stopping the old backend and starting the new one.

---

## Configuration

### Environment Variables

All deployment configuration is managed through the `.env` file in the root directory. The deploy script and Docker Compose automatically load these variables.

**Create/Edit `.env` file:**

```bash
cp .env.example .env
nano .env
```

**Available Variables:**

```env
# ===================================
# Backend Configuration
# ===================================
BACKEND_PORT=8000                    # Backend API port
BACKEND_HOST=0.0.0.0                 # Backend bind address

# ===================================
# Frontend Configuration
# ===================================
FRONTEND_PORT=3030                   # Frontend web port
FRONTEND_HOST=0.0.0.0               # Frontend bind address
VITE_API_URL=http://localhost:8000  # API URL for frontend (change for production)

# ===================================
# CORS Configuration
# ===================================
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3030,http://localhost:5173

# ===================================
# Rust Backend Configuration
# ===================================
RUST_LOG=info                        # Log level: trace, debug, info, warn, error

# ===================================
# Docker Configuration
# ===================================
COMPOSE_PROJECT_NAME=konversi-data   # Docker project name (affects volume/container names)

# ===================================
# Production Settings
# ===================================
NODE_ENV=production                  # Environment: development, production
BACKEND_WORKERS=4                    # Python backend workers (FastAPI/Uvicorn)
```

**Production Example:**

```env
# Production configuration
BACKEND_PORT=8000
FRONTEND_PORT=80
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
RUST_LOG=warn
NODE_ENV=production
BACKEND_WORKERS=8
COMPOSE_PROJECT_NAME=my-app
```

**Important Notes:**

1. **All variables are loaded automatically** by `deploy.sh` and `docker-compose.yml`
2. **COMPOSE_PROJECT_NAME** affects Docker container and volume names
3. **CORS_ORIGINS** must include all domains that will access the API
4. **VITE_API_URL** must be accessible from the browser (not internal Docker address)
5. **BACKEND_WORKERS** only applies to Python backend (FastAPI/Uvicorn)

### Port Mapping

- **Backend**: Default 8000 (configurable via `BACKEND_PORT`)
- **Frontend**: Default 3030 (configurable via `FRONTEND_PORT`)

### Reverse Proxy (Nginx/Caddy)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Backend Comparison

### Python Backend (FastAPI)

**Pros:**
- Easy to debug
- FastAPI auto-documentation (/docs)
- Mature ecosystem
- Quick development

**Cons:**
- Slower performance
- Higher memory usage
- Requires Python runtime

**Use Cases:**
- Development
- Low traffic
- Need interactive API docs

### Rust Backend (Actix-web)

**Pros:**
- 10x faster performance
- 3-5x lower memory usage
- Single binary
- Production-grade

**Cons:**
- Longer build time
- Less familiar to debug
- No auto-docs endpoint

**Use Cases:**
- Production
- High traffic
- Resource-constrained servers
- Performance-critical

---

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3030
```

### Container Status

```bash
docker ps
# or
./deploy.sh status
```

### Logs

```bash
# Follow logs
./deploy.sh logs

# View specific service
docker logs -f konversi-data-backend-python
docker logs -f konversi-data-backend-rust
docker logs -f konversi-data-frontend
```

---

## Backup & Restore

### Automated Backup

```bash
# Backup database and temp files
./deploy.sh backup

# Backups stored in ./backups/
ls -lh backups/
```

### Restore from Backup

```bash
./deploy.sh restore

# Follow prompts to select backup file
```

### Manual Backup

```bash
# Backup Python backend data
docker run --rm \
  -v konversi-data_backend-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/manual-backup.tar.gz -C /data .

# Backup Rust backend data
docker run --rm \
  -v konversi-data_backend-rust-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/rust-manual-backup.tar.gz -C /data .
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>
```

### Backend Not Responding

```bash
# Check logs
./deploy.sh logs

# Restart
./deploy.sh restart
```

### Database Issues

```bash
# Backup current database
./deploy.sh backup

# Restore from working backup
./deploy.sh restore
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a

# Remove old images
docker image prune -a
```

### Switch Backend Not Working

```bash
# Stop all containers
docker-compose down

# Remove .backend file
rm .backend

# Start fresh
./deploy.sh start python  # or rust
```

---

## Performance Tuning

### Python Backend

Edit `backend/Dockerfile`:
```dockerfile
# Increase workers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Rust Backend

Edit `backend-rust/Dockerfile`:
```dockerfile
# Already optimized with:
# - LTO enabled
# - Single codegen unit
# - Stripped binary
# - Release profile
```

### Database

```bash
# Periodic cleanup
curl -X POST http://localhost:8000/cleanup
```

---

## Security Checklist

- [ ] Change default CORS_ORIGINS
- [ ] Use HTTPS in production
- [ ] Set up firewall rules
- [ ] Enable Docker security scanning
- [ ] Regular backups
- [ ] Update dependencies
- [ ] Monitor logs
- [ ] Use secrets management

---

## Migration Between Backends

### Python to Rust

1. Backup Python database:
   ```bash
   ./deploy.sh backup
   ```

2. Switch to Rust:
   ```bash
   ./deploy.sh switch rust
   ```

3. If needed, migrate database:
   ```bash
   # Both use same SQLite schema, no migration needed
   ```

### Rust to Python

Same process - databases are compatible.

---

## Scaling

### Horizontal Scaling

Use Docker Swarm or Kubernetes:

```bash
# Docker Swarm example
docker swarm init
docker stack deploy -c docker-compose.yml konversi-data
```

### Load Balancing

Use Nginx or HAProxy:

```nginx
upstream backend {
    least_conn;
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Check application status
- Monitor disk usage
- Review logs for errors

**Weekly:**
- Backup database
- Clean up temp files
- Update dependencies

**Monthly:**
- Update Docker images
- Security patches
- Performance review

---

## Support

### Logs Location

- Application: `./deploy.sh logs`
- Docker: `docker logs <container-name>`
- System: `/var/log/syslog`

### Common Issues

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Documentation

- [README.md](README.md) - General overview
- [KONVERSI_RUST_SUMMARY.md](KONVERSI_RUST_SUMMARY.md) - Rust backend
- [ENV_CONFIGURATION_SUMMARY.md](ENV_CONFIGURATION_SUMMARY.md) - Configuration

---

## Quick Reference

```bash
# Start with Python backend
./deploy.sh start python

# Start with Rust backend
./deploy.sh start rust

# Switch backends
./deploy.sh switch rust
./deploy.sh switch python

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Backup
./deploy.sh backup

# Update
./deploy.sh update

# Stop
./deploy.sh stop
```

---

*Last Updated: 2025-11-04*  
*Version: 2.0*
