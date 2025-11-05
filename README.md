# 📊 Konversi Data - JSON/CSV ke Excel

Aplikasi web modern untuk konversi file JSON dan CSV ke format Excel (.xlsx) dengan statistik real-time dan dual backend support (Python FastAPI & Node.js Express).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node](https://img.shields.io/badge/Node-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

---

## ✨ Fitur Utama

### 🎯 Konversi Data
- ✅ Upload file JSON atau CSV
- ✅ Konversi dari URL (JSON/CSV online)
- ✅ Konversi otomatis ke format Excel (.xlsx)
- ✅ Kustomisasi nama sheet Excel
- ✅ Auto-formatting kolom Excel
- ✅ Download otomatis file hasil konversi

### 📊 Statistik Real-time
- ✅ Total konversi keseluruhan
- ✅ Statistik hari ini
- ✅ Grafik 7 hari terakhir
- ✅ Breakdown berdasarkan tipe konversi
- ✅ Breakdown berdasarkan format file
- ✅ Data disimpan di MongoDB Atlas

### 🚀 Backend Options
- ✅ **Python Backend** - FastAPI dengan auto documentation
- ✅ **Express Backend** - Node.js untuk performa tinggi
- ✅ Switch backend dengan 1 perintah
- ✅ Hot-reload untuk development
- ✅ Production-ready dengan Docker

### 🎨 User Experience
- ✅ Interface modern dengan Chakra UI
- ✅ Responsive design
- ✅ Real-time progress indicator
- ✅ Error handling yang informatif
- ✅ Tab-based navigation (Upload File & Dari URL)

---

## 🛠️ Teknologi Stack

### Backend Options

#### Option 1: Python Backend (FastAPI)
- **FastAPI** - Modern Python web framework
- **DuckDB** - In-memory analytical database
- **Pandas** - Data manipulation library
- **OpenPyXL** - Excel file handling
- **Motor** - Async MongoDB driver
- **Uvicorn** - ASGI server

#### Option 2: Express Backend (Node.js)
- **Express.js** - Fast web framework
- **DuckDB** - In-memory analytical database
- **ExcelJS** - Excel file generation
- **Mongoose** - MongoDB ODM
- **Multer** - File upload handling

### Frontend
- **React 18** - UI library
- **Chakra UI** - Modern component library
- **Vite** - Lightning-fast build tool
- **Axios** - HTTP client
- **React Icons** - Icon library

### Database
- **MongoDB Atlas** - Cloud database untuk statistics

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Production web server (frontend)

---

## 📁 Struktur Project

```
konversi-data/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # FastAPI application
│   ├── Dockerfile             # Backend container config
│   └── docker-entrypoint.sh   # Container entrypoint
│
├── backend-express/           # Node.js Express backend
│   ├── server.js              # Express application
│   ├── package.json           # Node dependencies
│   └── Dockerfile             # Backend container config
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main component
│   │   ├── main.jsx          # Entry point
│   │   └── theme.js          # Chakra UI theme
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile            # Frontend container config
│
├── test_data/                # Sample data untuk testing
│   ├── sample.json           # Sample JSON file
│   └── sample.csv            # Sample CSV file
│
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── docker-compose.yml        # Docker orchestration
├── dev.sh                    # Development script
├── deploy.sh                 # Production deployment script
├── pyproject.toml            # Python dependencies
├── uv.lock                   # Python lock file
└── README.md                 # Documentation
```

---

## 📦 Prerequisites

### For Development (Local)
- **Python 3.12+** (jika menggunakan Python backend)
- **Node.js 20+** dan npm (untuk Express backend dan frontend)
- **MongoDB Atlas Account** (untuk database statistics)

### For Production (Docker)
- **Docker Engine 20.10+**
- **Docker Compose V2** atau docker-compose 1.29+
- **MongoDB Atlas Account**

---

## 🚀 Quick Start

### Development Mode (Local)

#### 1. Clone Repository
```bash
git clone <repository-url>
cd konversi-data
```

#### 2. Setup Environment Variables
```bash
cp .env.example .env
nano .env  # Edit dan isi MONGODB_URI dengan credentials Anda
```

#### 3. Start Application

**Dengan Express Backend (Recommended):**
```bash
./dev.sh start express
```

**Atau dengan Python Backend:**
```bash
./dev.sh start python
```

#### 4. Akses Aplikasi
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Python only): http://localhost:8000/docs

