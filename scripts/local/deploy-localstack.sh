#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying to LocalStack...${NC}\n"

# Check if LocalStack is running
echo "Checking LocalStack health..."
if ! curl -s http://127.0.0.1:4566/_localstack/health > /dev/null; then
  echo -e "${RED}❌ LocalStack is not running!${NC}"
  echo "Start it with: npm run localstack:up"
  exit 1
fi
echo -e "${GREEN}✓ LocalStack is running${NC}\n"

# Deploy using serverless with localstack plugin
echo -e "${YELLOW}Deploying to LocalStack...${NC}\n"

serverless deploy \
  -c serverless.local.yml \
  --stage local \
  --region us-east-1 \
  --param=OPENAI_API_KEY=local \
  --param=ANTHROPIC_API_KEY=local \
  --param=JWT_SECRET=local-dev-secret-change-this \
  --param=FARMERS_MARKET_API_URL=http://localhost:4566/restapis/wuwardphyk/local/_user_request_/farmers-market/buy \
  --param=FRONTEND_URL=http://127.0.0.1:3000

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo "Run seed with: npm run seed:local"
