use actix_web::{web, HttpResponse};
use actix_multipart::Multipart;
use futures_util::StreamExt;
use std::fs;
use std::path::{Path, PathBuf};
use log::{info, error, warn};
use uuid::Uuid;

use crate::database::Database;
use crate::models::*;
use crate::utils::*;

const UPLOAD_DIR: &str = "temp_uploads";
const OUTPUT_DIR: &str = "temp_outputs";

// Root endpoint
pub async fn index() -> HttpResponse {
    let info = ApiInfo {
        message: "Konversi Data API".to_string(),
        version: "1.0.0".to_string(),
        endpoints: EndpointInfo {
            convert: "/convert - POST - Upload JSON/CSV dan konversi ke Excel".to_string(),
            convert_url: "/convert-url - POST - Konversi dari URL JSON/CSV ke Excel".to_string(),
        },
    };

    HttpResponse::Ok().json(info)
}

// Health check endpoint
pub async fn health_check() -> HttpResponse {
    let response = HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    };

    HttpResponse::Ok().json(response)
}

// Convert file endpoint
pub async fn convert_file(
    mut payload: Multipart,
    db: web::Data<Database>,
) -> HttpResponse {
    let mut upload_path: Option<PathBuf> = None;
    let mut output_path: Option<PathBuf> = None;
    let mut sheet_name = "Data".to_string();

    // Ensure directories exist
    if let Err(e) = ensure_dir(Path::new(UPLOAD_DIR)) {
        error!("Failed to create upload directory: {}", e);
        return create_error_response(
            actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to initialize upload directory"
        );
    }

    if let Err(e) = ensure_dir(Path::new(OUTPUT_DIR)) {
        error!("Failed to create output directory: {}", e);
        return create_error_response(
            actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to initialize output directory"
        );
    }

    // Process multipart data
    let mut file_data: Option<Vec<u8>> = None;
    let mut original_filename: Option<String> = None;

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(field) => field,
            Err(e) => {
                error!("Failed to read multipart field: {}", e);
                return create_error_response(
                    actix_web::http::StatusCode::BAD_REQUEST,
                    "Failed to read upload data"
                );
            }
        };

        let content_disposition = field.content_disposition();
        let field_name = if let Some(cd) = content_disposition {
            cd.get_name().unwrap_or("")
        } else {
            ""
        };

        if field_name == "file" {
            original_filename = content_disposition
                .and_then(|cd| cd.get_filename().map(|s| s.to_string()));

            let mut bytes = Vec::new();
            while let Some(chunk) = field.next().await {
                let chunk = match chunk {
                    Ok(chunk) => chunk,
                    Err(e) => {
                        error!("Failed to read file chunk: {}", e);
                        return create_error_response(
                            actix_web::http::StatusCode::BAD_REQUEST,
                            "Failed to read file data"
                        );
                    }
                };
                bytes.extend_from_slice(&chunk);
            }
            file_data = Some(bytes);
        } else if field_name == "sheet_name" {
            let mut bytes = Vec::new();
            while let Some(chunk) = field.next().await {
                if let Ok(chunk) = chunk {
                    bytes.extend_from_slice(&chunk);
                }
            }
            if let Ok(name) = String::from_utf8(bytes) {
                sheet_name = name;
            }
        }
    }

    // Validate we have file data
    let file_data = match file_data {
        Some(data) if !data.is_empty() => data,
        _ => {
            return create_error_response(
                actix_web::http::StatusCode::BAD_REQUEST,
                "No file uploaded or file is empty"
            );
        }
    };

    let filename = original_filename.unwrap_or_else(|| "uploaded_file".to_string());
    info!("Processing file: {}", filename);

    // Validate file extension
    let file_ext = filename.split('.').last()
        .unwrap_or("")
        .to_lowercase();

    if file_ext != "json" && file_ext != "csv" {
        return create_error_response(
            actix_web::http::StatusCode::BAD_REQUEST,
            "Format file tidak didukung. Gunakan .json atau .csv"
        );
    }

    // Save uploaded file
    let upload_filename = format!("{}_{}.{}",
        filename.split('.').next().unwrap_or("file"),
        Uuid::new_v4().simple(),
        file_ext
    );
    upload_path = Some(PathBuf::from(UPLOAD_DIR).join(&upload_filename));

    if let Err(e) = fs::write(upload_path.as_ref().unwrap(), &file_data) {
        error!("Failed to save uploaded file: {}", e);
        return create_error_response(
            actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to save uploaded file"
        );
    }

    info!("File saved to: {:?}", upload_path);

    // Generate output filename
    let output_filename = format!("{}_converted.xlsx",
        filename.split('.').next().unwrap_or("file")
    );
    output_path = Some(PathBuf::from(OUTPUT_DIR).join(&output_filename));

    // Convert to Excel
    let result = if file_ext == "json" {
        process_json_to_excel(
            upload_path.as_ref().unwrap(),
            output_path.as_ref().unwrap(),
            &sheet_name,
        )
    } else {
        process_csv_to_excel(
            upload_path.as_ref().unwrap(),
            output_path.as_ref().unwrap(),
            &sheet_name,
        )
    };

    // Cleanup upload file
    if let Some(path) = &upload_path {
        if path.exists() {
            if let Err(e) = fs::remove_file(path) {
                warn!("Failed to cleanup upload file: {}", e);
            } else {
                info!("Cleanup upload file successful");
            }
        }
    }

    match result {
        Ok(_) => {
            info!("Conversion successful");

            // Increment counter
            if let Err(e) = db.increment_counter("file_upload", &file_ext) {
                error!("Failed to increment counter: {}", e);
            }

            // Return Excel file
            match std::fs::read(output_path.as_ref().unwrap()) {
                Ok(file_content) => {
                    HttpResponse::Ok()
                        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .insert_header((
                            actix_web::http::header::CONTENT_DISPOSITION,
                            format!("attachment; filename=\"{}\"", output_filename)
                        ))
                        .body(file_content)
                }
                Err(e) => {
                    error!("Failed to read output file: {}", e);
                    create_error_response(
                        actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                        "Failed to read converted file"
                    )
                }
            }
        }
        Err(e) => {
            error!("Conversion failed: {}", e);
            create_error_response(
                actix_web::http::StatusCode::BAD_REQUEST,
                &format!("Error processing file: {}", e)
            )
        }
    }
}

