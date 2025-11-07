# DABs Deployment Guide
## Unity Catalog Description Generator

Databricks Asset Bundles (DABs) is the modern, recommended way to deploy Databricks applications. This guide shows how to deploy the UC Description Generator globally using DABs.

---

## 🎯 Why DABs?

- **Environment Management**: Separate dev/staging/prod configurations
- **Version Control**: Track all changes in Git
- **Automation**: CI/CD friendly
- **Scalability**: Deploy to multiple workspaces easily
- **Best Practice**: Official Databricks deployment method

---

## 📋 Prerequisites

1. **Databricks CLI** installed and configured
   ```bash
   pip install databricks-cli
   databricks configure --token
   ```

2. **Databricks Asset Bundles** installed
   ```bash
   databricks bundle --help
   ```

3. **Git Repository** (recommended for version control)

4. **Permissions**:
   - Workspace Admin or ability to create apps
   - SQL Warehouse access
   - Unity Catalog permissions (USE CATALOG, CREATE SCHEMA, etc.)

---

## 🚀 Quick Deploy

### Step 1: Build Frontend

```bash
cd uc-description-app/frontend
npm install
npm run build
cd ..
```

### Step 2: Configure Environment

Edit `databricks.dev.yml`:

```yaml
variables:
  warehouse_id: "abc123def456"  # Your warehouse ID
  target_catalog: "main"
  governance_schema: "governance"
  model_endpoint: "databricks-meta-llama-3-1-70b-instruct"
  flask_secret_key: "generate-a-random-key-here"
```

### Step 3: Deploy

```bash
# Development
databricks bundle deploy --target dev

# Production
databricks bundle deploy --target prod
```

### Step 4: Get App URL

```bash
databricks bundle run uc-description-generator --target dev
```

---

## 📁 DABs Configuration Structure

```
uc-description-app/
├── databricks.yml           # Main DABs configuration
├── databricks.dev.yml       # Development variables
├── databricks.prod.yml      # Production variables
└── [app files]
```

### `databricks.yml`

Main configuration file defining:
- Bundle name
- Targets (dev, prod)
- App resources
- Environment variables
- Warehouse configuration

```yaml
bundle:
  name: uc-description-generator

targets:
  dev:
    mode: development
    resources:
      apps:
        uc-description-generator:
          name: uc-description-generator-dev
          # ... configuration
```

### `databricks.dev.yml` / `databricks.prod.yml`

Environment-specific variables:

```yaml
variables:
  warehouse_id: "YOUR_WAREHOUSE_ID"
  target_catalog: "main"
  governance_schema: "governance"
  model_endpoint: "databricks-meta-llama-3-1-70b-instruct"
  flask_secret_key: "your-secret-key"
```

---

## 🌍 Global Deployment Strategy

### Option 1: Single Workspace, Multiple Catalogs

**Use Case**: One organization, multiple business units

```bash
# Deploy once
databricks bundle deploy --target prod

# Users select catalog/schema in UI
# Each business unit uses different catalog
# - Sales: sales_catalog
# - Finance: finance_catalog
# - Operations: ops_catalog
```

**Pros**:
- Single app deployment
- Central management
- Shared governance table

**Cons**:
- All users see same app
- Single point of failure

### Option 2: Multiple Workspaces

**Use Case**: Global organization, regional workspaces

```bash
# Configure for each region
databricks configure --profile us-prod
databricks bundle deploy --target prod --profile us-prod

databricks configure --profile eu-prod
databricks bundle deploy --target prod --profile eu-prod

databricks configure --profile apac-prod
databricks bundle deploy --target prod --profile apac-prod
```

**Pros**:
- Regional isolation
- Better performance
- Compliance with data residency

**Cons**:
- Multiple deployments to manage
- Separate governance tables

### Option 3: Hybrid (Recommended for Large Orgs)

- **Dev/Staging**: Single workspace
- **Production**: Regional workspaces
- **CI/CD**: Automated deployment via GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy UC Description Generator

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        region: [us, eu, apac]
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to ${{ matrix.region }}
        run: |
          databricks bundle deploy \
            --target prod \
            --profile ${{ matrix.region }}-prod
```

---

## 🔧 Configuration Management

### Environment Variables

The app supports dynamic configuration via UI, but you can set defaults:

**Development**:
```yaml
# databricks.dev.yml
variables:
  target_catalog: "dev_catalog"
  governance_schema: "dev_governance"
  model_endpoint: "databricks-meta-llama-3-1-70b-instruct"
```

**Production**:
```yaml
# databricks.prod.yml
variables:
  target_catalog: "prod_catalog"
  governance_schema: "governance"
  model_endpoint: "databricks-meta-llama-3-1-70b-instruct"
  flask_secret_key: "${secrets.flask_secret_key}"  # From Databricks Secrets
```

### Using Databricks Secrets

**Best Practice**: Store sensitive values in Databricks Secrets

```bash
# Create secret scope
databricks secrets create-scope uc-desc-gen

# Store secret
databricks secrets put-secret uc-desc-gen flask_secret_key

# Reference in databricks.yml
variables:
  flask_secret_key:
    default: "${secrets/uc-desc-gen/flask_secret_key}"
```

---

## 🔄 Update & Rollback

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild frontend
cd frontend && npm run build && cd ..

# Deploy update
databricks bundle deploy --target prod
```

### Rollback

```bash
# Revert to previous Git commit
git revert HEAD

# Rebuild and redeploy
cd frontend && npm run build && cd ..
databricks bundle deploy --target prod
```

### Blue-Green Deployment

