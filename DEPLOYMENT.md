# Deployment Guide - Konversi Data

## Masalah: Error 413 Request Entity Too Large

Jika Anda mendapatkan error "413 Request Entity Too Large" saat upload file besar, ini berarti ada batasan ukuran request di server production.

### Solusi berdasarkan setup server:

---

## 1. Jika menggunakan Nginx sebagai Reverse Proxy

Tambahkan konfigurasi berikut di file nginx config (biasanya di `/etc/nginx/nginx.conf` atau `/etc/nginx/sites-available/default`):

```nginx
http {
    # Set maximum upload size to 500MB
    client_max_body_size 500M;

    # Timeouts for large file uploads
    client_body_timeout 300s;
    client_header_timeout 300s;

    server {
        listen 80;

        location / {
            proxy_pass http://localhost:3030;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api/ {
            # Remove /api prefix and forward to backend
            rewrite ^/api/(.*)$ /$1 break;
            proxy_pass http://localhost:8000;

            # Increase timeouts for large uploads
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;

            # For large file uploads
            client_max_body_size 500M;
        }
    }
}
```

Lalu restart Nginx:
```bash
sudo nginx -t  # Test konfigurasi
sudo systemctl restart nginx
```

---

## 2. Jika menggunakan Apache sebagai Reverse Proxy

Tambahkan di `.htaccess` atau VirtualHost config:

```apache
# Increase upload limit to 500MB
LimitRequestBody 524288000

<VirtualHost *:80>
    # Frontend
    ProxyPass / http://localhost:3030/
    ProxyPassReverse / http://localhost:3030/

    # Backend API
    ProxyPass /api/ http://localhost:8000/
    ProxyPassReverse /api/ http://localhost:8000/

    # Timeouts
    ProxyTimeout 300
</VirtualHost>
```

Restart Apache:
```bash
sudo systemctl restart apache2
```

---

## 3. Jika menggunakan Caddy

Tambahkan di `Caddyfile`:

```caddy
yourdomain.com {
    # Frontend
    reverse_proxy localhost:3030

    # Backend API
    handle /api/* {
        uri strip_prefix /api
        reverse_proxy localhost:8000
    }

    # Request size limit (500MB)
    request_body {
        max_size 500MB
    }
}
```

Restart Caddy:
```bash
sudo systemctl restart caddy
```

---

## 4. Jika Deploy langsung tanpa Reverse Proxy

Aplikasi sudah dikonfigurasi untuk handle file sampai **500MB**.

Pastikan:
1. Re-build Docker images:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. Cek logs jika masih error:
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

---

## 5. Jika menggunakan Cloud Provider (Cloudflare, etc)

### Cloudflare
- Free plan: maksimal 100MB
- Paid plan: bisa sampai 500MB
- Solusi: Bypass Cloudflare untuk endpoint `/convert` atau upgrade plan

### AWS CloudFront / Load Balancer
Tambahkan di CloudFront atau ALB settings:
- Request Body Size: 500MB
- Timeout: 300 seconds

### Google Cloud Load Balancer
Tambahkan di backend service:
```bash
gcloud compute backend-services update BACKEND_SERVICE \
  --timeout=300s \
  --request-timeout=300s
```

---

## Testing Upload Besar

Test dengan curl:
```bash
# Generate file JSON besar (contoh 50MB)
python3 << 'EOF'
import json
data = [{"id": i, "name": f"Item {i}", "data": "x" * 1000} for i in range(50000)]
with open("test_large.json", "w") as f:
    json.dump(data, f)
EOF

# Upload ke server
curl -v -F "file=@test_large.json" http://your-server:8000/convert -o output.xlsx
```

---

## Rekomendasi

1. **Untuk file < 10MB**: Setup default sudah cukup
2. **Untuk file 10-100MB**: Gunakan konfigurasi di atas
3. **Untuk file > 100MB**:
   - Pertimbangkan untuk implementasi chunked upload
   - Atau gunakan cloud storage (S3, GCS) dengan signed URL
   - Atau proses async dengan queue system

---

## Monitoring

Cek resource usage saat proses file besar:
```bash
# CPU & Memory
docker stats

# Logs
docker-compose logs -f --tail=100
```

---

## Troubleshooting

### Error masih muncul setelah config?

1. **Restart semua services**:
   ```bash
   docker-compose restart
   # atau jika ada reverse proxy
   sudo systemctl restart nginx  # atau apache2/caddy
   ```

2. **Check aktual error source**:
   - Browser DevTools → Network tab → lihat response headers
   - Cek apakah error dari Nginx, Docker, atau Backend

3. **Temporary bypass untuk testing**:
   - Akses langsung ke backend: `http://server-ip:8000/convert`
   - Jika sukses = masalah di reverse proxy/frontend
   - Jika gagal = masalah di backend config

---

## Environment Variables

Untuk mengubah limit, edit `.env` atau docker-compose.yml:

```env
# Maximum upload size in MB (default: 500)
MAX_UPLOAD_SIZE_MB=500

# Timeout in seconds (default: 300)
UPLOAD_TIMEOUT_SECONDS=300
```

Lalu rebuild:
```bash
docker-compose up -d --build
```
