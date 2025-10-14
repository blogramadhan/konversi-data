# 🚨 Error: "Konversi gagal - Terjadi kesalahan saat konversi"

Jika Anda melihat error ini di aplikasi, ikuti panduan step-by-step ini:

## ⚡ Quick Fix (90% kasus)

### 1. Pastikan Backend Running

Buka terminal baru dan cek:

```bash
curl http://localhost:8000/health
```

**Jika berhasil**, Anda akan melihat:
```json
{"status":"healthy","duckdb_version":"1.4.1","pandas_version":"2.3.3"}
```

**Jika gagal** (error atau connection refused):
```bash
# Backend tidak running! Jalankan:
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Tunggu sampai muncul:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 2. Refresh Browser

- Refresh halaman frontend (F5)
- Coba upload lagi

**Jika masih error, lanjut ke step berikut...**

---

## 🔍 Debug Step-by-Step

### Step 1: Buka Browser Console

1. Buka aplikasi di browser: http://localhost:5173
2. Tekan **F12** (atau Cmd+Option+I di Mac)
3. Pilih tab **"Console"**
4. Pilih tab **"Network"**

### Step 2: Upload File dan Perhatikan Error

Upload file dan lihat:

#### A. Di Tab Console

Cari error message yang dimulai dengan:
- `Error:`
- `Error response:`

**Contoh error yang mungkin muncul:**

**1. Network Error**
```
Error: Network Error
```
➡️ **Solusi**: Backend tidak running. Lihat Quick Fix #1 di atas.

**2. Status 400**
```
Error response: {status: 400, ...}
```
➡️ **Solusi**: File format atau struktur salah. Lihat Step 3.

**3. Status 500**
```
Error response: {status: 500, ...}
```
➡️ **Solusi**: Backend error. Lihat backend logs (Step 4).

#### B. Di Tab Network

1. Cari request ke `/convert`
2. Klik request tersebut
3. Lihat:
   - **Status**: Harus 200 jika berhasil
   - **Response**: Jika error, akan ada message detail

### Step 3: Validasi File Anda

#### Format JSON Harus Array of Objects

✅ **BENAR:**
```json
[
  {
    "nama": "John",
    "umur": 30
  },
  {
    "nama": "Jane",
    "umur": 25
  }
]
```

❌ **SALAH - Bukan Array:**
```json
{
  "nama": "John",
  "umur": 30
}
```

❌ **SALAH - Object dengan nested arrays:**
```json
{
  "data": [
    {"nama": "John"}
  ]
}
```

#### Format CSV Harus Ada Header

✅ **BENAR:**
```csv
nama,umur,kota
John,30,Jakarta
Jane,25,Bandung
```

❌ **SALAH - Tidak ada header:**
```csv
John,30,Jakarta
Jane,25,Bandung
```

❌ **SALAH - Kolom tidak konsisten:**
```csv
nama,umur,kota
John,30
Jane,25,Bandung,Extra
```

### Step 4: Check Backend Logs

Lihat terminal yang menjalankan backend. Anda harus melihat logs seperti:

✅ **Berhasil:**
```
INFO:main:Processing file: myfile.json
INFO:main:File saved to: temp_uploads/myfile.json
INFO:main:Loading JSON file...
INFO:main:Data loaded: 10 rows, 5 columns
INFO:main:Converting to Excel: myfile_converted.xlsx
INFO:main:Conversion successful
```

❌ **Error:**
```
ERROR:main:DuckDB Error: JSON format error
```

Jika ada error di backend:
- Copy error message lengkap
- Periksa struktur file Anda

### Step 5: Test dengan Sample Data

Test dengan file sample yang disediakan:

```bash
# Coba dengan sample.json
# Upload file: test_data/sample.json
```

**Jika sample data BERHASIL:**
➡️ Masalahnya ada di file Anda. Bandingkan struktur file Anda dengan sample.

**Jika sample data GAGAL:**
➡️ Ada masalah di aplikasi. Lanjut ke Step 6.

### Step 6: Restart Semua

```bash
# Terminal 1: Stop backend (Ctrl+C)
# Kill process jika perlu
lsof -ti:8000 | xargs kill -9

# Start backend lagi
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Restart frontend (Ctrl+C)
cd frontend
npm run dev
```

---

## 🎯 Specific Error Messages

### "Tidak dapat terhubung ke server..."

**Cause**: Backend tidak running atau wrong URL

**Solution**:
1. Check backend: `curl http://localhost:8000/health`
2. Start backend jika belum running
3. Verify URL di frontend/src/App.jsx line 24: `const API_URL = 'http://localhost:8000'`

