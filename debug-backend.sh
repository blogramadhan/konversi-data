#!/bin/bash

# Script untuk debug backend yang tidak responding
# Usage: ./debug-backend.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Backend Debugging Script${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Get backend type
if [ -f .backend ]; then
    BACKEND_TYPE=$(cat .backend)
else
    BACKEND_TYPE="python"
fi

CONTAINER_NAME="konversi-data-backend-${BACKEND_TYPE}"

echo -e "${YELLOW}1. Container Status:${NC}"
docker ps -a --filter "name=${CONTAINER_NAME}"
echo ""

echo -e "${YELLOW}2. Last 50 lines of logs:${NC}"
docker logs ${CONTAINER_NAME} 2>&1 | tail -50
echo ""

echo -e "${YELLOW}3. Container inspect (restart count):${NC}"
docker inspect ${CONTAINER_NAME} --format='{{.RestartCount}}' 2>/dev/null || echo "Container not found"
echo ""

echo -e "${YELLOW}4. Container exit code:${NC}"
docker inspect ${CONTAINER_NAME} --format='{{.State.ExitCode}}' 2>/dev/null || echo "Container not found"
echo ""

echo -e "${YELLOW}5. Full logs (streaming):${NC}"
echo -e "${RED}Press Ctrl+C to stop${NC}"
echo ""
docker logs -f ${CONTAINER_NAME}
