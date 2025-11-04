use rusqlite::{Connection, Result, params};
use std::path::Path;
use std::sync::{Arc, Mutex};
use chrono::Local;
use log::info;

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        info!("Initializing database at: {:?}", path.as_ref());
        let conn = Connection::open(path)?;

        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };

        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS conversion_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversion_type TEXT NOT NULL,
                file_format TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT TRUE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS daily_stats (
                date TEXT PRIMARY KEY,
                total_conversions INTEGER DEFAULT 0,
                file_upload_count INTEGER DEFAULT 0,
                url_conversion_count INTEGER DEFAULT 0
            )",
            [],
        )?;

        info!("Database tables initialized");
        Ok(())
    }

    pub fn increment_counter(&self, conversion_type: &str, file_format: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let today = Local::now().format("%Y-%m-%d").to_string();

        // Insert conversion record
        conn.execute(
            "INSERT INTO conversion_stats (conversion_type, file_format) VALUES (?1, ?2)",
            params![conversion_type, file_format],
        )?;

        // Check if today's record exists
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM daily_stats WHERE date = ?1)",
            params![&today],
            |row| row.get(0),
        )?;

        if exists {
            // Update existing record
            let column_name = format!("{}_count", conversion_type);
            let query = format!(
                "UPDATE daily_stats
                SET total_conversions = total_conversions + 1,
                    {} = {} + 1
                WHERE date = ?1",
                column_name, column_name
            );
            conn.execute(&query, params![&today])?;
        } else {
            // Create new record
            let (file_upload_count, url_conversion_count) = if conversion_type == "file_upload" {
                (1, 0)
            } else {
                (0, 1)
            };

            conn.execute(
                "INSERT INTO daily_stats (date, total_conversions, file_upload_count, url_conversion_count)
                VALUES (?1, 1, ?2, ?3)",
                params![&today, file_upload_count, url_conversion_count],
            )?;
        }

        info!("Counter incremented: {} - {}", conversion_type, file_format);
        Ok(())
    }

    pub fn get_total_conversions(&self) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM conversion_stats",
            [],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    pub fn get_conversions_by_type(&self) -> Result<(i64, i64)> {
        let conn = self.conn.lock().unwrap();

        let file_upload: i64 = conn.query_row(
            "SELECT COUNT(*) FROM conversion_stats WHERE conversion_type = 'file_upload'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let url_conversion: i64 = conn.query_row(
            "SELECT COUNT(*) FROM conversion_stats WHERE conversion_type = 'url_conversion'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        Ok((file_upload, url_conversion))
    }

    pub fn get_conversions_by_format(&self) -> Result<(i64, i64)> {
        let conn = self.conn.lock().unwrap();

        let json_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM conversion_stats WHERE file_format = 'json'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let csv_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM conversion_stats WHERE file_format = 'csv'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        Ok((json_count, csv_count))
    }

    pub fn get_today_stats(&self) -> Result<(i64, i64, i64)> {
        let conn = self.conn.lock().unwrap();
        let today = Local::now().format("%Y-%m-%d").to_string();

        let result = conn.query_row(
            "SELECT total_conversions, file_upload_count, url_conversion_count
            FROM daily_stats WHERE date = ?1",
            params![&today],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        );

        match result {
            Ok(stats) => Ok(stats),
            Err(_) => Ok((0, 0, 0)),
        }
    }

    pub fn get_last_7_days_stats(&self) -> Result<Vec<(String, i64, i64, i64)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT date, total_conversions, file_upload_count, url_conversion_count
            FROM daily_stats
            ORDER BY date DESC
            LIMIT 7"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
            ))
        })?;

        let mut stats = Vec::new();
        for row in rows {
            stats.push(row?);
        }

        Ok(stats)
    }
}

impl Clone for Database {
    fn clone(&self) -> Self {
        Database {
            conn: Arc::clone(&self.conn),
        }
    }
}