### "(Status: 400)"

**Cause**: Bad request - file format atau struktur salah

**Solution**:
1. Periksa file extension (.json atau .csv)
2. Validate struktur file (lihat Step 3)
3. Coba dengan sample data
4. Check backend logs untuk detail error

### "(Status: 500)"

**Cause**: Server error - backend crash atau unexpected error

**Solution**:
1. Check backend logs (terminal backend)
2. Copy error message lengkap
3. Restart backend
4. Check file size (mungkin terlalu besar)

### "Failed to fetch"

**Cause**: CORS atau network issue

**Solution**:
1. Restart backend dan frontend
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try different browser
4. Check firewall/antivirus

---

## 🧪 Test Manual dengan cURL

Untuk isolate masalah, test langsung dengan cURL:

```bash
# Test JSON
curl -X POST http://localhost:8000/convert \
  -F "file=@test_data/sample.json" \
  -F "sheet_name=Test" \
  -o test_output.xlsx

# Check hasil
ls -lh test_output.xlsx
# Expected: ~5KB file

# Buka di Excel untuk verify
```

**Jika cURL BERHASIL tapi frontend GAGAL:**
➡️ Masalah di frontend. Check browser console dan network tab.

**Jika cURL GAGAL:**
➡️ Masalah di backend. Check backend logs dan file structure.

---

## 📋 Complete Checklist

Pastikan semua ini sudah dilakukan:

- [ ] Backend running di port 8000
- [ ] Frontend running di port 5173
- [ ] File format adalah .json atau .csv
- [ ] File structure valid (array of objects untuk JSON, header untuk CSV)
- [ ] Browser console tidak ada CORS error
- [ ] Backend logs tidak menunjukkan error
- [ ] Test dengan sample data berhasil
- [ ] Tried restart backend dan frontend
- [ ] Tried different browser

---

## 🆘 Still Not Working?

Jika sudah mengikuti semua step dan masih error:

### 1. Gather Information

Kumpulkan info berikut:

```bash
# Backend info
curl http://localhost:8000/health

# Backend version
cd backend && uv run python -c "import duckdb, pandas; print(f'DuckDB: {duckdb.__version__}, Pandas: {pandas.__version__}')"

# Frontend info
cd frontend && npm list react axios @chakra-ui/react
```

### 2. Create Minimal Test Case

Buat file test minimal:

**test.json:**
```json
[
  {"name": "Test", "value": 1}
]
```

Upload file ini. Jika ini juga gagal, ada masalah fundamental.

### 3. Check Documentation

- [QUICK_START.md](QUICK_START.md) - Setup guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [DEBUG_CHECKLIST.md](DEBUG_CHECKLIST.md) - Detailed debugging

### 4. Check Logs Lengkap

**Backend logs** (terminal backend):
- Copy semua output dari saat upload
- Termasuk error stack trace jika ada

**Browser console** (F12):
- Tab Console: Copy semua error messages
- Tab Network: Screenshot request /convert

---

## 💡 Common Causes & Quick Fixes

| Symptom | Cause | Quick Fix |
|---------|-------|-----------|
| "Tidak dapat terhubung ke server" | Backend not running | `cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000` |
| Error langsung setelah pilih file | Client-side validation | Check file extension (.json atau .csv) |
| Error saat klik "Konversi" | Backend error | Check backend logs |
| Loading stuck | Request timeout | Check file size, restart backend |
| File tidak download | Browser issue | Check browser downloads, try different browser |

---

## ✅ Success Indicators

Ketika berhasil, Anda akan melihat:

**Frontend:**
- Toast notification hijau: "Konversi berhasil!"
- File Excel otomatis terdownload

**Backend logs:**
```
INFO:main:Processing file: yourfile.json
INFO:main:Data loaded: X rows, Y columns
INFO:main:Converting to Excel: yourfile_converted.xlsx
INFO:main:Conversion successful
```

**Browser Network:**
- Status: 200 OK
- Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

---

**Masih ada masalah? Create issue di GitHub dengan:**
1. Error message lengkap dari browser console
2. Backend logs
3. Sample file yang error (jika bisa dibagikan)
4. OS dan browser version

Good luck! 🚀
