# 🐳 Docker Deployment Guide

Panduan lengkap untuk deploy aplikasi Konversi Data menggunakan Docker.

---

## 📋 Prerequisites

Pastikan sudah terinstall:
- Docker (version 20.10+)
- Docker Compose (version 2.0+)

Cek versi:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### 1. Build dan Jalankan

```bash
# Build dan start semua services
docker-compose up -d

# atau dengan rebuild
docker-compose up -d --build
```

### 2. Akses Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Monitoring

```bash
# Lihat logs semua services
docker-compose logs -f

# Lihat logs backend saja
docker-compose logs -f backend

# Lihat logs frontend saja
docker-compose logs -f frontend

# Check status containers
docker-compose ps
```

### 4. Stop Aplikasi

```bash
# Stop containers (data tetap ada)
docker-compose down

# Stop dan hapus volumes (hapus semua data)
docker-compose down -v
```

---

## 🏗️ Struktur Docker

### File-file Docker

```
konversi-data/
├── docker-compose.yml          # Orchestration config
├── backend/
│   ├── Dockerfile             # Backend image config
│   └── .dockerignore          # Exclude files dari image
└── frontend/
    ├── Dockerfile             # Frontend image config
    └── .dockerignore          # Exclude files dari image
```

### Services

1. **Backend** (konversi-data-backend)
   - Port: 8000
   - Image: Python 3.11 slim
   - Workers: 4 (uvicorn)
   - Healthcheck: Enabled

2. **Frontend** (konversi-data-frontend)
   - Port: 3000
   - Image: Node 20 alpine
   - Static server: serve
   - Depends on: backend (dengan health check)

### Volumes

- `backend-temp`: Menyimpan temporary output files

### Network

- `konversi-network`: Bridge network untuk komunikasi antar containers

---

## ⚙️ Environment Variables

### Setup Environment

1. Copy `.env.example` ke `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` sesuai kebutuhan:
```env
# Backend
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:8000
```

### Environment Variables Detail

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `BACKEND_PORT` | 8000 | Port untuk backend API |
| `CORS_ORIGINS` | localhost:3000,5173 | Allowed origins untuk CORS |
| `VITE_API_URL` | http://localhost:8000 | Backend URL untuk frontend |

---

## 🔧 Docker Commands

### Build & Start

```bash
# Build images
docker-compose build

# Build tanpa cache
docker-compose build --no-cache

# Start services
docker-compose up -d

# Start dengan build
docker-compose up -d --build

# Start dan lihat logs
docker-compose up
```

### Management

```bash
# Stop services
docker-compose stop

# Start services yang sudah di-stop
docker-compose start

# Restart services
docker-compose restart

# Restart service tertentu
docker-compose restart backend
docker-compose restart frontend
```

### Logs & Debugging

```bash
# Lihat logs (follow mode)
docker-compose logs -f

# Lihat logs 100 baris terakhir
docker-compose logs --tail=100

# Lihat logs service tertentu
docker-compose logs -f backend

# Masuk ke container
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Cleanup

```bash
# Stop dan remove containers
docker-compose down

# Remove containers + volumes
docker-compose down -v

# Remove containers + images
docker-compose down --rmi all

# Remove semua (containers, volumes, images)
docker-compose down -v --rmi all

# Clean up Docker system
docker system prune -a
```

---

## 🌐 Production Deployment

### 1. Setup Environment Variables

Edit `.env` untuk production:

```env
# Backend
BACKEND_PORT=8000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

### 2. Security Considerations

- ✅ Gunakan HTTPS dengan SSL certificates
- ✅ Setup reverse proxy (nginx/traefik)
- ✅ Limit CORS origins ke domain spesifik
- ✅ Enable firewall rules
- ✅ Regular security updates
- ✅ Monitor logs untuk suspicious activity

### 3. Recommended Production Stack

```
Internet
    ↓
[Traefik/Nginx] (Reverse Proxy + SSL)
    ↓
[Docker Network]
    ├── Frontend Container (Port 3000)
    └── Backend Container (Port 8000)
```

### 4. Docker Compose Production

Buat `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    expose:
      - "8000"
    environment:
      - PYTHONUNBUFFERED=1
      - CORS_ORIGINS=${CORS_ORIGINS}
    volumes:
      - backend-temp:/app/temp_outputs
    networks:
      - konversi-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${VITE_API_URL}
    restart: always
    expose:
      - "3000"
    depends_on:
      - backend
    networks:
      - konversi-network

volumes:
  backend-temp:

networks:
  konversi-network:
```

Jalankan dengan:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Monitoring & Logging

Setup monitoring dengan:
- **Logs**: Docker logs atau external logging service
- **Metrics**: Prometheus + Grafana
- **Uptime**: Uptime Kuma atau Healthchecks.io
- **Alerts**: Email/Slack notifications

---

## 🐛 Troubleshooting

### Container tidak bisa start

```bash
# Check logs
docker-compose logs

# Check status
docker-compose ps

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

### Port sudah digunakan

```bash
# Cek process yang menggunakan port
lsof -i :8000
lsof -i :3000

# Atau ganti port di .env
BACKEND_PORT=8001
```

### Frontend tidak bisa connect ke backend

1. Cek backend logs:
```bash
docker-compose logs backend
```

2. Cek CORS settings di backend
3. Pastikan `VITE_API_URL` di frontend benar
4. Test backend health:
```bash
curl http://localhost:8000/health
```

### Permission denied errors

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Atau run dengan sudo
sudo docker-compose up -d
```

### Volume issues

```bash
# Remove dan recreate volumes
docker-compose down -v
docker-compose up -d
```

---

## 📊 Health Checks

### Backend Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "duckdb_version": "1.4.1",
  "pandas_version": "2.3.3"
}
```

### Frontend Health Check

```bash
curl http://localhost:3000/
```

### Container Health

```bash
docker-compose ps
```

---

## 🔄 Updates & Maintenance

### Update ke versi terbaru

```bash
# Pull latest code
git pull

# Rebuild dan restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Data

```bash
# Backup volumes
docker run --rm -v konversi-data_backend-temp:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data

# Restore
docker run --rm -v konversi-data_backend-temp:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

---

## 📚 Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose Documentation: https://docs.docker.com/compose/
- FastAPI in Docker: https://fastapi.tiangolo.com/deployment/docker/
- Vite Production: https://vitejs.dev/guide/build.html

---

## 💡 Tips

1. **Development**: Gunakan `docker-compose.yml` default dengan hot reload
2. **Production**: Gunakan `docker-compose.prod.yml` dengan restart policies
3. **CI/CD**: Integrate dengan GitHub Actions atau GitLab CI
4. **Scaling**: Use Docker Swarm atau Kubernetes untuk high availability
5. **Monitoring**: Always monitor logs dan metrics di production

---

**Happy Deploying!** 🚀
