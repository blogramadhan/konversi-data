from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import duckdb
import pandas as pd
import json
import tempfile
import os
import logging
from pathlib import Path
from typing import Optional
import requests

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Konversi Data API", version="1.0.0")

# CORS middleware untuk frontend
# Untuk production dengan Docker, izinkan akses dari frontend container dan localhost
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3030,http://konversi-data-frontend:3030"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory untuk temporary files
UPLOAD_DIR = Path("temp_uploads")
OUTPUT_DIR = Path("temp_outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


# Pydantic model untuk request URL
class ConvertURLRequest(BaseModel):
    url: str
    sheet_name: Optional[str] = "Data"


@app.get("/")
async def root():
    return {
        "message": "Konversi Data API",
        "version": "1.0.0",
        "endpoints": {
            "convert": "/convert - POST - Upload JSON/CSV dan konversi ke Excel",
            "convert-url": "/convert-url - POST - Konversi dari URL JSON/CSV ke Excel"
        }
    }


@app.post("/convert")
async def convert_to_excel(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = "Data"
):
    """
    Endpoint untuk konversi file JSON atau CSV ke Excel
    """
    upload_path = None
    output_path = None

    try:
        # Validasi file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nama file tidak valid")

        logger.info(f"Processing file: {file.filename}")

        file_ext = file.filename.lower().split('.')[-1]
        if file_ext not in ['json', 'csv']:
            raise HTTPException(
                status_code=400,
                detail="Format file tidak didukung. Gunakan .json atau .csv"
            )

        # Simpan file upload
        upload_path = UPLOAD_DIR / file.filename
        content = await file.read()

        if not content:
            raise HTTPException(status_code=400, detail="File kosong")

        with open(upload_path, "wb") as buffer:
            buffer.write(content)

        logger.info(f"File saved to: {upload_path}")

        # Proses dengan DuckDB
        conn = duckdb.connect(':memory:')

        try:
            if file_ext == 'json':
                # Load JSON dengan DuckDB
                logger.info("Loading JSON file...")
                df = conn.execute(f"""
                    SELECT * FROM read_json_auto('{upload_path}')
                """).fetchdf()
            else:  # csv
                # Load CSV dengan DuckDB
                logger.info("Loading CSV file...")
                df = conn.execute(f"""
                    SELECT * FROM read_csv_auto('{upload_path}')
                """).fetchdf()
        finally:
            conn.close()

        logger.info(f"Data loaded: {len(df)} rows, {len(df.columns)} columns")

        # Validasi data
        if df.empty:
            raise HTTPException(status_code=400, detail="File tidak mengandung data")

        # Generate output filename
        output_filename = f"{Path(file.filename).stem}_converted.xlsx"
        output_path = OUTPUT_DIR / output_filename

        # Konversi ke Excel menggunakan pandas
        logger.info(f"Converting to Excel: {output_filename}")
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)

        logger.info("Conversion successful")

        # Return file Excel
        return FileResponse(
            path=output_path,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}"
            },
            background=None  # Jangan hapus file otomatis
        )

    except duckdb.Error as e:
        logger.error(f"DuckDB Error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error processing file dengan DuckDB: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )
    finally:
        # Cleanup upload file
        if upload_path and upload_path.exists():
            try:
                os.remove(upload_path)
                logger.info("Cleanup upload file successful")
            except Exception as e:
                logger.warning(f"Failed to cleanup upload file: {e}")


@app.post("/convert-url")
async def convert_url_to_excel(request: ConvertURLRequest):
    """
    Endpoint untuk konversi file JSON atau CSV dari URL ke Excel
    """
    download_path = None
    output_path = None

    try:
        logger.info(f"Processing URL: {request.url}")

        # Download file from URL first
        logger.info(f"Downloading file from URL...")

        # Prepare headers to avoid 403 Forbidden errors
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/csv, text/plain, */*',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': request.url.rsplit('/', 1)[0] + '/',
        }

        try:
            # Create a session for better cookie/redirect handling
            session = requests.Session()
            session.headers.update(headers)

            response = session.get(
                request.url,
                timeout=60,  # Increased timeout for large files
                allow_redirects=True,
                verify=True,  # Verify SSL certificates
                stream=True  # Stream large files
            )

            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response content-type: {response.headers.get('content-type', 'unknown')}")
            logger.info(f"Response content-length: {response.headers.get('content-length', 'unknown')} bytes")

            response.raise_for_status()
        except requests.HTTPError as e:
            logger.error(f"HTTP Error {e.response.status_code}: {str(e)}")

            # Provide more specific error messages
            if e.response.status_code == 403:
                raise HTTPException(
                    status_code=400,
                    detail=f"Akses ditolak (403 Forbidden). Server memblokir request. Pastikan URL dapat diakses secara publik."
                )
            elif e.response.status_code == 404:
                raise HTTPException(
                    status_code=400,
                    detail=f"URL tidak ditemukan (404 Not Found). Periksa kembali URL yang dimasukkan."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Gagal mengunduh file dari URL: HTTP {e.response.status_code} - {str(e)}"
                )
        except requests.RequestException as e:
            logger.error(f"Request failed: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Gagal mengunduh file dari URL: {str(e)}"
            )

        if not response.content:
            raise HTTPException(status_code=400, detail="File dari URL kosong")

        # Detect file type with multiple fallback methods
        file_ext = None

        # Method 1: Check URL extension
        url_lower = request.url.lower()
        # Remove query parameters for better detection
        url_path = url_lower.split('?')[0]

        if url_path.endswith('.json'):
            file_ext = 'json'
            logger.info("Detected format from URL extension: JSON")
        elif url_path.endswith('.csv'):
            file_ext = 'csv'
            logger.info("Detected format from URL extension: CSV")

        # Method 2: Check Content-Type header
        if not file_ext:
            content_type = response.headers.get('content-type', '').lower()
            logger.info(f"Content-Type header: {content_type}")

            if 'json' in content_type or 'application/json' in content_type:
                file_ext = 'json'
                logger.info("Detected format from Content-Type: JSON")
            elif 'csv' in content_type or 'text/csv' in content_type:
                file_ext = 'csv'
                logger.info("Detected format from Content-Type: CSV")

        # Method 3: Try to detect from content itself
        if not file_ext:
            try:
                # Try to decode first few bytes
                sample = response.content[:1000].decode('utf-8', errors='ignore').strip()
                logger.info(f"Checking content sample (first 100 chars): {sample[:100]}")

                # Check if it looks like JSON
                if sample.startswith('{') or sample.startswith('['):
                    try:
                        json.loads(sample if len(sample) < 1000 else response.content.decode('utf-8'))
                        file_ext = 'json'
                        logger.info("Detected format from content analysis: JSON")
                    except:
                        pass

                # Check if it looks like CSV (has commas and no JSON markers)
                if not file_ext and ',' in sample and not sample.startswith(('{', '[')):
                    file_ext = 'csv'
                    logger.info("Detected format from content analysis: CSV")
            except Exception as e:
                logger.warning(f"Content analysis failed: {e}")

        # If still no format detected, raise error
        if not file_ext:
            raise HTTPException(
                status_code=400,
                detail="Tidak dapat mendeteksi format file. Pastikan URL mengarah ke file .json atau .csv yang valid"
            )

        # Save downloaded file
        filename = f"downloaded_{os.urandom(8).hex()}.{file_ext}"
        download_path = UPLOAD_DIR / filename

        with open(download_path, "wb") as buffer:
            buffer.write(response.content)

        logger.info(f"File downloaded and saved to: {download_path}")

        # Process with DuckDB
        conn = duckdb.connect(':memory:')

        try:
            if file_ext == 'json':
                # Load JSON dengan DuckDB
                logger.info("Loading JSON file...")
                df = conn.execute(f"""
                    SELECT * FROM read_json_auto('{download_path}')
                """).fetchdf()
            else:  # csv
                # Load CSV dengan DuckDB
                logger.info("Loading CSV file...")
                df = conn.execute(f"""
                    SELECT * FROM read_csv_auto('{download_path}')
                """).fetchdf()
        finally:
            conn.close()

        logger.info(f"Data loaded: {len(df)} rows, {len(df.columns)} columns")

        # Validasi data
        if df.empty:
            raise HTTPException(status_code=400, detail="File tidak mengandung data")

        # Generate output filename
        output_filename = f"url_converted_{os.urandom(8).hex()}.xlsx"
        output_path = OUTPUT_DIR / output_filename

        # Konversi ke Excel menggunakan pandas
        logger.info(f"Converting to Excel: {output_filename}")
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=request.sheet_name, index=False)

        logger.info("Conversion successful")

        # Return file Excel
        return FileResponse(
            path=output_path,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}"
            },
            background=None  # Jangan hapus file otomatis
        )

    except duckdb.Error as e:
        logger.error(f"DuckDB Error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error processing file dengan DuckDB: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )
    finally:
        # Cleanup downloaded file
        if download_path and download_path.exists():
            try:
                os.remove(download_path)
                logger.info("Cleanup downloaded file successful")
            except Exception as e:
                logger.warning(f"Failed to cleanup downloaded file: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "duckdb_version": duckdb.__version__,
        "pandas_version": pd.__version__
    }


@app.post("/cleanup")
async def cleanup_output_files():
    """Cleanup temporary output files"""
    try:
        deleted = 0
        for file in OUTPUT_DIR.glob("*.xlsx"):
            try:
                os.remove(file)
                deleted += 1
            except Exception as e:
                logger.warning(f"Failed to delete {file}: {e}")

        return {"status": "success", "files_deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
