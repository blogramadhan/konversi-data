const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const duckdb = require('duckdb');
const ExcelJS = require('exceljs');
const axios = require('axios');
require('dotenv').config();

// Setup Express app
const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Logging setup
const log = {
    info: (...args) => console.log('[INFO]', new Date().toISOString(), ...args),
    error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
    warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args)
};

// CORS configuration
const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3030', 'http://localhost:5173'];

app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directory setup
const UPLOAD_DIR = path.join(__dirname, 'temp_uploads');
const OUTPUT_DIR = path.join(__dirname, 'temp_outputs');
const DATA_DIR = path.join(__dirname, 'data');

// Create directories
[UPLOAD_DIR, OUTPUT_DIR, DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log.info(`Directory created: ${dir}`);
    }
});

// Test write permission
try {
    const testFile = path.join(DATA_DIR, '.test_write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    log.info(`Data directory initialized at: ${DATA_DIR}`);
} catch (error) {
    log.error(`Failed to initialize data directory: ${error.message}`);
    process.exit(1);
}

// JSON Database setup
const DB_PATH = path.join(DATA_DIR, 'conversion_stats.json');

// Initialize JSON database
function initDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initialData = {
                conversion_stats: [],
                daily_stats: {}
            };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
            log.info(`Initialized JSON database at: ${DB_PATH}`);
        } else {
            log.info(`Using existing database at: ${DB_PATH}`);
        }
    } catch (error) {
        log.error(`Failed to initialize database: ${error.message}`);
        throw error;
    }
}

// Read database
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        log.error(`Failed to read database: ${error.message}`);
        return { conversion_stats: [], daily_stats: {} };
    }
}

// Write database
function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        log.error(`Failed to write database: ${error.message}`);
        throw error;
    }
}

// Increment counter
function incrementCounter(conversion_type, file_format) {
    try {
        const db = readDB();

        // Insert conversion record
        db.conversion_stats.push({
            id: db.conversion_stats.length + 1,
            conversion_type,
            file_format,
            timestamp: new Date().toISOString(),
            success: true
        });

        // Update daily stats
        const today = new Date().toISOString().split('T')[0];

        if (!db.daily_stats[today]) {
            db.daily_stats[today] = {
                date: today,
                total_conversions: 0,
                file_upload_count: 0,
                url_conversion_count: 0
            };
        }

        db.daily_stats[today].total_conversions += 1;
        db.daily_stats[today][`${conversion_type}_count`] += 1;

        writeDB(db);
        log.info(`Counter incremented: ${conversion_type} - ${file_format}`);
    } catch (error) {
        log.error(`Failed to increment counter: ${error.message}`);
    }
}

// Initialize database on startup
initDB();

// Multer configuration for file uploads
const upload = multer({
    dest: UPLOAD_DIR,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Convert data to Excel using ExcelJS
async function convertToExcel(data, sheetName, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
        throw new Error('No data to convert');
    }

    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => row[header]);
        worksheet.addRow(values);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Save workbook
    await workbook.xlsx.writeFile(outputPath);
}

// Process file with DuckDB
function processFileWithDuckDB(filePath, fileExt) {
    return new Promise((resolve, reject) => {
        const duckDb = new duckdb.Database(':memory:');

        duckDb.all(`SELECT * FROM read_${fileExt}_auto('${filePath}')`, (err, result) => {
            if (err) {
                duckDb.close();
                return reject(err);
            }

            log.info(`Data loaded: ${result.length} rows`);
            duckDb.close();
            resolve(result);
        });
    });
}

// Routes

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Konversi Data API',
        version: '1.0.0',
        endpoints: {
            convert: '/convert - POST - Upload JSON/CSV dan konversi ke Excel',
            'convert-url': '/convert-url - POST - Konversi dari URL JSON/CSV ke Excel'
        }
    });
});

