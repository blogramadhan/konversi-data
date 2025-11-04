mod models;
mod database;
mod utils;
mod handlers;

use actix_web::{web, App, HttpServer, middleware};
use actix_cors::Cors;
use std::env;
use std::path::Path;
use log::{info, error};

use database::Database;
use handlers::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load .env file from parent directory (root of project)
    // Try to load from ../.env first (when running from backend-rust folder)
    if let Err(_) = dotenvy::from_filename("../.env") {
        // If not found, try current directory .env
        let _ = dotenvy::dotenv();
    }

    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    info!("Starting Konversi Data API v{}", env!("CARGO_PKG_VERSION"));

    // Create necessary directories
    let data_dir = Path::new("data");
    if let Err(e) = utils::ensure_dir(data_dir) {
        error!("Failed to create data directory: {}", e);
        return Err(e);
    }

    let upload_dir = Path::new("temp_uploads");
    if let Err(e) = utils::ensure_dir(upload_dir) {
        error!("Failed to create upload directory: {}", e);
        return Err(e);
    }

    let output_dir = Path::new("temp_outputs");
    if let Err(e) = utils::ensure_dir(output_dir) {
        error!("Failed to create output directory: {}", e);
        return Err(e);
    }

    info!("Directories initialized successfully");

    // Initialize database
    let db_path = data_dir.join("conversion_stats.db");
    let db = match Database::new(&db_path) {
        Ok(db) => {
            info!("Database initialized successfully at: {:?}", db_path);
            db
        }
        Err(e) => {
            error!("Failed to initialize database: {}", e);
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Database initialization failed: {}", e),
            ));
        }
    };

    let db_data = web::Data::new(db);

    // Parse CORS origins from environment
    let cors_origins = env::var("CORS_ORIGINS")
        .unwrap_or_else(|_| {
            info!("CORS_ORIGINS not set in .env, using default values");
            "http://localhost:3030,http://konversi-data-frontend:3030".to_string()
        });

    info!("CORS origins configured: {}", cors_origins);

    let host = env::var("BACKEND_HOST")
        .or_else(|_| env::var("HOST"))
        .unwrap_or_else(|_| "0.0.0.0".to_string());

    let port = env::var("BACKEND_PORT")
        .or_else(|_| env::var("PORT"))
        .unwrap_or_else(|_| "8000".to_string())
        .parse::<u16>()
        .unwrap_or(8000);

    info!("Server will start at {}:{}", host, port);

    // Start HTTP server
    HttpServer::new(move || {
        // Configure CORS
        let mut cors = Cors::default()
            .allow_any_method()
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);

        // Add allowed origins
        for origin in cors_origins.split(',') {
            let origin = origin.trim();
            if !origin.is_empty() {
                cors = cors.allowed_origin(origin);
            }
        }

        App::new()
            // Enable logger middleware
            .wrap(middleware::Logger::default())
            // Enable CORS
            .wrap(cors)
            // Share database connection
            .app_data(db_data.clone())
            // Configure routes
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health_check))
            .route("/convert", web::post().to(convert_file))
            .route("/convert-url", web::post().to(convert_url))
            .route("/stats", web::get().to(get_stats))
            .route("/cleanup", web::post().to(cleanup))
    })
    .bind((host.as_str(), port))?
    .workers(4)
    .run()
    .await
}
