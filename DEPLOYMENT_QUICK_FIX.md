# Quick Fix untuk Production Deployment

## Masalah: Backend Rust Not Responding

### Symptoms
- Container status: "Restarting"
- Logs hanya menampilkan "Starting application as appuser..." berulang kali
- Health check failed

### Root Cause
Binary Rust tidak executable atau path tidak benar setelah Docker rebuild.

---

## Solution: Deploy dengan Fix Terbaru

### Step 1: Stop Current Deployment
```bash
cd /path/to/konversi-data
./deploy.sh stop
```

### Step 2: Pull Latest Changes
```bash
git pull origin master
```

### Step 3: Rebuild & Deploy
```bash
# Deploy dengan force rebuild
./deploy.sh start rust
```

### Step 4: Monitor Logs
```bash
# Watch logs untuk memastikan berjalan dengan benar
docker logs -f konversi-data-backend-rust
```

**Expected Output (Good):**
```
Starting Rust backend as appuser...
Binary: /app/konversi-data-backend
Working directory: /app
User: appuser
[2025-11-04T...] INFO Starting Konversi Data API v1.0.0
[2025-11-04T...] INFO Directories initialized successfully
[2025-11-04T...] INFO Database initialized successfully at: "data/conversion_stats.db"
[2025-11-04T...] INFO CORS origins configured: https://konversi-data.pbj.my.id
[2025-11-04T...] INFO Server will start at 0.0.0.0:8000
```

**Bad Output (Problem):**
```
Starting Rust backend as appuser...
Starting Rust backend as appuser...
Starting Rust backend as appuser...
(terus berulang tanpa output lain)
```

### Step 5: Verify Status
```bash
./deploy.sh status
```

**Expected:**
```
Health Checks:
✓ Backend (rust): Running (http://localhost:8000)
✓ Frontend: Running (http://localhost:3030)
```

---

## If Still Not Working

### Option 1: Clean Rebuild (Recommended)

```bash
# 1. Stop everything
./deploy.sh stop

# 2. Remove old images
docker rmi konversi-data-backend-rust -f

# 3. Clear build cache
docker builder prune -f

# 4. Rebuild from scratch
./deploy.sh start rust
```

### Option 2: Nuclear Option (If Option 1 Fails)

```bash
# WARNING: This will delete all data!
# Backup first if you have important data

# 1. Stop
./deploy.sh stop

# 2. Remove EVERYTHING
docker volume ls | grep konversi-data | awk '{print $2}' | xargs -r docker volume rm
docker images | grep konversi-data | awk '{print $3}' | xargs -r docker rmi -f
docker builder prune -af

# 3. Fresh start
./deploy.sh start rust
```

---

## Post-Deployment Verification

### 1. Check Backend Health
```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy","version":"1.0.0"}`

### 2. Check Frontend
```bash
curl http://localhost:3030
```

Should return HTML content.

### 3. Test File Conversion
Upload a test CSV file through the frontend interface.

---

## Common Issues After Fix

### Issue: CORS Errors in Browser

**Symptom:** Frontend can access backend, but browser shows CORS errors

**Check:**
```bash
# Verify CORS_ORIGINS in .env includes your production domain
cat .env | grep CORS_ORIGINS
```

**Fix:**
Update `.env`:
```env
CORS_ORIGINS=https://konversi-data.pbj.my.id
```

Then restart:
```bash
./deploy.sh restart rust
```

### Issue: 502 Bad Gateway (Nginx)

**Symptom:** Nginx returns 502 when accessing backend

**Check:**
```bash
# Verify backend is listening on port 8000
netstat -tulpn | grep :8000

# Verify backend is healthy
curl http://localhost:8000/health
```

**Fix:**
Update nginx config to point to `localhost:8000` or the correct backend address.

---

## Changes Made (for Reference)

Files updated to fix the issue:

1. **backend-rust/Dockerfile**
   - Added `chmod +x` for binary (line 50)
   - Changed CMD to use absolute path: `/app/konversi-data-backend` (line 71)

2. **backend-rust/docker-entrypoint.sh**
   - Added debug output
   - Ensures binary is executable before running
   - Added explicit chmod +x in entrypoint as backup

3. **docker-compose.yml**
   - Added missing volume mounts for temp_uploads
   - Fixed profile configuration for frontend

4. **deploy.sh**
   - Already supports environment variable loading and validation

---

## Need More Help?

If backend still not responding after all steps:

1. **Collect full logs:**
   ```bash
   docker logs konversi-data-backend-rust --tail 500 > backend-full.log
   docker inspect konversi-data-backend-rust > backend-inspect.json
   ```

2. **Check system resources:**
   ```bash
   free -h
   df -h
   docker stats konversi-data-backend-rust
   ```

3. **Try manual run:**
   ```bash
   docker run -it --rm \
     -p 8000:8000 \
     -e RUST_LOG=debug \
     -e BACKEND_HOST=0.0.0.0 \
     -e BACKEND_PORT=8000 \
     -e "CORS_ORIGINS=https://konversi-data.pbj.my.id" \
     konversi-data-backend-rust \
     /bin/sh -c "ls -la /app && /app/konversi-data-backend"
   ```

4. **Share the output** from steps above when asking for help.

---

*Last Updated: 2025-11-04*
*Related: PRODUCTION_TROUBLESHOOTING.md, deploy.sh*
