# Quick Start Guide

Panduan cepat untuk menjalankan aplikasi konversi data.

## Prerequisites

- Python 3.12+
- Node.js 18+ dan npm/yarn
- uv (Python package manager) - optional tapi recommended

## Step 1: Clone & Setup

```bash
git clone <repository-url>
cd konversi-data
```

## Step 2: Install Backend Dependencies

```bash
# Dengan uv (recommended)
uv sync

# Atau dengan pip
pip install -e .
```

## Step 3: Jalankan Backend

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend akan berjalan di: **http://localhost:8000**

Anda akan melihat output seperti ini:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Step 4: Test Backend (Optional)

Buka terminal baru dan test endpoint:

```bash
# Test health
curl http://localhost:8000/health

# Test konversi
curl -X POST http://localhost:8000/convert \
  -F "file=@test_data/sample.json" \
  -F "sheet_name=Test" \
  -o output.xlsx
```

## Step 5: Install Frontend Dependencies

Buka terminal baru:

```bash
cd frontend
npm install
```

## Step 6: Jalankan Frontend

```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

Output akan seperti:
```
  VITE v5.4.10  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Step 7: Buka Aplikasi

Buka browser dan akses: **http://localhost:5173**

## Step 8: Upload & Convert

1. Klik "Choose File" dan pilih file JSON atau CSV
2. (Optional) Ubah nama sheet
3. Klik "Konversi ke Excel"
4. File Excel akan otomatis terunduh

## Testing dengan Sample Data

Project sudah menyediakan sample data di folder `test_data/`:

- [test_data/sample.json](test_data/sample.json) - Contoh file JSON
- [test_data/sample.csv](test_data/sample.csv) - Contoh file CSV

Gunakan file ini untuk testing!

## One-Line Commands

### Terminal 1 - Backend
```bash
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 - Frontend
```bash
cd frontend && npm run dev
```

## Troubleshooting

Jika ada masalah, lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Quick Fixes

**Backend tidak start**:
```bash
# Kill process yang menggunakan port 8000
lsof -ti:8000 | xargs kill -9

# Restart backend
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend error**:
```bash
# Hapus dan install ulang dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**CORS Error**:
- Pastikan backend sudah berjalan di port 8000
- Restart browser atau clear cache

## Production Build

### Backend
Backend sudah production-ready. Untuk production:

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

Build files akan ada di `frontend/dist/`

## Next Steps

- Lihat [README.md](README.md) untuk dokumentasi lengkap
- Lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md) jika ada masalah
- Coba convert sample data di `test_data/`
- Customisasi sesuai kebutuhan

## API Documentation

Setelah backend running, akses API docs di:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Support

Jika butuh bantuan:
1. Check logs di terminal backend dan frontend
2. Baca troubleshooting guide
3. Test dengan sample data
4. Create issue di GitHub

---

**Happy Converting!** 🚀
