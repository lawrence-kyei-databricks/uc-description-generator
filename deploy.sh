#!/bin/bash

# UC Description Generator - Quick Deploy Script
# For CarMax Databricks App

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Unity Catalog Description Generator - Deployment Script     ║"
echo "║  Built for CarMax | Powered by Databricks                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

if ! command -v databricks &> /dev/null; then
    echo -e "${YELLOW}⚠ Databricks CLI not found. Installing...${NC}"
    pip3 install databricks-cli
fi
echo -e "${GREEN}✓ Databricks CLI ready${NC}"

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "Step 1: Configuration"
echo "══════════════════════════════════════════════════════════════"

# Prompt for configuration
read -p "Enter your Databricks workspace URL (e.g., https://adb-xxx.azuredatabricks.net): " WORKSPACE_URL
read -p "Enter your SQL Warehouse ID: " WAREHOUSE_ID
read -p "Enter target catalog name [default: main]: " TARGET_CATALOG
TARGET_CATALOG=${TARGET_CATALOG:-main}
read -p "Enter governance schema name [default: governance]: " GOVERNANCE_SCHEMA
GOVERNANCE_SCHEMA=${GOVERNANCE_SCHEMA:-governance}
read -p "Enter Foundation Model endpoint [default: databricks-meta-llama-3-1-70b-instruct]: " MODEL_ENDPOINT
MODEL_ENDPOINT=${MODEL_ENDPOINT:-databricks-meta-llama-3-1-70b-instruct}

echo ""
echo "Configuration:"
echo "  Workspace: $WORKSPACE_URL"
echo "  Warehouse ID: $WAREHOUSE_ID"
echo "  Catalog: $TARGET_CATALOG"
echo "  Governance Schema: $GOVERNANCE_SCHEMA"
echo "  Model: $MODEL_ENDPOINT"
echo ""

read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Update app.yml
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "Step 2: Updating Configuration Files"
echo "══════════════════════════════════════════════════════════════"

cat > app.yml << EOF
command:
  - "python"
  - "app/main.py"

name: uc-description-generator

resources:
  - name: warehouse
    description: SQL warehouse for UC operations
    warehouse:
      id: "$WAREHOUSE_ID"

env:
  - name: TARGET_CATALOG
    value: "$TARGET_CATALOG"
  - name: GOVERNANCE_SCHEMA
    value: "$GOVERNANCE_SCHEMA"
  - name: MODEL_ENDPOINT
    value: "$MODEL_ENDPOINT"
  - name: FLASK_SECRET_KEY
    value: "$(openssl rand -hex 32)"
EOF

echo -e "${GREEN}✓ app.yml updated${NC}"

# Build frontend
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "Step 3: Building React Frontend"
echo "══════════════════════════════════════════════════════════════"

cd frontend

echo "Installing dependencies..."
npm install

echo "Building production bundle..."
npm run build

cd ..

if [ -d "static" ] && [ "$(ls -A static)" ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Deploy to Databricks
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "Step 4: Deploying to Databricks Apps"
echo "══════════════════════════════════════════════════════════════"

echo "Authenticating with Databricks..."
databricks auth login --host "$WORKSPACE_URL"

echo "Deploying application..."
databricks apps deploy uc-description-generator \
  --source-code-path . \
  --config app.yml

echo ""
echo "Getting application URL..."
APP_INFO=$(databricks apps get uc-description-generator 2>&1)
APP_URL=$(echo "$APP_INFO" | grep -o 'https://[^"]*' | head -1)

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT SUCCESSFUL! 🎉                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Application URL:${NC}"
echo "$APP_URL"
echo ""
echo "Next Steps:"
echo "  1. Open the application URL in your browser"
echo "  2. Click 'Initialize Setup' to create governance table"
echo "  3. Navigate to 'Generate' to start creating descriptions"
echo "  4. Review and approve descriptions in 'Review' page"
echo "  5. Apply approved descriptions to Unity Catalog"
echo ""
echo "Documentation:"
echo "  - README.md: Overview and features"
echo "  - DEPLOYMENT.md: Detailed deployment guide"
echo ""
echo "Support:"
echo "  - Contact your Databricks Solutions Architect"
echo "  - Review Databricks Apps documentation"
echo ""
echo "═════════════════════════════════════════════════════════════════"
echo ""
