use actix_web::HttpResponse;
use std::path::Path;
use std::fs;
use csv;
use serde_json::Value;
use rust_xlsxwriter::{Workbook, Format};
use log::info;
use crate::models::ErrorResponse;

#[derive(Debug)]
pub enum FileFormat {
    Json,
    Csv,
}

pub fn detect_format_from_url(url: &str) -> Option<FileFormat> {
    let url_lower = url.to_lowercase();
    let url_path = url_lower.split('?').next().unwrap_or(&url_lower);

    if url_path.ends_with(".json") {
        Some(FileFormat::Json)
    } else if url_path.ends_with(".csv") {
        Some(FileFormat::Csv)
    } else {
        None
    }
}

pub fn detect_format_from_content_type(content_type: &str) -> Option<FileFormat> {
    let ct_lower = content_type.to_lowercase();

    if ct_lower.contains("json") || ct_lower.contains("application/json") {
        Some(FileFormat::Json)
    } else if ct_lower.contains("csv") || ct_lower.contains("text/csv") {
        Some(FileFormat::Csv)
    } else {
        None
    }
}

pub fn detect_format_from_content(content: &[u8]) -> Option<FileFormat> {
    if let Ok(text) = std::str::from_utf8(&content[..content.len().min(1000)]) {
        let trimmed = text.trim();

        // Check if it looks like JSON
        if trimmed.starts_with('{') || trimmed.starts_with('[') {
            if serde_json::from_str::<Value>(trimmed).is_ok() {
                return Some(FileFormat::Json);
            }
        }

        // Check if it looks like CSV (has commas and no JSON markers)
        if trimmed.contains(',') && !trimmed.starts_with('{') && !trimmed.starts_with('[') {
            return Some(FileFormat::Csv);
        }
    }

    None
}

pub fn process_json_to_excel(
    json_path: &Path,
    output_path: &Path,
    sheet_name: &str,
) -> Result<(), String> {
    info!("Processing JSON file: {:?}", json_path);

    // Read and parse JSON
    let json_content = fs::read_to_string(json_path)
        .map_err(|e| format!("Failed to read JSON file: {}", e))?;

    let json_value: Value = serde_json::from_str(&json_content)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // Convert to array of objects
    let records = match json_value {
        Value::Array(arr) => arr,
        Value::Object(_) => vec![json_value],
        _ => return Err("JSON must be an array or object".to_string()),
    };

    if records.is_empty() {
        return Err("JSON file contains no data".to_string());
    }

    // Create workbook
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet.set_name(sheet_name)
        .map_err(|e| format!("Failed to set sheet name: {}", e))?;

    // Get headers from first record
    let headers: Vec<String> = if let Value::Object(map) = &records[0] {
        map.keys().cloned().collect()
    } else {
        return Err("JSON records must be objects".to_string());
    };

    // Write headers
    let header_format = Format::new().set_bold();
    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string_with_format(0, col as u16, header, &header_format)
            .map_err(|e| format!("Failed to write header: {}", e))?;
    }

    // Write data
    for (row_idx, record) in records.iter().enumerate() {
        if let Value::Object(map) = record {
            for (col_idx, header) in headers.iter().enumerate() {
                let value = map.get(header).unwrap_or(&Value::Null);
                let row = (row_idx + 1) as u32;
                let col = col_idx as u16;

                match value {
                    Value::String(s) => {
                        worksheet.write_string(row, col, s)
                            .map_err(|e| format!("Failed to write string: {}", e))?;
                    }
                    Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            worksheet.write_number(row, col, i as f64)
                                .map_err(|e| format!("Failed to write number: {}", e))?;
                        } else if let Some(f) = n.as_f64() {
                            worksheet.write_number(row, col, f)
                                .map_err(|e| format!("Failed to write number: {}", e))?;
                        }
                    }
                    Value::Bool(b) => {
                        worksheet.write_boolean(row, col, *b)
                            .map_err(|e| format!("Failed to write boolean: {}", e))?;
                    }
                    Value::Null => {
                        worksheet.write_string(row, col, "")
                            .map_err(|e| format!("Failed to write empty cell: {}", e))?;
                    }
                    _ => {
                        worksheet.write_string(row, col, &value.to_string())
                            .map_err(|e| format!("Failed to write value: {}", e))?;
                    }
                }
            }
        }
    }

    // Save workbook
    workbook.save(output_path)
        .map_err(|e| format!("Failed to save Excel file: {}", e))?;

    info!("JSON converted to Excel successfully: {:?}", output_path);
    Ok(())
}

pub fn process_csv_to_excel(
    csv_path: &Path,
    output_path: &Path,
    sheet_name: &str,
) -> Result<(), String> {
    info!("Processing CSV file: {:?}", csv_path);

    // Read CSV
    let mut reader = csv::Reader::from_path(csv_path)
        .map_err(|e| format!("Failed to read CSV file: {}", e))?;

    // Create workbook
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet.set_name(sheet_name)
        .map_err(|e| format!("Failed to set sheet name: {}", e))?;

    // Write headers
    let headers = reader.headers()
        .map_err(|e| format!("Failed to read CSV headers: {}", e))?;

    let header_format = Format::new().set_bold();
    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string_with_format(0, col as u16, header, &header_format)
            .map_err(|e| format!("Failed to write header: {}", e))?;
    }

    // Write data
    for (row_idx, result) in reader.records().enumerate() {
        let record = result.map_err(|e| format!("Failed to read CSV record: {}", e))?;
        let row = (row_idx + 1) as u32;

        for (col_idx, field) in record.iter().enumerate() {
            let col = col_idx as u16;

            // Try to parse as number first
            if let Ok(num) = field.parse::<f64>() {
                worksheet.write_number(row, col, num)
                    .map_err(|e| format!("Failed to write number: {}", e))?;
            } else if field.eq_ignore_ascii_case("true") || field.eq_ignore_ascii_case("false") {
                let bool_val = field.eq_ignore_ascii_case("true");
                worksheet.write_boolean(row, col, bool_val)
                    .map_err(|e| format!("Failed to write boolean: {}", e))?;
            } else {
                worksheet.write_string(row, col, field)
                    .map_err(|e| format!("Failed to write string: {}", e))?;
            }
        }
    }

    // Save workbook
    workbook.save(output_path)
        .map_err(|e| format!("Failed to save Excel file: {}", e))?;

    info!("CSV converted to Excel successfully: {:?}", output_path);
    Ok(())
}

pub fn create_error_response(status: actix_web::http::StatusCode, message: &str) -> HttpResponse {
    HttpResponse::build(status).json(ErrorResponse {
        detail: message.to_string(),
    })
}

pub fn ensure_dir(path: &Path) -> std::io::Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}
