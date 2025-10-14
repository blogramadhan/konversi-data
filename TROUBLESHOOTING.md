# Troubleshooting Guide

## Backend Issues

### 1. ModuleNotFoundError: No module named 'fastapi'

**Problem**: Dependencies tidak terinstall atau menggunakan Python environment yang salah.

**Solution**:
```bash
# Install dependencies
uv sync

# Atau dengan pip
pip install -e .

# Jalankan backend dengan uv
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Port 8000 sudah digunakan

**Problem**: Backend tidak bisa start karena port sudah dipakai.

**Solution**:
```bash
# Kill process yang menggunakan port 8000
lsof -ti:8000 | xargs kill -9

# Atau gunakan port lain
uv run uvicorn main:app --host 0.0.0.0 --port 8001
```

### 3. CORS Error dari Frontend

**Problem**: Browser memblokir request karena CORS.

**Solution**:
- Pastikan backend sudah berjalan di `http://localhost:8000`
- Periksa CORS configuration di [backend/main.py](backend/main.py:15-21)
- Tambahkan origin frontend jika menggunakan port lain

### 4. File Upload Error

**Error Message**: "Format file tidak didukung"

**Solution**:
- Pastikan file berformat `.json` atau `.csv`
- Cek extension file dengan benar
- File harus memiliki struktur data yang valid

**Error Message**: "File kosong"

**Solution**:
- Pastikan file tidak kosong
- Periksa isi file dengan text editor

**Error Message**: "File tidak mengandung data"

**Solution**:
- JSON: Pastikan ada array of objects
- CSV: Pastikan ada header dan minimal 1 baris data

### 5. DuckDB Error

**Error Message**: "Error processing file dengan DuckDB"

**Common Causes**:

1. **JSON tidak valid**:
   ```json
   // SALAH - bukan array
   {
     "nama": "John",
     "umur": 30
   }

   // BENAR - array of objects
   [
     {
       "nama": "John",
       "umur": 30
     }
   ]
   ```

2. **CSV struktur tidak konsisten**:
   ```csv
   # SALAH - jumlah kolom tidak sama
   nama,umur,kota
   John,30
   Jane,25,Bandung,Extra

   # BENAR
   nama,umur,kota
   John,30,Jakarta
   Jane,25,Bandung
   ```

3. **Encoding file salah**:
   - Pastikan file menggunakan UTF-8 encoding
   - Convert dengan: `iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv`

### 6. Konversi Berhasil tapi File Excel Tidak Terunduh

**Problem**: FileResponse tidak terdownload di browser.

**Solution**:
- Periksa console browser untuk error
- Pastikan axios responseType adalah 'blob'
- Clear browser cache
- Coba browser lain

## Frontend Issues

### 1. npm install gagal

**Solution**:
```bash
# Hapus node_modules dan package-lock
rm -rf node_modules package-lock.json

# Install ulang
npm install

# Atau gunakan yarn
yarn install
```

### 2. Port 5173 sudah digunakan

**Solution**:
```bash
# Edit vite.config.js, ganti port
server: {
  port: 5174  // gunakan port lain
}
```

### 3. Axios Error: Network Error

**Problem**: Frontend tidak bisa connect ke backend.

**Solution**:
1. Pastikan backend sudah berjalan: `curl http://localhost:8000/health`
2. Periksa URL di [frontend/src/App.jsx](frontend/src/App.jsx) (line 18)
3. Periksa firewall atau antivirus

### 4. File Upload Stuck di "Sedang memproses..."

**Problem**: Request timeout atau backend crash.

**Solution**:
1. Check backend logs
2. Coba file yang lebih kecil
3. Periksa struktur file
4. Restart backend

## Testing

### Manual Test dengan cURL

**Test Health**:
```bash
curl http://localhost:8000/health
```

**Test JSON Conversion**:
```bash
curl -X POST http://localhost:8000/convert \
  -F "file=@test_data/sample.json" \
  -F "sheet_name=MyData" \
  -o output.xlsx
```

**Test CSV Conversion**:
```bash
curl -X POST http://localhost:8000/convert \
  -F "file=@test_data/sample.csv" \
  -F "sheet_name=CSVData" \
  -o output.xlsx
```

### Test dengan Python

Gunakan script test yang sudah disediakan:

```bash
# Install requests terlebih dahulu
pip install requests

# Jalankan test
python test_backend.py
```

## Logs dan Debugging

### Backend Logs

Backend menggunakan Python logging. Untuk melihat logs:

```bash
# Jalankan dengan log level DEBUG
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug
```

Logs akan menampilkan:
- File yang diupload
- Proses loading dengan DuckDB
- Jumlah rows dan columns
- Konversi ke Excel
- Error details jika ada masalah

### Frontend Logs

Buka browser console (F12) untuk melihat:
- Network requests
- Response errors
- JavaScript errors

## Performance Issues

### File Besar Lambat

**Solution**:
1. DuckDB sudah optimal, tapi bisa ditingkatkan dengan:
   - Increase memory limit
   - Use streaming untuk file sangat besar
   - Pagination untuk data besar

2. Frontend optimization:
   - Show progress bar
   - Add file size limit validation

### Memory Error

**Problem**: Out of memory saat process file besar.

**Solution**:
```python
# Edit backend/main.py
# Tambah memory limit untuk DuckDB
conn = duckdb.connect(':memory:', config={'memory_limit': '2GB'})
```

## Common Questions

### Q: Apakah bisa upload multiple files sekaligus?

A: Saat ini tidak support. Perlu tambah fitur batch upload.

### Q: Apakah bisa konversi Excel ke JSON/CSV?

A: Saat ini hanya support JSON/CSV ke Excel. Reverse conversion bisa ditambahkan.

### Q: Ukuran file maksimal?

A: Tidak ada limit hard-coded, tapi tergantung memory server. Recommended < 100MB.

### Q: Format JSON lain didukung?

A: Saat ini hanya array of objects. Untuk nested JSON perlu custom parsing.

## Still Having Issues?

1. Check logs di backend dan frontend
2. Verify file structure dengan contoh di [README.md](README.md)
3. Test dengan sample data yang disediakan di `test_data/`
4. Restart kedua backend dan frontend
5. Check GitHub issues untuk known problems

## Getting Help

Jika masih ada masalah:
1. Kumpulkan informasi:
   - Error message lengkap
   - Backend logs
   - Sample file yang error (jika bisa)
   - OS dan environment details

2. Create issue di GitHub dengan informasi di atas
