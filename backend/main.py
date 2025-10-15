from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import duckdb
import json
import tempfile
import os
import logging
from pathlib import Path

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


@app.get("/")
async def root():
    return {
        "message": "Konversi Data API",
        "version": "1.0.0",
        "endpoints": {
            "convert": "/convert - POST - Upload JSON/CSV dan konversi ke Excel"
        }
    }


@app.post("/convert")
async def convert_to_excel(file: UploadFile = File(...)):
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

        # Generate output filename
        output_filename = f"{Path(file.filename).stem}_converted.xlsx"
        output_path = OUTPUT_DIR / output_filename

        # Proses dengan DuckDB - konversi langsung ke Excel
        conn = duckdb.connect(':memory:')

        try:
            # Install dan load spatial extension untuk GDAL (mendukung Excel)
            logger.info("Installing DuckDB spatial extension...")
            conn.execute("INSTALL spatial;")
            conn.execute("LOAD spatial;")

            if file_ext == 'json':
                # Load JSON dan konversi ke Excel dengan DuckDB
                logger.info("Loading JSON file and converting to Excel...")
                conn.execute(f"""
                    COPY (SELECT * FROM read_json_auto('{upload_path}'))
                    TO '{output_path}' (FORMAT GDAL, DRIVER 'XLSX');
                """)
            else:  # csv
                # Load CSV dan konversi ke Excel dengan DuckDB
                logger.info("Loading CSV file and converting to Excel...")
                conn.execute(f"""
                    COPY (SELECT * FROM read_csv_auto('{upload_path}'))
                    TO '{output_path}' (FORMAT GDAL, DRIVER 'XLSX');
                """)

            # Validasi bahwa file output telah dibuat
            if not output_path.exists():
                raise HTTPException(status_code=500, detail="File Excel gagal dibuat")

            logger.info("Conversion successful")
        finally:
            conn.close()

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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "duckdb_version": duckdb.__version__
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
