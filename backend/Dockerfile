# Backend Dockerfile untuk Production
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy dependency files from parent directory
COPY pyproject.toml uv.lock ./

# Install Python dependencies using uv
RUN uv pip install --system --no-cache fastapi uvicorn python-multipart duckdb pandas openpyxl python-dotenv

# Copy application code from backend directory
COPY backend/ ./

# Create directories for temporary files
RUN mkdir -p temp_uploads temp_outputs && \
    chmod 755 temp_uploads temp_outputs

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run application with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
