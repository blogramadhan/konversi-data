# 🚀 Server Deployment Guide

Panduan deploy aplikasi Konversi Data ke server production menggunakan Docker.

---

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: Minimal 2GB (4GB recommended)
- **Storage**: Minimal 10GB free space
- **CPU**: 2 cores minimum

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git

---

## 🛠️ Step-by-Step Installation

### 1. Install Docker

#### Ubuntu/Debian
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (agar tidak perlu sudo)
sudo usermod -aG docker $USER

# Logout dan login lagi, atau jalankan:
newgrp docker

# Verify installation
docker --version
```

#### CentOS/RHEL
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io -y

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
```

### 2. Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 3. Clone Repository

```bash
# Clone repository
git clone <repository-url>
cd konversi-data

# Atau jika sudah di-clone, pull latest
git pull
```

### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Edit `.env`:
```env
# Backend Configuration
BACKEND_PORT=8000
CORS_ORIGINS=http://your-server-ip:3000,http://localhost:3000

# Frontend Configuration
VITE_API_URL=http://your-server-ip:8000
```

Ganti `your-server-ip` dengan IP server Anda.

### 5. Deploy Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy aplikasi
./deploy.sh start
```

Script akan otomatis:
- Build Docker images
- Start containers
- Check health status

### 6. Verify Deployment

Akses aplikasi di browser:
- Frontend: `http://your-server-ip:3000`
- Backend: `http://your-server-ip:8000`
- API Docs: `http://your-server-ip:8000/docs`

---

## 🎮 Using Deploy Script

Script `deploy.sh` menyediakan commands untuk management:

### Start Application
```bash
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

### Check Status
```bash
./deploy.sh status
```

### View Logs
```bash
./deploy.sh logs
```

### Update from Git
```bash
./deploy.sh update
```

### Backup Data
```bash
./deploy.sh backup
```

---

## 🔒 Firewall Configuration

### Ubuntu (UFW)
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (IMPORTANT!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# Check status
sudo ufw status
```

### CentOS (Firewalld)
```bash
# Enable firewall
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow ports
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

---

## 🌐 Setup Domain & SSL (Optional)

### 1. Point Domain to Server

Tambahkan DNS records:
```
A Record:  konversi.yourdomain.com  →  your-server-ip
```

### 2. Install Nginx Reverse Proxy

```bash
# Install nginx
sudo apt install nginx -y

# Create nginx config
sudo nano /etc/nginx/sites-available/konversi-data
```

Paste config:
```nginx
server {
    listen 80;
    server_name konversi.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/konversi-data /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Install SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d konversi.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 4. Update Environment untuk HTTPS

Edit `.env`:
```env
CORS_ORIGINS=https://konversi.yourdomain.com
VITE_API_URL=https://konversi.yourdomain.com/api
```

Restart aplikasi:
```bash
./deploy.sh restart
```

---

## 📊 Monitoring & Maintenance

### Check Application Status

```bash
# Container status
docker-compose ps

# Health check
curl http://localhost:8000/health

# Logs
docker-compose logs -f
```

### Monitor Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop
df -h
free -h
```

### Automatic Backups

Setup cron job untuk backup otomatis:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/konversi-data && ./deploy.sh backup
```

### Log Rotation

Docker logs bisa membesar, setup log rotation:

Edit `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

---

## 🔄 Update & Maintenance

### Update Application

```bash
# Method 1: Using deploy script
./deploy.sh update

# Method 2: Manual
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Cleanup

Hapus temporary files:
```bash
# Via API
curl -X POST http://localhost:8000/cleanup

# Via Docker
docker-compose exec backend rm -rf /app/temp_outputs/*
```

### Docker Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full system cleanup
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h

# Restart Docker
sudo systemctl restart docker
./deploy.sh start
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Restart containers
./deploy.sh restart

# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📈 Performance Tuning

### Increase Uvicorn Workers

Edit `backend/Dockerfile`:
```dockerfile
# Change workers count based on CPU cores
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "8"]
```

Rebuild:
```bash
./deploy.sh restart
```

### Enable Docker BuildKit

Edit `/etc/docker/daemon.json`:
```json
{
  "features": {
    "buildkit": true
  }
}
```

---

## 🔐 Security Best Practices

1. **✅ Keep Docker Updated**
```bash
sudo apt update
sudo apt upgrade docker-ce docker-ce-cli containerd.io
```

2. **✅ Use Non-Root User**
   - Already configured di Dockerfile backend

3. **✅ Limit CORS Origins**
   - Set specific domains di `.env`

4. **✅ Enable Firewall**
   - Only open required ports

5. **✅ Use HTTPS**
   - Setup SSL with Let's Encrypt

6. **✅ Regular Backups**
   - Setup automated backups

7. **✅ Monitor Logs**
   - Check logs regularly for errors

---

## 📞 Support

### Check Logs
```bash
./deploy.sh logs
```

### Get Status
```bash
./deploy.sh status
```

### Manual Restart
```bash
docker-compose down
docker-compose up -d
```

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Let's Encrypt: https://letsencrypt.org/
- Nginx: https://nginx.org/en/docs/

---

**Happy Deploying!** 🚀🎉