// Convert file endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
    let uploadPath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ detail: 'No file uploaded' });
        }

        const originalFilename = req.file.originalname;
        const sheetName = req.body.sheet_name || 'Data';

        log.info(`Processing file: ${originalFilename}`);

        const fileExt = originalFilename.toLowerCase().split('.').pop();
        if (!['json', 'csv'].includes(fileExt)) {
            return res.status(400).json({
                detail: 'Format file tidak didukung. Gunakan .json atau .csv'
            });
        }

        uploadPath = req.file.path;

        // Check if file is empty
        const stats = fs.statSync(uploadPath);
        if (stats.size === 0) {
            return res.status(400).json({ detail: 'File kosong' });
        }

        log.info(`File saved to: ${uploadPath}`);

        // Process with DuckDB
        const data = await processFileWithDuckDB(uploadPath, fileExt);

        if (!data || data.length === 0) {
            return res.status(400).json({ detail: 'File tidak mengandung data' });
        }

        // Generate output filename
        const outputFilename = `${path.parse(originalFilename).name}_converted.xlsx`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);

        // Convert to Excel
        log.info(`Converting to Excel: ${outputFilename}`);
        await convertToExcel(data, sheetName, outputPath);

        log.info('Conversion successful');

        // Increment counter
        incrementCounter('file_upload', fileExt);

        // Send file
        res.download(outputPath, outputFilename, (err) => {
            // Cleanup after download
            if (uploadPath && fs.existsSync(uploadPath)) {
                fs.unlinkSync(uploadPath);
                log.info('Cleanup upload file successful');
            }

            if (err) {
                log.error(`Download error: ${err.message}`);
            }
        });

    } catch (error) {
        log.error(`Error: ${error.message}`);

        // Cleanup on error
        if (uploadPath && fs.existsSync(uploadPath)) {
            try {
                fs.unlinkSync(uploadPath);
            } catch (e) {
                log.warn(`Failed to cleanup upload file: ${e.message}`);
            }
        }

        if (error.message && error.message.includes('DuckDB')) {
            return res.status(400).json({
                detail: `Error processing file dengan DuckDB: ${error.message}`
            });
        }

        res.status(500).json({ detail: `Error: ${error.message}` });
    }
});