// Convert URL endpoint
pub async fn convert_url(
    request: web::Json<ConvertURLRequest>,
    db: web::Data<Database>,
) -> HttpResponse {
    let mut download_path: Option<PathBuf> = None;
    let mut output_path: Option<PathBuf> = None;

    info!("Processing URL: {}", request.url);

    // Ensure directories exist
    if let Err(e) = ensure_dir(Path::new(UPLOAD_DIR)) {
        error!("Failed to create upload directory: {}", e);
        return create_error_response(
            actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to initialize upload directory"
        );
    }

    if let Err(e) = ensure_dir(Path::new(OUTPUT_DIR)) {
        error!("Failed to create output directory: {}", e);
        return create_error_response(
            actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to initialize output directory"
        );
    }

    // Download file from URL
    info!("Downloading file from URL...");

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .unwrap();

    let response = match client.get(&request.url).send().await {
        Ok(resp) => resp,
        Err(e) => {
            error!("Failed to download from URL: {}", e);
            return create_error_response(
                actix_web::http::StatusCode::BAD_REQUEST,
                &format!("Gagal mengunduh file dari URL: {}", e)
            );
        }
    };

    let status = response.status();
    info!("Response status: {}", status);

    if !status.is_success() {
        let error_msg = match status.as_u16() {
            403 => "Akses ditolak (403 Forbidden). Server memblokir request.",
            404 => "URL tidak ditemukan (404 Not Found).",
            _ => "Gagal mengunduh file dari URL",
        };
        return create_error_response(
            actix_web::http::StatusCode::BAD_REQUEST,
            error_msg
        );
    }

    let content_type = response.headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    info!("Content-Type: {}", content_type);

    let content = match response.bytes().await {
        Ok(bytes) => bytes.to_vec(),
        Err(e) => {
            error!("Failed to read response body: {}", e);
            return create_error_response(
                actix_web::http::StatusCode::BAD_REQUEST,
                "Failed to read file content from URL"
            );
        }
    };

    if content.is_empty() {
        return create_error_response(
            actix_web::http::StatusCode::BAD_REQUEST,
            "File dari URL kosong"
        );
    }

    // Detect file format
    let file_ext = detect_format_from_url(&request.url)
        .or_else(|| detect_format_from_content_type(&content_type))
        .or_else(|| detect_format_from_content(&content));

    let file_ext = match file_ext {
        Some(FileFormat::Json) => {
            info!("Detected format: JSON");
            "json"
        }
        Some(FileFormat::Csv) => {
            info!("Detected format: CSV");
            "csv"
        }
        None => {
            return create_error_response(
                actix_web::http::StatusCode::BAD_REQUEST,
                "Tidak dapat mendeteksi format file. Pastikan URL mengarah ke file .json atau .csv yang valid"
            );
        }
    };

    // Save downloaded file
    let filename = format!("downloaded_{}.{}", Uuid::new_v4().simple(), file_ext);
    download_path = Some(PathBuf::from(UPLOAD_DIR).join(&filename));

    if let Err(e) = fs::write(download_path.as_ref().unwrap(), &content) {
        error!("Failed to save downloaded file: {}", e);
        return create_error_response(
            actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to save downloaded file"
        );
    }

    info!("File downloaded and saved to: {:?}", download_path);

    // Generate output filename
    let output_filename = format!("url_converted_{}.xlsx", Uuid::new_v4().simple());
    output_path = Some(PathBuf::from(OUTPUT_DIR).join(&output_filename));

    // Convert to Excel
    let result = if file_ext == "json" {
        process_json_to_excel(
            download_path.as_ref().unwrap(),
            output_path.as_ref().unwrap(),
            &request.sheet_name,
        )
    } else {
        process_csv_to_excel(
            download_path.as_ref().unwrap(),
            output_path.as_ref().unwrap(),
            &request.sheet_name,
        )
    };

    // Cleanup downloaded file
    if let Some(path) = &download_path {
        if path.exists() {
            if let Err(e) = fs::remove_file(path) {
                warn!("Failed to cleanup downloaded file: {}", e);
            } else {
                info!("Cleanup downloaded file successful");
            }
        }
    }

    match result {
        Ok(_) => {
            info!("Conversion successful");

            // Increment counter
            if let Err(e) = db.increment_counter("url_conversion", file_ext) {
                error!("Failed to increment counter: {}", e);
            }

            // Return Excel file
            match std::fs::read(output_path.as_ref().unwrap()) {
                Ok(file_content) => {
                    HttpResponse::Ok()
                        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .insert_header((
                            actix_web::http::header::CONTENT_DISPOSITION,
                            format!("attachment; filename=\"{}\"", output_filename)
                        ))
                        .body(file_content)
                }
                Err(e) => {
                    error!("Failed to read output file: {}", e);
                    create_error_response(
                        actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                        "Failed to read converted file"
                    )
                }
            }
        }
        Err(e) => {
            error!("Conversion failed: {}", e);
            create_error_response(
                actix_web::http::StatusCode::BAD_REQUEST,
                &format!("Error processing file: {}", e)
            )
        }
    }
}

