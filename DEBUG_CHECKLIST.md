# Debug Checklist

Jika mengalami error "Konversi gagal - Terjadi kesalahan saat konversi", ikuti checklist ini:

## 1. Backend Status ✓

Pastikan backend berjalan dengan baik:

```bash
# Check health
curl http://localhost:8000/health

# Expected output:
# {"status":"healthy","duckdb_version":"1.4.1","pandas_version":"2.3.3"}
```

✅ **Backend sudah berjalan dengan baik** berdasarkan test terakhir

## 2. Frontend Connection

Periksa koneksi frontend ke backend:

### A. Check Browser Console (F12)

Buka Developer Tools (F12) di browser dan periksa:

1. **Console Tab** - Cari error messages
2. **Network Tab** - Periksa request ke `/convert`
   - Status code harus 200
   - Response type harus `blob`
   - Check Headers untuk CORS

### B. Common Frontend Issues

**Issue 1: API URL salah**

Lokasi: [frontend/src/App.jsx](frontend/src/App.jsx:18)

```javascript
const API_URL = 'http://localhost:8000'  // Pastikan ini benar!
```

**Issue 2: CORS Blocked**

Symptoms:
- Error di console: "CORS policy"
- Network tab menunjukkan request failed

Solution:
- Pastikan backend sudah running
- Check CORS config di [backend/main.py](backend/main.py:20-27)
- Origin frontend harus ada di `allow_origins`

**Issue 3: Axios Configuration**

Periksa di [frontend/src/App.jsx](frontend/src/App.jsx:56-62):

```javascript
const response = await axios.post(`${API_URL}/convert`, formData, {
  responseType: 'blob',  // PENTING!
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})
```

## 3. Test Langsung dengan cURL

Untuk memastikan backend OK:

```bash
# Test JSON
curl -X POST http://localhost:8000/convert \
  -F "file=@test_data/sample.json" \
  -F "sheet_name=Test" \
  -o test.xlsx

# Cek hasil
ls -lh test.xlsx
# Expected: file dengan size ~5KB
```

Jika ini berhasil, masalahnya ada di frontend.

## 4. Frontend Debugging Steps

### Step 1: Buka Browser Console

1. Buka http://localhost:5173
2. Tekan F12
3. Pilih tab "Console"
4. Pilih tab "Network"

### Step 2: Upload File

1. Pilih file test_data/sample.json
2. Klik "Konversi ke Excel"
3. Perhatikan:
   - Console: Ada error apa?
   - Network: Request ke /convert berhasil?

### Step 3: Analyze Error

**Error di Console?**
- Copy error message lengkap
- Check line number yang error

**Network Request Failed?**
- Check Status Code
- Check Response tab
- Check Headers tab (CORS?)

**Request Success tapi File Tidak Download?**
- Check responseType di axios
- Check blob handling di code

## 5. Common Error Messages & Solutions

### "Network Error"
**Cause**: Frontend tidak bisa connect ke backend

**Solutions**:
1. Pastikan backend running: `curl http://localhost:8000/health`
2. Check firewall/antivirus
3. Try different browser

### "Request failed with status code 400"
**Cause**: Backend reject file

**Solutions**:
1. Check file format (.json atau .csv)
2. Check file structure
3. Check backend logs untuk detail error

### "Request failed with status code 500"
**Cause**: Backend internal error

**Solutions**:
1. Check backend logs (terminal yang run backend)
2. Lihat error message detail
3. Coba file yang lebih simple

### "TypeError: Failed to fetch"
**Cause**: CORS atau network issue

**Solutions**:
1. Check CORS di backend
2. Make sure backend URL correct
3. Check browser security settings

## 6. Enable Detailed Logging

### Backend Logs

Already enabled! Check terminal yang running backend untuk logs seperti:

```
INFO:main:Processing file: sample.json
INFO:main:File saved to: temp_uploads/sample.json
INFO:main:Loading JSON file...
INFO:main:Data loaded: 5 rows, 4 columns
INFO:main:Converting to Excel: sample_converted.xlsx
INFO:main:Conversion successful
```

### Frontend Logs

Tambahkan di [frontend/src/App.jsx](frontend/src/App.jsx):

```javascript
const handleSubmit = async (event) => {
  event.preventDefault()

  console.log('Starting conversion...', file)  // ADD THIS

  try {
    const response = await axios.post(...)
    console.log('Response:', response)  // ADD THIS

    // Download logic...
  } catch (error) {
    console.error('Full error:', error)  // ADD THIS
    console.error('Error response:', error.response)  // ADD THIS
  }
}
```

## 7. Quick Test Script

Buat file `test_frontend.html` untuk isolated test:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Upload</title>
</head>
<body>
  <input type="file" id="fileInput">
  <button onclick="upload()">Upload</button>

  <script>
    async function upload() {
      const fileInput = document.getElementById('fileInput')
      const file = fileInput.files[0]

      const formData = new FormData()
      formData.append('file', file)
      formData.append('sheet_name', 'Test')

      try {
        const response = await fetch('http://localhost:8000/convert', {
          method: 'POST',
          body: formData
        })

        console.log('Status:', response.status)

        if (response.ok) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'test.xlsx'
          a.click()
          alert('Success!')
        } else {
          const text = await response.text()
          alert('Error: ' + text)
        }
      } catch (e) {
        alert('Error: ' + e.message)
        console.error(e)
      }
    }
  </script>
</body>
</html>
```

Test dengan:
1. Buka file ini di browser
2. Upload test_data/sample.json
3. Jika ini berhasil, masalah ada di React frontend

## 8. Next Steps

Jika masih error setelah semua checklist:

1. **Capture Information**:
   - Screenshot error di browser console
   - Copy full error message
   - Backend logs dari terminal
   - Network tab screenshot

2. **Test dengan Different File**:
   - Try sample.csv instead
   - Try smaller JSON file
   - Try different browser

3. **Restart Everything**:
   ```bash
   # Kill backend
   lsof -ti:8000 | xargs kill -9

   # Restart backend
   cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

   # Restart frontend (Ctrl+C dan npm run dev lagi)
   ```

4. **Check Dependencies**:
   ```bash
   # Backend
   uv pip list | grep -E "(fastapi|duckdb|pandas)"

   # Frontend
   cd frontend && npm list react axios @chakra-ui/react
   ```

## Summary

✅ Backend: **WORKING** (tested with curl)
❓ Frontend: **NEED TO CHECK**

Most likely issue: Frontend configuration atau browser issue.

Follow steps 4-6 above to debug frontend!