// Convert URL endpoint
app.post('/convert-url', async (req, res) => {
    let downloadPath = null;
    let outputPath = null;

    try {
        const { url, sheet_name = 'Data' } = req.body;

        if (!url) {
            return res.status(400).json({ detail: 'URL is required' });
        }

        log.info(`Processing URL: ${url}`);

        // Download file
        log.info('Downloading file from URL...');

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/csv, text/plain, */*',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive'
        };

        let response;
        try {
            response = await axios.get(url, {
                headers,
                timeout: 60000,
                maxRedirects: 5,
                responseType: 'arraybuffer'
            });

            log.info(`Response status: ${response.status}`);
            log.info(`Content-Type: ${response.headers['content-type']}`);
        } catch (error) {
            if (error.response) {
                if (error.response.status === 403) {
                    return res.status(400).json({
                        detail: 'Akses ditolak (403 Forbidden). Server memblokir request.'
                    });
                } else if (error.response.status === 404) {
                    return res.status(400).json({
                        detail: 'URL tidak ditemukan (404 Not Found).'
                    });
                }
            }
            return res.status(400).json({
                detail: `Gagal mengunduh file dari URL: ${error.message}`
            });
        }

        if (!response.data || response.data.length === 0) {
            return res.status(400).json({ detail: 'File dari URL kosong' });
        }

        // Detect file type
        let fileExt = null;
        const urlLower = url.toLowerCase().split('?')[0];

        // Method 1: URL extension
        if (urlLower.endsWith('.json')) {
            fileExt = 'json';
            log.info('Detected format from URL: JSON');
        } else if (urlLower.endsWith('.csv')) {
            fileExt = 'csv';
            log.info('Detected format from URL: CSV');
        }

        // Method 2: Content-Type header
        if (!fileExt) {
            const contentType = (response.headers['content-type'] || '').toLowerCase();
            if (contentType.includes('json')) {
                fileExt = 'json';
                log.info('Detected format from Content-Type: JSON');
            } else if (contentType.includes('csv')) {
                fileExt = 'csv';
                log.info('Detected format from Content-Type: CSV');
            }
        }

        // Method 3: Content analysis
        if (!fileExt) {
            const sample = Buffer.from(response.data).toString('utf-8', 0, 1000).trim();
            log.info(`Content sample: ${sample.substring(0, 100)}`);

            if (sample.startsWith('{') || sample.startsWith('[')) {
                try {
                    JSON.parse(sample.length < 1000 ? sample : Buffer.from(response.data).toString('utf-8'));
                    fileExt = 'json';
                    log.info('Detected format from content: JSON');
                } catch (e) {
                    // Not JSON
                }
            }

            if (!fileExt && sample.includes(',') && !sample.startsWith('{') && !sample.startsWith('[')) {
                fileExt = 'csv';
                log.info('Detected format from content: CSV');
            }
        }

        if (!fileExt) {
            return res.status(400).json({
                detail: 'Tidak dapat mendeteksi format file. Pastikan URL mengarah ke file .json atau .csv yang valid'
            });
        }

        // Save downloaded file
        const filename = `downloaded_${Date.now()}.${fileExt}`;
        downloadPath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(downloadPath, response.data);

        log.info(`File downloaded and saved to: ${downloadPath}`);

        // Process with DuckDB
        const data = await processFileWithDuckDB(downloadPath, fileExt);

        if (!data || data.length === 0) {
            return res.status(400).json({ detail: 'File tidak mengandung data' });
        }

        // Generate output filename
        const outputFilename = `url_converted_${Date.now()}.xlsx`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);

        // Convert to Excel
        log.info(`Converting to Excel: ${outputFilename}`);
        await convertToExcel(data, sheet_name, outputPath);

        log.info('Conversion successful');

        // Increment counter
        incrementCounter('url_conversion', fileExt);

        // Send file
        res.download(outputPath, outputFilename, (err) => {
            // Cleanup after download
            if (downloadPath && fs.existsSync(downloadPath)) {
                fs.unlinkSync(downloadPath);
                log.info('Cleanup downloaded file successful');
            }

            if (err) {
                log.error(`Download error: ${err.message}`);
            }
        });

    } catch (error) {
        log.error(`Error: ${error.message}`);

        // Cleanup on error
        if (downloadPath && fs.existsSync(downloadPath)) {
            try {
                fs.unlinkSync(downloadPath);
            } catch (e) {
                log.warn(`Failed to cleanup downloaded file: ${e.message}`);
            }
        }

        if (error.message && error.message.includes('DuckDB')) {
            return res.status(400).json({
                detail: `Error processing file dengan DuckDB: ${error.message}`
            });
        }

        res.status(500).json({ detail: `Error: ${error.message}` });
    }
});

// Stats endpoint
app.get('/stats', (req, res) => {
    try {
        const db = readDB();

        // Get total conversions
        const totalConversions = db.conversion_stats.length;

        // Get conversions by type
        const byType = db.conversion_stats.reduce((acc, stat) => {
            acc[stat.conversion_type] = (acc[stat.conversion_type] || 0) + 1;
            return acc;
        }, {});

        // Get conversions by format
        const byFormat = db.conversion_stats.reduce((acc, stat) => {
            acc[stat.file_format] = (acc[stat.file_format] || 0) + 1;
            return acc;
        }, {});

        // Get today's stats
        const today = new Date().toISOString().split('T')[0];
        const todayStats = db.daily_stats[today] || {
            total_conversions: 0,
            file_upload_count: 0,
            url_conversion_count: 0
        };

        // Get last 7 days stats
        const weeklyStats = Object.values(db.daily_stats)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 7);

        res.json({
            total_conversions: totalConversions,
            by_type: {
                file_upload: byType.file_upload || 0,
                url_conversion: byType.url_conversion || 0
            },
            by_format: {
                json: byFormat.json || 0,
                csv: byFormat.csv || 0
            },
            today: {
                total: todayStats.total_conversions,
                file_upload: todayStats.file_upload_count,
                url_conversion: todayStats.url_conversion_count
            },
            last_7_days: weeklyStats.map(row => ({
                date: row.date,
                total: row.total_conversions,
                file_upload: row.file_upload_count,
                url_conversion: row.url_conversion_count
            }))
        });
    } catch (error) {
        log.error(`Failed to get stats: ${error.message}`);
        res.status(500).json({ detail: `Failed to get statistics: ${error.message}` });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        node_version: process.version
    });
});

// Cleanup endpoint
app.post('/cleanup', (req, res) => {
    try {
        let deleted = 0;
        const files = fs.readdirSync(OUTPUT_DIR);

        files.forEach(file => {
            if (file.endsWith('.xlsx')) {
                try {
                    fs.unlinkSync(path.join(OUTPUT_DIR, file));
                    deleted++;
                } catch (error) {
                    log.warn(`Failed to delete ${file}: ${error.message}`);
                }
            }
        });

        res.json({ status: 'success', files_deleted: deleted });
    } catch (error) {
        res.status(500).json({ detail: `Cleanup failed: ${error.message}` });
    }
});

// Start server
app.listen(PORT, HOST, () => {
    log.info(`Server running at http://${HOST}:${PORT}`);
    log.info(`CORS origins: ${CORS_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    log.info('Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log.info('Shutting down gracefully...');
    process.exit(0);
});
