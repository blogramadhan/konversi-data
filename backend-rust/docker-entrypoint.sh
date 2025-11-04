#!/bin/sh
# Don't use 'set -e' to capture errors
set +e

# Ensure directories exist and have correct permissions
# This is needed because Docker volumes may override directories created in Dockerfile
mkdir -p /app/data /app/temp_uploads /app/temp_outputs

# If running as root, chown and switch to appuser
if [ "$(id -u)" = "0" ]; then
    # Set ownership of mounted volumes to appuser
    chown -R appuser:appuser /app/data /app/temp_uploads /app/temp_outputs
    chmod -R 755 /app/data /app/temp_uploads /app/temp_outputs

    # Ensure binary is executable
    chmod +x /app/konversi-data-backend

    echo "=== Rust Backend Startup ==="
    echo "Binary: /app/konversi-data-backend"
    echo "Binary exists: $(test -f /app/konversi-data-backend && echo 'YES' || echo 'NO')"
    echo "Binary size: $(ls -lh /app/konversi-data-backend 2>/dev/null | awk '{print $5}')"
    echo "Binary type: $(file /app/konversi-data-backend)"
    echo "Working directory: $(pwd)"
    echo "User will be: appuser"
    echo "==========================="
    echo ""

    # Check if binary exists
    if [ ! -f "/app/konversi-data-backend" ]; then
        echo "ERROR: Binary not found at /app/konversi-data-backend"
        exit 1
    fi

    # Test if binary can be read
    if ! test -r "/app/konversi-data-backend"; then
        echo "ERROR: Binary not readable"
        exit 1
    fi

    # Execute the CMD as appuser using gosu
    echo "Executing: gosu appuser $@"
    gosu appuser "$@"
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "ERROR: Binary exited with code $EXIT_CODE"
        echo "Attempting to get more info..."
        echo "ldd output:"
        ldd /app/konversi-data-backend || echo "ldd failed"
    fi

    exit $EXIT_CODE
fi

# If not root, just execute the CMD
echo "=== Running as non-root user ==="
echo "Binary: /app/konversi-data-backend"
echo "Working directory: $(pwd)"
echo "Current user: $(whoami)"
echo "================================"

exec "$@"