### Production Mode (Docker)

#### 1. Setup Environment
```bash
cp .env.example .env
nano .env  # Edit dan isi MONGODB_URI
```

#### 2. Deploy

**Dengan Express Backend:**
```bash
./deploy.sh start express
```

**Atau dengan Python Backend:**
```bash
./deploy.sh start python
```

#### 3. Akses Aplikasi
- **Frontend**: http://localhost:3030
- **Backend API**: http://localhost:8000

---

## 🎮 Development Commands

### Start & Stop
```bash
./dev.sh start [python|express]   # Start development environment
./dev.sh stop                      # Stop all services
./dev.sh restart [python|express]  # Restart services
```

### Monitoring
```bash
./dev.sh status                    # Check service status
./dev.sh logs                      # Follow all logs
```

### Backend Switching
```bash
./dev.sh switch express            # Switch to Express backend
./dev.sh switch python             # Switch to Python backend
```

### Build
```bash
./dev.sh build express             # Install Express dependencies
./dev.sh build python              # Setup Python environment
```

**Fitur Development:**
- ✅ Auto-reload backend (uvicorn --reload atau nodemon)
- ✅ HMR (Hot Module Replacement) frontend dengan Vite
- ✅ Logs tersimpan di `logs/backend.log` dan `logs/frontend.log`
- ✅ Easy backend switching

---

## 🐳 Production Deployment

### Deploy Commands
```bash
./deploy.sh start [python|express]   # Start production
./deploy.sh stop                      # Stop application
./deploy.sh restart [python|express]  # Restart services
./deploy.sh status                    # Check status & health
./deploy.sh logs                      # View logs
./deploy.sh switch express            # Switch backend
./deploy.sh backup                    # Backup MongoDB data
./deploy.sh restore                   # Restore from backup
./deploy.sh update                    # Pull latest code & rebuild
```

### Backend Selection Guide

#### Python Backend (FastAPI)
**Gunakan jika:**
- ✅ Butuh auto-generated API documentation (Swagger)
- ✅ Development focus dengan quick iteration
- ✅ Familiar dengan Python ecosystem

**Kelebihan:**
- Auto API docs di `/docs`
- Easy debugging
- Rich Python libraries

#### Express Backend (Node.js)
**Gunakan jika:**
- ✅ Production deployment
- ✅ Need maximum performance
- ✅ Familiar dengan Node.js ecosystem

**Kelebihan:**
- Faster execution
- Lower memory footprint
- Quick build time
- Production-proven

---

## 📖 Cara Penggunaan

### Upload File

1. Buka aplikasi di browser
2. Pilih tab **"Upload File"**
3. Klik **"Choose File"** dan pilih file JSON atau CSV
4. (Opsional) Ubah nama sheet di field **"Nama Sheet Excel"**
5. Klik **"Konversi ke Excel"**
6. File Excel akan otomatis terunduh ✅

### Konversi dari URL

1. Pilih tab **"Dari URL"**
2. Masukkan URL lengkap file JSON atau CSV
3. (Opsional) Ubah nama sheet
4. Klik **"Konversi ke Excel"**
5. File Excel akan otomatis terunduh ✅

### Lihat Statistik

Dashboard menampilkan:
- **Total Konversi**: Semua konversi sejak awal
- **Hari Ini**: Konversi hari ini (file upload & URL)
- **Format Populer**: Format paling banyak dikonversi (JSON/CSV)

---

## 🔌 API Endpoints

### Health Check
```http
GET /health
```
Response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Convert File
```http
POST /convert
Content-Type: multipart/form-data

Parameters:
- file: File (JSON/CSV)
- sheet_name: String (optional, default: "Data")
```

### Convert from URL
```http
POST /convert-url
Content-Type: application/json

Body:
{
  "url": "https://example.com/data.json",
  "sheet_name": "Data" (optional)
}
```

### Get Statistics
```http
GET /stats
```
Response:
```json
{
  "total_conversions": 150,
  "by_type": {
    "file_upload": 100,
    "url_conversion": 50
  },
  "by_format": {
    "json": 90,
    "csv": 60
  },
  "today": {
    "total": 10,
    "file_upload": 7,
    "url_conversion": 3
  },
  "last_7_days": [...]
}
```

### Cleanup
```http
POST /cleanup
```

**API Documentation (Python backend only):** http://localhost:8000/docs

---

## 📄 Format File yang Didukung