// Get statistics
pub async fn get_stats(db: web::Data<Database>) -> HttpResponse {
    match get_stats_internal(&db).await {
        Ok(stats) => HttpResponse::Ok().json(stats),
        Err(e) => {
            error!("Failed to get stats: {}", e);
            create_error_response(
                actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                &format!("Failed to get statistics: {}", e)
            )
        }
    }
}

async fn get_stats_internal(db: &Database) -> Result<StatsResponse, String> {
    let total_conversions = db.get_total_conversions()
        .map_err(|e| e.to_string())?;

    let (file_upload, url_conversion) = db.get_conversions_by_type()
        .map_err(|e| e.to_string())?;

    let (json_count, csv_count) = db.get_conversions_by_format()
        .map_err(|e| e.to_string())?;

    let (today_total, today_file, today_url) = db.get_today_stats()
        .map_err(|e| e.to_string())?;

    let weekly_raw = db.get_last_7_days_stats()
        .map_err(|e| e.to_string())?;

    let weekly_stats: Vec<DailyStats> = weekly_raw
        .into_iter()
        .map(|(date, total, file_upload, url_conversion)| DailyStats {
            date,
            total,
            file_upload,
            url_conversion,
        })
        .collect();

    Ok(StatsResponse {
        total_conversions,
        by_type: ConversionTypeStats {
            file_upload,
            url_conversion,
        },
        by_format: FormatStats {
            json: json_count,
            csv: csv_count,
        },
        today: TodayStats {
            total: today_total,
            file_upload: today_file,
            url_conversion: today_url,
        },
        last_7_days: weekly_stats,
    })
}

// Cleanup endpoint
pub async fn cleanup() -> HttpResponse {
    match cleanup_files().await {
        Ok(deleted) => {
            HttpResponse::Ok().json(CleanupResponse {
                status: "success".to_string(),
                files_deleted: deleted,
            })
        }
        Err(e) => {
            error!("Cleanup failed: {}", e);
            create_error_response(
                actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
                &format!("Cleanup failed: {}", e)
            )
        }
    }
}

async fn cleanup_files() -> Result<usize, String> {
    let mut deleted = 0;
    let output_dir = Path::new(OUTPUT_DIR);

    if !output_dir.exists() {
        return Ok(0);
    }

    let entries = fs::read_dir(output_dir)
        .map_err(|e| format!("Failed to read output directory: {}", e))?;

    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("xlsx") {
                if let Err(e) = fs::remove_file(&path) {
                    warn!("Failed to delete {:?}: {}", path, e);
                } else {
                    deleted += 1;
                }
            }
        }
    }

    Ok(deleted)
}
