#!/bin/bash

# Script to download environment variables from Google Secret Manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== API Environment Variables Download (Secret Manager) ===${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
API_DIR="$PROJECT_ROOT/api"

# Check if environment is specified
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify environment (development, staging, production)${NC}"
    echo "Usage: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1
SECRET_NAME="api-env-$ENVIRONMENT"

# Validate environment
case "$ENVIRONMENT" in
    development|staging|production)
        echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
        ;;
    *)
        echo -e "${RED}Error: Invalid environment. Use development, staging, or production${NC}"
        exit 1
        ;;
esac

# Output file
OUTPUT_FILE="$API_DIR/.env.$ENVIRONMENT"

# Check if secret exists
if ! gcloud secrets describe $SECRET_NAME &>/dev/null; then
    echo -e "${RED}Error: Secret '$SECRET_NAME' does not exist${NC}"
    echo -e "${YELLOW}Please run env-update.sh first to create the secret${NC}"
    exit 1
fi

# Backup existing file if it exists
if [ -f "$OUTPUT_FILE" ]; then
    BACKUP_FILE="$OUTPUT_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Backing up existing file to: $BACKUP_FILE${NC}"
    cp "$OUTPUT_FILE" "$BACKUP_FILE"
fi

# Download secret from Secret Manager
echo -e "${GREEN}Downloading environment variables from Secret Manager...${NC}"

# Access the latest version of the secret
gcloud secrets versions access latest --secret=$SECRET_NAME > "$OUTPUT_FILE"

# Check if download was successful
if [ -s "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}Environment variables saved to: $OUTPUT_FILE${NC}"
    
    # Show file info
    echo -e "${BLUE}File details:${NC}"
    echo "----------------------------------------"
    echo "File: $OUTPUT_FILE"
    echo "Size: $(wc -c < "$OUTPUT_FILE") bytes"
    echo "Lines: $(wc -l < "$OUTPUT_FILE")"
    echo "----------------------------------------"
    
    # Show first few lines (without exposing sensitive values)
    echo -e "${BLUE}First few lines (values hidden):${NC}"
    head -n 5 "$OUTPUT_FILE" | sed 's/=.*/=***/' || true
    echo "..."
    
    # Show secret metadata
    echo -e "${BLUE}Secret metadata:${NC}"
    gcloud secrets versions describe latest --secret=$SECRET_NAME --format="yaml(createTime,state)"
else
    echo -e "${RED}Error: Failed to download environment variables${NC}"
    exit 1
fi

# Create .env.example if it doesn't exist
EXAMPLE_FILE="$API_DIR/.env.example"
if [ ! -f "$EXAMPLE_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}Creating .env.example...${NC}"
    # Create example file with empty values
    grep -E "^[A-Z_]+=" "$OUTPUT_FILE" | sed 's/=.*/=/' > "$EXAMPLE_FILE"
    echo -e "${GREEN}.env.example created${NC}"
fi

echo -e "${GREEN}Download completed successfully!${NC}"