```bash
# Deploy new version as separate app
databricks bundle deploy --target prod-v2

# Test new version
# If good, update DNS/redirect
# If bad, keep using prod (original)

# Once stable, remove old version
databricks bundle destroy --target prod
```

---

## 📊 Monitoring & Logging

### View App Logs

```bash
databricks apps logs uc-description-generator-prod
```

### Monitor App Status

```bash
databricks apps get uc-description-generator-prod
```

### Check App URL

```bash
databricks apps get uc-description-generator-prod --output json | jq -r '.url'
```

---

## 🔒 Security & Permissions

### Workspace-Level Permissions

```sql
-- Grant app deployment permissions
GRANT CREATE ON WORKSPACE TO `data_platform_team@carmax.com`;
```

### Unity Catalog Permissions

```sql
-- For app to function, users need:
GRANT USE CATALOG ON CATALOG main TO `user@carmax.com`;
GRANT USE SCHEMA ON SCHEMA main.governance TO `user@carmax.com`;
GRANT CREATE TABLE ON SCHEMA main.governance TO `user@carmax.com`;
GRANT SELECT, MODIFY ON SCHEMA main.* TO `user@carmax.com`;
```

### SQL Warehouse Permissions

```sql
-- Grant warehouse access
GRANT USAGE ON WAREHOUSE your_warehouse TO `user@carmax.com`;
```

---

## 🧪 Testing Deployment

### Smoke Test Script

```bash
#!/bin/bash

echo "Testing UC Description Generator deployment..."

# Get app URL
APP_URL=$(databricks apps get uc-description-generator-prod --output json | jq -r '.url')

# Test health endpoint
curl -f "$APP_URL/api/stats" || {
  echo "❌ Health check failed"
  exit 1
}

echo "✅ Deployment successful: $APP_URL"
```

### Integration Tests

```python
# test_deployment.py
import requests

def test_app_accessible():
    url = "https://your-workspace/apps/uc-description-generator-prod"
    response = requests.get(f"{url}/api/catalogs")
    assert response.status_code == 200
    assert 'catalogs' in response.json()

def test_permissions():
    url = "https://your-workspace/apps/uc-description-generator-prod"
    response = requests.post(f"{url}/api/permissions", json={
        "catalog": "main",
        "schema": "default"
    })
    assert response.status_code == 200
    assert response.json()['success'] == True
```

---

## 🌐 Multi-Region Deployment

### Setup Regional Profiles

```bash
# US Region
databricks configure --profile us-prod
# Host: https://xxx.cloud.databricks.com
# Token: dapi...

# EU Region
databricks configure --profile eu-prod
# Host: https://xxx.eu-west-1.cloud.databricks.com
# Token: dapi...

# APAC Region
databricks configure --profile apac-prod
# Host: https://xxx.ap-southeast-2.cloud.databricks.com
# Token: dapi...
```

### Deploy to All Regions

```bash
#!/bin/bash
# deploy-all.sh

REGIONS=("us-prod" "eu-prod" "apac-prod")

for region in "${REGIONS[@]}"; do
  echo "Deploying to $region..."
  databricks bundle deploy --target prod --profile $region

  if [ $? -eq 0 ]; then
    echo "✅ $region deployed successfully"
  else
    echo "❌ $region deployment failed"
    exit 1
  fi
done

echo "✅ All regions deployed successfully"
```

---

## 📦 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Databricks

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Setup Databricks CLI
        run: |
          pip install databricks-cli

      - name: Deploy to Dev
        if: github.ref == 'refs/heads/develop'
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST_DEV }}
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN_DEV }}
        run: |
          databricks bundle deploy --target dev

      - name: Deploy to Prod
        if: github.ref == 'refs/heads/main'
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST_PROD }}
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN_PROD }}
        run: |
          databricks bundle deploy --target prod
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

build:
  stage: build
  image: node:18
  script:
    - cd frontend
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/dist/

deploy:dev:
  stage: deploy
  image: python:3.9
  only:
    - develop
  script:
    - pip install databricks-cli
    - databricks bundle deploy --target dev

deploy:prod:
  stage: deploy
  image: python:3.9
  only:
    - main
  script:
    - pip install databricks-cli
    - databricks bundle deploy --target prod
```

---

## 🔍 Troubleshooting

### Issue: "Bundle validation failed"

```bash
# Validate configuration
databricks bundle validate --target dev

# Check for syntax errors in databricks.yml
```

### Issue: "Warehouse not found"

```bash
# List available warehouses
databricks sql warehouses list

# Update warehouse_id in databricks.dev.yml
```

### Issue: "Permission denied"

```bash
# Check current user
databricks current-user me

# Verify workspace permissions
# Contact workspace admin to grant app deployment permissions
```

### Issue: "Frontend not loading"

```bash
# Rebuild frontend
cd frontend
rm -rf node_modules dist
npm install
npm run build
cd ..

# Redeploy
databricks bundle deploy --target dev
```

---

## 📚 Additional Resources

- **Databricks Asset Bundles**: https://docs.databricks.com/dev-tools/bundles/
- **Databricks Apps**: https://docs.databricks.com/dev-tools/databricks-apps/
- **Databricks CLI**: https://docs.databricks.com/dev-tools/cli/
- **Unity Catalog**: https://docs.databricks.com/data-governance/unity-catalog/

---

## 📞 Support

**For Deployment Issues**:
1. Check `databricks bundle validate`
2. Review logs: `databricks apps logs`
3. Contact Databricks Support or Solutions Architect

**For Application Issues**:
1. Check app logs
2. Verify permissions
3. Review `DEPLOYMENT.md` for troubleshooting

---

**Built for Global Deployment | Powered by Databricks Asset Bundles**
