# Konversi Data - JSON/CSV ke Excel

Aplikasi web untuk konversi file JSON dan CSV ke format Excel (.xlsx) menggunakan FastAPI, DuckDB, dan Chakra UI.

---

---

## ✨ Fitur

- ✅ Upload file JSON atau CSV
- ✅ Konversi otomatis ke format Excel
- ✅ Kustomisasi nama sheet
- ✅ Interface yang user-friendly dengan Chakra UI
- ✅ Processing data menggunakan DuckDB untuk performa optimal
- ✅ Download otomatis file hasil konversi

---

## 🛠️ Teknologi

### Backend
- **FastAPI** - Modern Python web framework
- **DuckDB** - In-memory database untuk processing data yang cepat
- **Pandas** - Data manipulation dan export ke Excel
- **OpenPyXL** - Excel file handling

### Frontend
- **React** - UI library
- **Chakra UI** - Component library
- **Vite** - Build tool
- **Axios** - HTTP client

---

## 📁 Struktur Project

```
konversi-data/
├── backend/
│   ├── __init__.py
│   └── main.py              # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main component
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── test_data/
│   ├── sample.json          # Sample JSON
│   └── sample.csv           # Sample CSV
├── pyproject.toml           # Python dependencies
└── README.md
```

---

## 📦 Instalasi

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd konversi-data
```

### 2️⃣ Setup Backend

```bash
# Install dependencies dengan uv (recommended)
uv sync

# Atau dengan pip
pip install -e .
```

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

---

## 🚀 Menjalankan Aplikasi

### 🔥 Development Mode (Recommended)

Gunakan development script untuk menjalankan backend dan frontend secara otomatis:

```bash
# Start dengan Python backend
./dev.sh start python

# Atau start dengan Express backend
./dev.sh start express
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Python only): http://localhost:8000/docs

**Fitur Development:**
- ✅ Hot-reload untuk backend Python
- ✅ HMR (Hot Module Replacement) untuk frontend
- ✅ Logs tersimpan di `logs/` folder
- ✅ Mudah switch antara Python dan Express backend

**Commands:**
```bash
./dev.sh start [python|express]  # Start development
./dev.sh stop                 # Stop all services
./dev.sh status               # Check status
./dev.sh logs                 # View logs
./dev.sh switch express          # Switch backend
```

---

### 🔧 Manual Mode (Alternative)

Jika ingin menjalankan secara manual:

**Backend (Terminal 1):**

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend akan berjalan di: **http://localhost:8000**

**Frontend (Terminal 2):**

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

**Buka Aplikasi:**

Akses di browser: **http://localhost:5173**

---

## 📖 Cara Penggunaan

1. Buka browser dan akses `http://localhost:5173`
2. Klik tombol **"Choose File"** dan pilih file JSON atau CSV
3. (Opsional) Ubah nama sheet di field **"Nama Sheet Excel"**
4. Klik tombol **"Konversi ke Excel"**
5. File Excel akan otomatis terunduh setelah konversi selesai ✅

---

## 🔌 API Endpoints

### `GET /`
Informasi API dan daftar endpoints

### `POST /convert`
Konversi file JSON/CSV ke Excel

**Parameters:**
- `file` (form-data, required): File JSON atau CSV yang akan dikonversi
- `sheet_name` (form-data, optional): Nama sheet di Excel (default: "Data")

**Response:**
- File Excel (.xlsx) siap download

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "duckdb_version": "1.4.1",
  "pandas_version": "2.3.3"
}
```

**API Documentation:** http://localhost:8000/docs (Swagger UI)

---

## 📄 Format File yang Didukung

### JSON Format

File harus berupa **array of objects** dengan struktur yang konsisten:

```json
[
  {
    "nama": "John Doe",
    "umur": 30,
    "kota": "Jakarta"
  },
  {
    "nama": "Jane Smith",
    "umur": 25,
    "kota": "Bandung"
  }
]
```

### CSV Format

File harus memiliki **header row** dan data yang konsisten:

```csv
nama,umur,kota
John Doe,30,Jakarta
Jane Smith,25,Bandung
```

**Sample files tersedia di:** `test_data/sample.json` dan `test_data/sample.csv`

---

---

## 🐳 Production Deployment

### Prerequisites
- Docker Engine 20.10+
- Docker Compose V2 or docker-compose 1.29+

### Quick Start - Production

```bash
# 1. Copy dan edit environment configuration
cp .env.example .env
nano .env

