#!/bin/sh
set -e

# Ensure directories exist and have correct permissions
# This is needed because Docker volumes may override directories created in Dockerfile
mkdir -p /app/data /app/temp_uploads /app/temp_outputs

# If running as root, chown and switch to appuser
if [ "$(id -u)" = "0" ]; then
    # Set ownership of mounted volumes to appuser
    chown -R appuser:appuser /app/data /app/temp_uploads /app/temp_outputs
    chmod -R 755 /app/data /app/temp_uploads /app/temp_outputs

    echo "Starting application as appuser..."
    # Execute the CMD as appuser using gosu
    exec gosu appuser "$@"
fi

# If not root, just execute the CMD
echo "Starting application as current user..."
exec "$@"
