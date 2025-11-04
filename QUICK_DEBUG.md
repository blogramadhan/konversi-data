# Quick Debug Instructions

## Untuk Server Production - Langkah Cepat

### Step 1: Pull Latest Changes
```bash
cd ~/code/konversi-data  # atau path project Anda
git pull origin master
```

### Step 2: Rebuild dengan Enhanced Debug
```bash
# Stop current deployment
./deploy.sh stop

# Remove old image untuk force rebuild
docker rmi konversi-data-backend-rust -f

# Rebuild and start
./deploy.sh start rust
```

### Step 3: Check Enhanced Logs
```bash
docker logs -f konversi-data-backend-rust
```

## Expected Output dengan Enhanced Debug

Anda seharusnya melihat output seperti ini:

```
=== Rust Backend Startup ===
Binary: /app/konversi-data-backend
Binary exists: YES
Binary size: 9.2M
Binary type: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked...
Working directory: /app
User will be: appuser
===========================

Executing: gosu appuser /app/konversi-data-backend
[INFO] Starting Konversi Data API v1.0.0
[INFO] Directories initialized successfully
[INFO] Database initialized successfully
...
```

## Jika Masih Error

Logs akan menunjukkan salah satu dari:

1. **Binary not found** - Image tidak ter-build dengan benar
2. **Binary not readable** - Permission issue
3. **ldd output** - Missing shared libraries
4. **Exit code XXX** - Binary crash dengan error code

### Tindakan Berdasarkan Error:

**Error: "Binary not found"**
```bash
# Image corrupt, rebuild dari scratch
./deploy.sh stop
docker rmi konversi-data-backend-rust -f
docker builder prune -f
./deploy.sh start rust
```

**Error: "ldd: ... not found"**
```bash
# Missing shared libraries - share output untuk analisa lebih lanjut
docker logs konversi-data-backend-rust > error-ldd.log
```

**Error: "Exit code 139" (Segmentation fault)**
```bash
# Binary mungkin di-compile untuk architecture yang berbeda
# Atau ada issue dengan libc version
docker exec konversi-data-backend-rust uname -m
docker exec konversi-data-backend-rust ldd --version
```

## Jika Semua Gagal: Manual Test

```bash
# Stop deployment
./deploy.sh stop

# Run container secara manual untuk debug
docker run -it --rm \
  --name test-rust \
  -p 8000:8000 \
  -e RUST_LOG=debug \
  -e BACKEND_HOST=0.0.0.0 \
  -e BACKEND_PORT=8000 \
  -e "CORS_ORIGINS=https://konversi-data.pbj.my.id" \
  konversi-data-backend-rust \
  /bin/sh

# Di dalam container, test manually:
ls -la /app/
file /app/konversi-data-backend
ldd /app/konversi-data-backend
/app/konversi-data-backend
```

---

*Setelah menjalankan steps di atas, share output logs yang lengkap untuk analisa lebih lanjut*
