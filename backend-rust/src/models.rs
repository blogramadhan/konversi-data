use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ConvertURLRequest {
    pub url: String,
    #[serde(default = "default_sheet_name")]
    pub sheet_name: String,
}

fn default_sheet_name() -> String {
    "Data".to_string()
}

#[derive(Debug, Serialize)]
pub struct ApiInfo {
    pub message: String,
    pub version: String,
    pub endpoints: EndpointInfo,
}

#[derive(Debug, Serialize)]
pub struct EndpointInfo {
    pub convert: String,
    #[serde(rename = "convert-url")]
    pub convert_url: String,
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
pub struct CleanupResponse {
    pub status: String,
    pub files_deleted: usize,
}

#[derive(Debug, Serialize)]
pub struct StatsResponse {
    pub total_conversions: i64,
    pub by_type: ConversionTypeStats,
    pub by_format: FormatStats,
    pub today: TodayStats,
    pub last_7_days: Vec<DailyStats>,
}

#[derive(Debug, Serialize)]
pub struct ConversionTypeStats {
    pub file_upload: i64,
    pub url_conversion: i64,
}

#[derive(Debug, Serialize)]
pub struct FormatStats {
    pub json: i64,
    pub csv: i64,
}

#[derive(Debug, Serialize)]
pub struct TodayStats {
    pub total: i64,
    pub file_upload: i64,
    pub url_conversion: i64,
}

#[derive(Debug, Serialize)]
pub struct DailyStats {
    pub date: String,
    pub total: i64,
    pub file_upload: i64,
    pub url_conversion: i64,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub detail: String,
}