# 2. Deploy dengan Python backend
./deploy.sh start python

# Atau deploy dengan Express backend (recommended for production)
./deploy.sh start express
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost:3030
- **Backend API**: http://localhost:8000

### Deployment Commands

```bash
./deploy.sh start [python|express]  # Start production
./deploy.sh stop                 # Stop application
./deploy.sh status               # Check status
./deploy.sh logs                 # View logs
./deploy.sh switch express          # Switch backend
./deploy.sh backup               # Backup database
./deploy.sh update               # Update & rebuild
```

### Backend Selection

Pilih backend sesuai kebutuhan:

**Python Backend (FastAPI):**
- ✅ Easy to debug
- ✅ Auto API documentation
- ✅ Quick development
- ⚠️  Moderate performance

**Express Backend (Node.js):**
- ✅ Fast and efficient
- ✅ Easy to maintain
- ✅ Production-ready
- ✅ Quick build time

### 🚨 Production Deployment - Express Backend

#### Deploy ke Production

```bash
# Di server production
cd ~/code/konversi-data
./deploy.sh start express
```

#### Verifikasi Deployment

```bash
# Check status
./deploy.sh status

# Check logs
docker logs konversi-data-backend-express

# Test health
curl http://localhost:8000/health
```

**Expected**: `{"status":"healthy","version":"1.0.0"}`

---

## 🔧 Development

Lihat section "Menjalankan Aplikasi" di atas untuk development mode.

---

## 🐳 Docker (Manual)

Jika ingin menggunakan Docker Compose secara manual:

**Build dan jalankan:**
```bash
docker-compose up -d
```

2. **Akses aplikasi:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

3. **Lihat logs:**
```bash
# Semua services
docker-compose logs -f

# Backend saja
docker-compose logs -f backend

# Frontend saja
docker-compose logs -f frontend
```

4. **Stop aplikasi:**
```bash
docker-compose down
```

5. **Stop dan hapus volumes:**
```bash
docker-compose down -v
```

### Docker Commands

**Build ulang images:**
```bash
docker-compose build
```

**Rebuild tanpa cache:**
```bash
docker-compose build --no-cache
```

**Check status containers:**
```bash
docker-compose ps
```

**Masuk ke container:**
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

### Production Deployment

Untuk production, pastikan:

1. Update environment variables di `.env`:
```env
CORS_ORIGINS=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

2. Gunakan reverse proxy (nginx/traefik) di depan containers
3. Enable HTTPS dengan SSL certificates
4. Setup monitoring dan logging
5. Configure restart policies di docker-compose.yml

---

## ⚙️ Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan jika diperlukan:

```env
# Backend
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### Common Issues

| Error | Solusi |
|-------|--------|
| **CORS Error** | Pastikan backend sudah berjalan di port 8000 |
| **File Upload Error** | Pastikan file format .json atau .csv dan tidak kosong |
| **DuckDB Error** | Pastikan struktur data konsisten (JSON: array of objects, CSV: dengan header) |
| **Backend Not Responding** | Check logs: `docker logs konversi-data-backend-express` atau `docker logs konversi-data-backend-python` |

### Deployment Issues

**Jika backend di production crash atau restarting:**

1. Check logs: `docker logs konversi-data-backend-express` atau `docker logs konversi-data-backend-python`
2. Check container status: `./deploy.sh status`
3. Restart backend: `./deploy.sh restart [python|express]`

---

## 🧪 Testing

### Test dengan Sample Data

Project menyediakan sample data untuk testing:

```bash
# Jalankan backend
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000

# Test dengan cURL (terminal lain)
curl -X POST http://localhost:8000/convert \
  -F "file=@test_data/sample.json" \
  -F "sheet_name=Test" \
  -o output.xlsx
```

### Test dengan Frontend

1. Upload `test_data/sample.json` atau `test_data/sample.csv`
2. Klik "Konversi ke Excel"
3. File akan terdownload otomatis

---

## 🤝 Kontribusi

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 Lisensi

MIT License - bebas untuk digunakan dan dimodifikasi.

---

## 👤 Author

**Rizko** - Initial Development

---

## 📞 Support

Jika mengalami masalah:

1. ✅ Baca dokumentasi troubleshooting
2. ✅ Check backend logs di terminal
3. ✅ Check browser console (F12)
4. ✅ Test dengan sample data yang disediakan
5. ✅ Create issue di GitHub dengan detail error

---

**Happy Converting!** 🚀✨
