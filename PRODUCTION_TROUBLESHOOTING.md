# Production Deployment Troubleshooting

Panduan troubleshooting untuk deployment Docker di production server.

---

## Diagnostic Commands untuk Server Production

Jalankan command-command berikut di server production Anda untuk mendiagnosis masalah:

### 1. Check Container Logs

```bash
# Lihat 100 baris terakhir
docker logs konversi-data-backend-rust --tail 100

# Follow logs real-time
docker logs -f konversi-data-backend-rust
```

### 2. Check Container Status

```bash
# Lihat status container
docker ps -a | grep konversi-data

# Lihat exit code
docker inspect konversi-data-backend-rust --format='{{.State.ExitCode}}'

# Lihat restart count
docker inspect konversi-data-backend-rust --format='{{.RestartCount}}'
```

### 3. Check Environment Variables

```bash
# Verify env vars di dalam container
docker exec konversi-data-backend-rust env | grep -E "CORS|BACKEND|RUST_LOG"
```

---

## Common Issues & Solutions

### Issue 1: Container Keeps Restarting (Exit Code 0)

**Symptom:** Container status "Restarting", exit code 0

**Possible Causes:**
1. Permission issue pada mounted volumes
2. Binary tidak bisa write ke /app/data, /app/temp_uploads, atau /app/temp_outputs

**Solution:**
```bash
# Check logs untuk error specifik
docker logs konversi-data-backend-rust --tail 50

# Jika ada permission error, rebuild ulang:
./deploy.sh stop
./deploy.sh start rust
```

### Issue 2: "Address already in use"

**Symptom:** Logs menunjukkan "Address already in use" atau "bind: address already in use"

**Solution:**
```bash
# Cek apa yang menggunakan port 8000
sudo lsof -i :8000

# Atau dengan netstat
sudo netstat -tulpn | grep :8000

# Matikan process yang menggunakan port tersebut
# Atau ubah BACKEND_PORT di .env
```

### Issue 3: Environment Variables Tidak Ter-load

**Symptom:** Logs menunjukkan default values, bukan dari .env

**Diagnostic:**
```bash
# Verify .env file
cat .env

# Check if compose is loading .env
cd /path/to/konversi-data
docker-compose config | grep -A 10 environment
```

**Solution:**
```bash
# Ensure .env has Unix line endings (not Windows CRLF)
dos2unix .env

# Rebuild with fresh environment
./deploy.sh stop
./deploy.sh start rust
```

### Issue 4: Entrypoint Permission Errors

**Symptom:** Logs show `permission denied` saat menjalankan entrypoint script

**Solution:**
```bash
# Rebuild image dari awal
./deploy.sh stop
docker rmi konversi-data-backend-rust
./deploy.sh start rust
```

---

## Step-by-Step Diagnostic Process

Ikuti langkah-langkah berikut secara berurutan:

### Step 1: Get Full Error Logs

```bash
docker logs konversi-data-backend-rust --tail 200 2>&1 | tee backend-error.log
cat backend-error.log
```

### Step 2: Check if Directories Exist in Container

```bash
# Jika container masih up (walaupun unhealthy)
docker exec konversi-data-backend-rust ls -la /app/

# Check directories
docker exec konversi-data-backend-rust ls -la /app/data
docker exec konversi-data-backend-rust ls -la /app/temp_uploads  
docker exec konversi-data-backend-rust ls -la /app/temp_outputs
```

### Step 3: Verify Binary Exists and is Executable

```bash
docker exec konversi-data-backend-rust ls -la /app/konversi-data-backend
docker exec konversi-data-backend-rust file /app/konversi-data-backend
```

### Step 4: Test Manual Execution

```bash
# Stop current deployment
./deploy.sh stop

# Run container interactively
docker run -it --rm \
  --name test-rust-backend \
  -p 8000:8000 \
  -e RUST_LOG=debug \
  -e BACKEND_HOST=0.0.0.0 \
  -e BACKEND_PORT=8000 \
  -e "CORS_ORIGINS=https://konversi-data.pbj.my.id" \
  konversi-data-backend-rust \
  sh

# Inside container, check if binary runs
./konversi-data-backend
```

---

## Nuclear Option: Complete Rebuild

Jika semua langkah di atas gagal, lakukan complete rebuild:

```bash
# 1. Stop semua
./deploy.sh stop

# 2. Hapus semua volumes
docker volume ls | grep konversi-data | awk '{print $2}' | xargs -r docker volume rm

# 3. Hapus semua images
docker images | grep konversi-data | awk '{print $3}' | xargs -r docker rmi -f

# 4. Clean build cache
docker builder prune -af

# 5. Pull latest code
git pull origin master

# 6. Start fresh dengan build ulang
./deploy.sh start rust
```

---

## Quick Commands Reference

```bash
# View logs
docker logs -f konversi-data-backend-rust

# Restart backend only
docker-compose --profile rust restart backend-rust

# Check resource usage
docker stats konversi-data-backend-rust

# Enter container shell (if running)
docker exec -it konversi-data-backend-rust sh

# Check volumes
docker volume ls | grep konversi-data

# Inspect volume
docker volume inspect konversi-data_backend-rust-data

# Check network
docker network inspect konversi-data_konversi-network

# Full container inspection
docker inspect konversi-data-backend-rust | less
```

---

## What to Share When Asking for Help

Jika masih belum terselesaikan, share informasi berikut:

```bash
# 1. Container logs
docker logs konversi-data-backend-rust --tail 200 > logs.txt

# 2. Container status
docker ps -a | grep konversi-data > status.txt

# 3. Environment config (REDACT sensitive info!)
cat .env > env.txt

# 4. Docker inspect
docker inspect konversi-data-backend-rust > inspect.json

# 5. System info
uname -a > system-info.txt
docker version >> system-info.txt
docker-compose version >> system-info.txt
```

Kemudian kirim file-file tersebut saat meminta bantuan.

---

*Last Updated: 2025-11-04*
