# CRITICAL FIX - Binary Not Copied Correctly

## Root Cause Identified

**Problem:** Binary di container hanya 307KB, seharusnya ~9.3MB
**Cause:** Binary tidak ter-copy dengan benar dari builder stage ke runtime stage
**Impact:** Binary corrupt/incomplete, crash saat dijalankan

---

## Solution: Force Clean Rebuild

### Step 1: Di Server Production

```bash
cd ~/code/konversi-data

# Pull latest fixes
git pull origin master

# Stop current deployment
./deploy.sh stop

# CRITICAL: Clear ALL Docker build cache
docker builder prune -af

# Remove old image
docker rmi konversi-data-backend-rust -f

# Remove volumes (OPTIONAL - only if you want fresh data)
# docker volume rm konversi-data_backend-rust-data konversi-data_backend-rust-uploads konversi-data_backend-rust-temp

# Rebuild from scratch (NO CACHE)
docker-compose --profile rust build --no-cache backend-rust

# Deploy
./deploy.sh start rust
```

### Step 2: Verify Build Output

During build, you should see these verification steps:

```
Step X/Y : RUN cargo build --release && ls -lh /app/target/release/konversi-data-backend
 ---> Running in xxxxx
...
-rwxr-xr-x 2 root root 9.3M ... /app/target/release/konversi-data-backend
```

And during copy:

```
Step Y/Z : RUN ls -lh /app/konversi-data-backend && file /app/konversi-data-backend
 ---> Running in xxxxx
-rwxr-xr-x 1 root root 9.3M ... /app/konversi-data-backend
/app/konversi-data-backend: ELF 64-bit LSB pie executable...
```

**If you see 307K or similar small size → BUILD FAILED, try again with clean cache**

### Step 3: Check Logs

```bash
docker logs -f konversi-data-backend-rust
```

**Expected SUCCESS output:**

```
=== Rust Backend Startup ===
Binary: /app/konversi-data-backend
Binary exists: YES
Binary size: 9.3M    <--- MUST BE ~9MB, NOT 307K!
Binary type: /app/konversi-data-backend: ELF 64-bit LSB pie executable...
Working directory: /app
User will be: appuser
===========================

Executing: gosu appuser /app/konversi-data-backend
[INFO] Starting Konversi Data API v1.0.0
[INFO] Directories initialized successfully
[INFO] Database initialized successfully at: "data/conversion_stats.db"
[INFO] CORS origins configured: https://konversi-data.pbj.my.id
[INFO] Server will start at 0.0.0.0:8000
```

---

## Why This Happened

Docker's multi-stage build sometimes uses stale cache, causing:
1. Builder stage uses cached (old) binary
2. Source code changed but binary wasn't rebuilt
3. Runtime stage copies the old/incomplete binary

**Solution:** `--no-cache` forces complete rebuild from source.

---

## Alternative: Manual Build Verification

If automated build still fails, build manually:

```bash
cd ~/code/konversi-data/backend-rust

# Build locally first
cargo clean
cargo build --release

# Verify binary
ls -lh target/release/konversi-data-backend
# Should show: 9.3M

# Then rebuild Docker image
cd ..
docker-compose --profile rust build --no-cache backend-rust
./deploy.sh start rust
```

---

## Troubleshooting

### Build Fails with "Binary not created"

```
ERROR: Build failed - binary not created
```

**Solution:**
```bash
# Check disk space
df -h

# Check if Rust toolchain is correct in Docker
docker run --rm rust:1.83-slim rustc --version

# Try building locally first to verify code compiles
cd backend-rust
cargo clean
cargo build --release
```

### Build Succeeds but Binary Still Small

```
Binary size: 307K  (or other small size)
```

**This means build cache is STILL being used!**

```bash
# Nuclear option: Remove everything Docker
docker system prune -af --volumes  # WARNING: Removes ALL unused Docker data!

# Then rebuild
./deploy.sh start rust
```

---

## Expected Timeline

- **Build time:** 5-10 minutes (clean build with no cache)
- **Deploy time:** 1-2 minutes
- **Total:** ~10-15 minutes

**Be patient** - clean Rust builds take time, but ensure correct binary.

---

## Success Criteria

✅ Binary size in container: **~9.3MB** (not 307KB!)
✅ Logs show: "Starting Konversi Data API v1.0.0"
✅ Health check: `curl http://localhost:8000/health` returns `{"status":"healthy"}`
✅ Backend status: Running (not Restarting)

---

*If issues persist after this, the problem is NOT the binary copy - investigate other areas*

Last Updated: 2025-11-04
