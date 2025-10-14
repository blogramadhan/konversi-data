# Struktur Project

Berikut adalah struktur project yang bersih dan rapi:

```
konversi-data/
│
├── backend/                    # Backend FastAPI + DuckDB
│   ├── __init__.py
│   └── main.py                # Main API application
│
├── frontend/                   # Frontend React + Chakra UI
│   ├── src/
│   │   ├── App.jsx           # Main component
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── test_data/                  # Sample data untuk testing
│   ├── sample.json            # Sample JSON file
│   └── sample.csv             # Sample CSV file
│
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── .python-version            # Python version (3.12)
├── pyproject.toml             # Python dependencies
├── uv.lock                    # UV lock file
│
├── README.md                  # Dokumentasi utama
├── QUICK_START.md             # Quick start guide
├── TROUBLESHOOTING.md         # Troubleshooting guide
├── DEBUG_CHECKLIST.md         # Debug checklist
├── UNTUK_ERROR_KONVERSI_GAGAL.md  # Panduan fix error
├── PROJECT_SUMMARY.md         # Project summary
└── STRUKTUR_PROJECT.md        # File ini
```

## 📂 Penjelasan Direktori

### `/backend`
Backend API menggunakan FastAPI dan DuckDB untuk processing data.

**File:**
- `main.py` - FastAPI application dengan endpoints:
  - `POST /convert` - Upload dan konversi file
  - `GET /health` - Health check
  - `POST /cleanup` - Cleanup temporary files

### `/frontend`
Frontend React dengan Chakra UI untuk user interface.

**File:**
- `src/App.jsx` - Main component dengan form upload
- `src/main.jsx` - Entry point
- `index.html` - HTML template
- `package.json` - NPM dependencies
- `vite.config.js` - Vite configuration

### `/test_data`
Sample data untuk testing aplikasi.

**File:**
- `sample.json` - Sample JSON (5 rows)
- `sample.csv` - Sample CSV (5 rows)

## 📄 File Konfigurasi

### `.env.example`
Template untuk environment variables. Copy ke `.env` untuk customization:
```env
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
VITE_API_URL=http://localhost:8000
```

### `pyproject.toml`
Python dependencies untuk backend:
- fastapi
- uvicorn
- duckdb
- pandas
- openpyxl
- python-multipart

### `package.json`
NPM dependencies untuk frontend:
- react
- @chakra-ui/react
- axios
- vite

## 📚 File Dokumentasi

| File | Deskripsi |
|------|-----------|
| `README.md` | Dokumentasi utama dengan overview lengkap |
| `QUICK_START.md` | Panduan cepat untuk memulai |
| `TROUBLESHOOTING.md` | Panduan troubleshooting lengkap |
| `DEBUG_CHECKLIST.md` | Checklist untuk debugging |
| `UNTUK_ERROR_KONVERSI_GAGAL.md` | Panduan khusus fix error konversi |
| `PROJECT_SUMMARY.md` | Ringkasan project dan testing results |
| `STRUKTUR_PROJECT.md` | Penjelasan struktur project (file ini) |

## 🗂️ Direktori yang Di-ignore

Direktori berikut di-ignore oleh git (lihat `.gitignore`):

- `__pycache__/` - Python bytecode
- `.venv/` - Python virtual environment
- `node_modules/` - NPM packages
- `temp_uploads/` - Temporary upload files
- `temp_outputs/` - Temporary output files
- `frontend/dist/` - Frontend build output
- `.env` - Environment variables

## 📊 Ukuran File

Estimasi ukuran direktori:

```
backend/          ~10 KB   (source code)
frontend/src/     ~10 KB   (source code)
test_data/        ~800 B   (sample files)
dokumentasi/      ~40 KB   (markdown files)
dependencies/     ~500 MB  (node_modules + .venv)
```

## 🔄 Lifecycle Files

### Temporary Files (Dibuat saat runtime)

**Backend:**
```
backend/temp_uploads/     # Files yang diupload (auto-deleted)
backend/temp_outputs/     # Excel output files
```

**Frontend:**
```
frontend/.vite/          # Vite cache
frontend/dist/           # Production build
```

### Generated Files (Tidak di-commit)

```
test_*.xlsx              # Test output files
*_output_*.xlsx          # Testing results
*.log                    # Log files
```

## 🛠️ Development Files

File yang dibutuhkan untuk development:

```
.python-version          # Python version untuk pyenv/asdf
uv.lock                  # Lockfile untuk reproducible builds
package-lock.json        # NPM lockfile
```

## 📋 File Tree (Clean)

Struktur lengkap tanpa dependencies dan cache:

```
.
├── backend/
│   ├── __init__.py
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── test_data/
│   ├── sample.csv
│   └── sample.json
├── .env.example
├── .gitignore
├── .python-version
├── DEBUG_CHECKLIST.md
├── PROJECT_SUMMARY.md
├── QUICK_START.md
├── README.md
├── STRUKTUR_PROJECT.md
├── TROUBLESHOOTING.md
├── UNTUK_ERROR_KONVERSI_GAGAL.md
├── pyproject.toml
└── uv.lock
```

## ✅ Clean Structure Checklist

- ✅ No duplicate files
- ✅ No test output files
- ✅ No temporary files
- ✅ Clear documentation structure
- ✅ Proper .gitignore configuration
- ✅ Sample data available
- ✅ All necessary config files present

## 📝 Notes

1. **Backend directories** (`temp_uploads/`, `temp_outputs/`) akan dibuat otomatis saat aplikasi running
2. **Frontend dependencies** (`node_modules/`) akan dibuat saat `npm install`
3. **Python venv** (`.venv/`) akan dibuat saat `uv sync`
4. **Test files** tidak di-commit ke git repository

---

Last updated: 2025-10-14
