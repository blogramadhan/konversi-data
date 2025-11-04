# Backend Dockerfile untuk Production
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies including gosu
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Install uv using pip (more reliable for Docker)
RUN pip install --no-cache-dir uv

# Copy dependency files from parent directory
COPY pyproject.toml uv.lock ./

# Install Python dependencies using uv
RUN uv pip install --system --no-cache fastapi uvicorn[standard] python-multipart duckdb pandas openpyxl python-dotenv requests

# Copy entrypoint script
COPY backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy application code from backend directory
COPY backend/ ./

# Create directories for temporary files and persistent data
RUN mkdir -p temp_uploads temp_outputs data && \
    chmod 755 temp_uploads temp_outputs data

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Expose port
EXPOSE 8000

# Health check - using curl instead of python requests
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Use entrypoint to handle permissions before starting app
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Run application with uvicorn as appuser (entrypoint will handle user switching)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
