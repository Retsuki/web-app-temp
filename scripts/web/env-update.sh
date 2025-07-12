#!/bin/bash

# Script to update environment variables in Google Secret Manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Web Environment Variables Update (Secret Manager) ===${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"

# Check if environment is specified
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify environment (development, staging, production)${NC}"
    echo "Usage: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1
SECRET_NAME="web-env-$ENVIRONMENT"

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

# Check if .env file exists
ENV_FILE="$WEB_DIR/.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: Environment file not found: $ENV_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Reading environment variables from: $ENV_FILE${NC}"

# Check if secret exists
if gcloud secrets describe $SECRET_NAME &>/dev/null; then
    echo -e "${YELLOW}Secret '$SECRET_NAME' already exists. Creating new version...${NC}"
    
    # Create new version of the secret
    gcloud secrets versions add $SECRET_NAME \
        --data-file="$ENV_FILE"
    
    echo -e "${GREEN}New version added to secret '$SECRET_NAME'${NC}"
else
    echo -e "${YELLOW}Secret '$SECRET_NAME' does not exist. Creating...${NC}"
    
    # Create the secret
    gcloud secrets create $SECRET_NAME \
        --data-file="$ENV_FILE" \
        --replication-policy="automatic"
    
    echo -e "${GREEN}Secret '$SECRET_NAME' created successfully${NC}"
fi

# List secret versions
echo -e "${BLUE}Secret versions:${NC}"
gcloud secrets versions list $SECRET_NAME --limit=5

# Get latest version info
echo -e "${BLUE}Latest version details:${NC}"
gcloud secrets versions describe latest --secret=$SECRET_NAME

# Grant Cloud Run service account access to the secret if needed
echo -e "${YELLOW}Ensuring Cloud Run service account has access to the secret...${NC}"
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="$PROJECT_ID@appspot.gserviceaccount.com"

# Grant secret accessor role
gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None &>/dev/null || true

echo -e "${GREEN}Secret manager updated successfully!${NC}"
echo -e "${BLUE}To use this secret in Cloud Run, update your service with:${NC}"
echo -e "${YELLOW}gcloud run services update web --set-secrets=/path/to/mount=$SECRET_NAME:latest${NC}"