### JSON Format

File harus berupa **array of objects**:

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

File harus memiliki **header row**:

```csv
nama,umur,kota
John Doe,30,Jakarta
Jane Smith,25,Bandung
```

**Sample files:** `test_data/sample.json` dan `test_data/sample.csv`

---

## ⚙️ Environment Variables

File `.env.example` berisi template konfigurasi:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/?appName=YourApp

# Backend Configuration
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
BACKEND_WORKERS=4

# Frontend Configuration
FRONTEND_PORT=3030
FRONTEND_HOST=0.0.0.0
VITE_API_URL=http://localhost:8000

# CORS Configuration
CORS_ORIGINS=http://localhost:3030,http://localhost:5173

# Docker Configuration
COMPOSE_PROJECT_NAME=konversi-data
NODE_ENV=production
```

### Konfigurasi MongoDB

1. Buat cluster gratis di [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Buat database user dengan password
3. Whitelist IP address (0.0.0.0/0 untuk testing)
4. Copy connection string ke `MONGODB_URI` di `.env`

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solusi |
|-------|--------|
| **CORS Error** | Pastikan CORS_ORIGINS di .env sesuai dengan frontend URL |
| **MongoDB Connection Failed** | Cek MONGODB_URI, pastikan IP whitelisted di Atlas |
| **File Upload Error** | Cek format file (harus JSON array atau CSV dengan header) |
| **Port Already in Use** | Ubah BACKEND_PORT atau FRONTEND_PORT di .env |
| **Docker Build Failed** | Jalankan `docker system prune` dan rebuild |

### Debugging

**Development Mode:**
```bash
# Check logs
./dev.sh logs

# Check specific service
tail -f logs/backend.log
tail -f logs/frontend.log
```

**Production Mode:**
```bash
# Check status
./deploy.sh status

# Check logs
./deploy.sh logs

# Check specific container
docker logs konversi-data-backend-express
docker logs konversi-data-backend-python
docker logs konversi-data-frontend
```

### Reset Environment

**Development:**
```bash
./dev.sh stop
rm -rf logs/
rm .backend .dev.pids*
./dev.sh start express
```

**Production:**
```bash
./deploy.sh stop
docker system prune -a
./deploy.sh start express
```

---

## 🧪 Testing

### Test dengan Sample Data

#### Via Frontend
1. Akses http://localhost:5173 (dev) atau http://localhost:3030 (prod)
2. Upload file dari `test_data/sample.json` atau `test_data/sample.csv`
3. Klik "Konversi ke Excel"
4. Verify file terdownload dengan benar

#### Via API (cURL)

**Test File Upload:**
```bash
curl -X POST http://localhost:8000/convert \
  -F "file=@test_data/sample.json" \
  -F "sheet_name=TestSheet" \
  -o output.xlsx
```

**Test URL Conversion:**
```bash
curl -X POST http://localhost:8000/convert-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://api.example.com/data.json","sheet_name":"Data"}' \
  -o output.xlsx
```

**Test Health:**
```bash
curl http://localhost:8000/health
```

**Test Stats:**
```bash
curl http://localhost:8000/stats
```

---

## 🔐 Security

### Production Checklist

- ✅ Ganti `MONGODB_URI` dengan credentials production
- ✅ Update `CORS_ORIGINS` dengan domain production
- ✅ Set `NODE_ENV=production`
- ✅ Gunakan HTTPS dengan reverse proxy (Nginx/Caddy)
- ✅ Limit file upload size (default: 100MB)
- ✅ Implement rate limiting
- ✅ Regular security updates

### Security Features

- ✅ Non-root user di Docker containers (UID 1001)
- ✅ CORS protection
- ✅ File type validation
- ✅ Automatic file cleanup
- ✅ Environment variables untuk secrets

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - Free to use and modify.

---

## 👤 Author

**ThynK.my.id** - [https://thynk.my.id](https://thynk.my.id)

---

## 🙏 Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Chakra UI](https://chakra-ui.com/)
- [DuckDB](https://duckdb.org/)
- [MongoDB](https://www.mongodb.com/)

---

## 📞 Support

Butuh bantuan?

1. ✅ Baca dokumentasi di atas
2. ✅ Check troubleshooting section
3. ✅ Cek logs untuk error details
4. ✅ Test dengan sample data
5. ✅ Create issue dengan detail lengkap

---

**Happy Converting!** 🚀✨
