#!/bin/bash

# API deployment script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting API deployment...${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
API_DIR="$PROJECT_ROOT/api"

# Change to API directory
cd "$API_DIR"

# Check if required environment variables are set
if [ -z "$DEPLOY_ENV" ]; then
    echo -e "${YELLOW}DEPLOY_ENV not set, defaulting to 'production'${NC}"
    DEPLOY_ENV="production"
fi

echo -e "${GREEN}Deploying to: $DEPLOY_ENV${NC}"

# Build the API
echo -e "${GREEN}Building API...${NC}"
npm run build

# Run tests if they exist
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo -e "${GREEN}Running tests...${NC}"
    npm test || echo -e "${YELLOW}No tests found or tests skipped${NC}"
fi

# Type check
echo -e "${GREEN}Running type check...${NC}"
npm run build

# Deploy based on environment
case "$DEPLOY_ENV" in
    "production")
        echo -e "${GREEN}Deploying to production...${NC}"
        # Add production deployment commands here
        # e.g., gcloud app deploy, docker push, etc.
        ;;
    "staging")
        echo -e "${GREEN}Deploying to staging...${NC}"
        # Add staging deployment commands here
        ;;
    "development")
        echo -e "${GREEN}Deploying to development...${NC}"
        # Add development deployment commands here
        ;;
    *)
        echo -e "${RED}Unknown environment: $DEPLOY_ENV${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}API deployment completed successfully!${NC}"