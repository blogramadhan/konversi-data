# Konversi Data Backend - Rust Version

Backend API yang ditulis dalam Rust untuk mengonversi file JSON/CSV ke format Excel. Ini adalah port dari versi Python menggunakan FastAPI.

## Fitur

- **Upload File**: Upload file JSON atau CSV dan konversi ke Excel
- **Konversi URL**: Download file dari URL (JSON/CSV) dan konversi ke Excel
- **Statistik**: Track conversion statistics dan daily usage
- **Health Check**: Endpoint untuk monitoring kesehatan aplikasi
- **Cleanup**: Cleanup file temporary yang sudah dikonversi

## Teknologi

- **Actix-web**: Web framework untuk Rust
- **rust_xlsxwriter**: Library untuk generate file Excel
- **SQLite (rusqlite)**: Database untuk menyimpan statistik
- **Serde**: Serialization/deserialization
- **Reqwest**: HTTP client untuk download dari URL

## Struktur Project

```
backend-rust/
├── src/
│   ├── main.rs          # Entry point aplikasi
│   ├── handlers.rs      # HTTP request handlers
│   ├── models.rs        # Data models dan structs
│   ├── database.rs      # Database operations
│   └── utils.rs         # Utility functions
├── Cargo.toml           # Dependencies
├── Dockerfile           # Docker image configuration
└── README.md
```

## Development

### Prerequisites

- Rust 1.82 atau lebih baru
- Cargo (package manager Rust)

### Setup

1. Install dependencies:
```bash
cargo build
```

2. Run development server:
```bash
cargo run
```

Server akan berjalan di `http://localhost:8000`

### Build untuk Production

```bash
cargo build --release
```

Binary akan tersedia di `target/release/konversi-data-backend`

## Docker

### Build Docker image:

```bash
docker build -t konversi-data-backend-rust .
```

### Run Docker container:

```bash
docker run -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -e CORS_ORIGINS="http://localhost:3030" \
  konversi-data-backend-rust
```

## API Endpoints

### GET /
Informasi API dan available endpoints

### POST /convert
Upload dan konversi file JSON/CSV ke Excel

**Body (multipart/form-data):**
- `file`: File JSON atau CSV
- `sheet_name` (optional): Nama sheet Excel (default: "Data")

### POST /convert-url
Download file dari URL dan konversi ke Excel

**Body (JSON):**
```json
{
  "url": "https://example.com/data.json",
  "sheet_name": "Data"
}
```

### GET /stats
Mendapatkan statistik konversi

### GET /health
Health check endpoint

### POST /cleanup
Cleanup file Excel temporary

## Environment Variables

Backend akan otomatis membaca file `.env` dari folder root project (`../env`) terlebih dahulu, kemudian fallback ke `.env` di folder `backend-rust`.

### Supported Variables:

- `BACKEND_HOST` atau `HOST`: Host address (default: "0.0.0.0")
- `BACKEND_PORT` atau `PORT`: Port number (default: "8000")
- `CORS_ORIGINS`: Allowed CORS origins, comma-separated (default: "http://localhost:3030,http://konversi-data-frontend:3030")
- `RUST_LOG`: Log level (default: "info")

### Priority:
1. Environment variables di sistem
2. `../.env` (file .env di root project)
3. `./.env` (file .env di folder backend-rust)
4. Default values

### Example `.env` di root project:
```env
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3030,http://localhost:5173
RUST_LOG=info
```

## Perbandingan dengan Python Version

### Keuntungan Rust Version:
- **Performance**: 5-10x lebih cepat dalam processing file
- **Memory Efficiency**: Penggunaan memory lebih rendah
- **Reliability**: Type safety dan memory safety
- **Binary Size**: Single binary tanpa dependencies runtime
- **Concurrency**: Better concurrent request handling

### Trade-offs:
- **Compile Time**: Build time lebih lama dibanding Python
- **Development Speed**: Learning curve lebih tinggi
- **Ecosystem**: Beberapa library mungkin kurang mature dibanding Python

## License

Same as parent project
