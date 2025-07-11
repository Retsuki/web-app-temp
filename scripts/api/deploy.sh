#!/bin/bash

# Simple API deployment script using Google Cloud Build

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}API Deployment via Cloud Build${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)

if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${YELLOW}No Google Cloud project configured${NC}"
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
else
    echo -e "${GREEN}Using project: $CURRENT_PROJECT${NC}"
    read -p "Continue with this project? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -p "Enter your Google Cloud Project ID: " PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    fi
fi

# Change to project root directory
cd "$PROJECT_ROOT"

# Check if Cloud Build config exists
if [ ! -f "api/cloudbuild.yaml" ]; then
    echo -e "${RED}Error: api/cloudbuild.yaml not found${NC}"
    exit 1
fi

# Check if .env file exists and ask about updating secret
if [ -f "api/.env" ]; then
    echo -e "${YELLOW}Found api/.env file${NC}"
    read -p "Update Secret Manager with latest environment variables? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Updating Secret Manager...${NC}"
        if gcloud secrets describe "api-env-production" &>/dev/null; then
            gcloud secrets versions add "api-env-production" --data-file="api/.env"
        else
            gcloud secrets create "api-env-production" --data-file="api/.env" --replication-policy="automatic"
        fi
    else
        echo -e "${YELLOW}Skipping Secret Manager update${NC}"
    fi
else
    echo -e "${YELLOW}Warning: api/.env file not found${NC}"
    echo -e "${YELLOW}Make sure 'api-env-production' secret exists in Secret Manager${NC}"
fi

# Submit to Cloud Build
echo -e "${GREEN}Submitting to Cloud Build...${NC}"
gcloud builds submit --config=api/cloudbuild.yaml --timeout=20m

# Get service URL
echo -e "${GREEN}Checking deployment status...${NC}"
SERVICE_URL=$(gcloud run services describe api --region=asia-northeast1 --format="value(status.url)" 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
else
    echo -e "${YELLOW}Check Cloud Console for deployment status${NC}"
fi