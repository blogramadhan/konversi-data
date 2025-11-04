# Multi-stage build for Rust backend
# Stage 1: Build
FROM rust:1.83-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock* ./

# Create dummy main.rs to cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release || true && \
    rm -rf src

# Copy source code
COPY src ./src

# Build the application
RUN cargo build --release && \
    ls -lh /app/target/release/konversi-data-backend && \
    test -s /app/target/release/konversi-data-backend || (echo "ERROR: Build failed - binary not created" && exit 1)

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies including gosu for user switching
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gosu \
    file \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy binary from builder
COPY --from=builder /app/target/release/konversi-data-backend /app/konversi-data-backend

# Verify binary was copied correctly
RUN ls -lh /app/konversi-data-backend && \
    file /app/konversi-data-backend && \
    test -s /app/konversi-data-backend || (echo "ERROR: Binary is empty or not copied correctly" && exit 1)

# Make binary executable
RUN chmod +x /app/konversi-data-backend

# Create directories for temporary files and persistent data
RUN mkdir -p temp_uploads temp_outputs data && \
    chmod 755 temp_uploads temp_outputs data

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set environment variables
ENV RUST_LOG=info

# Use entrypoint to handle permissions before starting app
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Run the application as appuser (entrypoint will handle user switching)
CMD ["/app/konversi-data-backend"]
