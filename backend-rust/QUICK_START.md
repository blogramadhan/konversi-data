# Backend Rust - Quick Start Guide

## 🚀 Quick Start

### 1. Install Rust (Jika belum)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install Dependencies
```bash
sudo apt-get update
sudo apt-get install -y pkg-config libssl-dev
```

### 3. Build & Run
```bash
cd backend-rust

# Development
cargo run

# Production
cargo build --release
./target/release/konversi-data-backend
```

Server runs on: **http://localhost:8000**

---

## 🧪 Test Endpoints

```bash
# Health check
curl http://localhost:8000/health

# API info
curl http://localhost:8000/

# Upload file
curl -X POST http://localhost:8000/convert \
  -F "file=@data.json" \
  -o output.xlsx

# Convert from URL
curl -X POST http://localhost:8000/convert-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/data.csv"}' \
  -o output.xlsx

# Get stats
curl http://localhost:8000/stats
```

---

## 🐳 Docker

```bash
# Build
docker build -t backend-rust .

# Run
docker run -p 8000:8000 -v $(pwd)/data:/app/data backend-rust
```

---

## 📁 Project Structure

```
backend-rust/
├── src/
│   ├── main.rs       - Entry point
│   ├── handlers.rs   - API endpoints
│   ├── database.rs   - Database ops
│   ├── models.rs     - Data types
│   └── utils.rs      - Utilities
├── Cargo.toml        - Dependencies
├── Dockerfile        - Docker config
└── README.md         - Full docs
```

---

## ⚡ Performance

- **Startup:** ~100ms
- **Memory:** ~10-20 MB
- **Throughput:** ~10,000 req/s
- **Binary:** 9.2 MB

---

## 🔧 Environment Variables

Backend otomatis membaca dari `../.env` (root project).

Edit file `.env` di root project:
```bash
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3030,http://localhost:5173
RUST_LOG=info
```

**Priority:**
1. System environment variables
2. `../.env` (root project) ← **Recommended**
3. `backend-rust/.env` (local)
4. Default values

---

## 📚 More Info

See [README.md](README.md) for complete documentation.

See [../KONVERSI_RUST_SUMMARY.md](../KONVERSI_RUST_SUMMARY.md) for conversion details.
