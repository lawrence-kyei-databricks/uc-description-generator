# Quick Reference - UC Description Generator

## 🚀 Deploy (DABs - Recommended)

```bash
# 1. Build frontend
cd frontend && npm install && npm run build && cd ..

# 2. Configure
vi databricks.dev.yml
  # Update warehouse_id

# 3. Deploy
databricks bundle deploy --target dev
```

## 📱 Using the App

### Generate Descriptions

1. **Select Target**
   - Choose Catalog
   - Choose Schema
   - ✅ Check permissions (automatic)

2. **Choose Mode**
   - **Bulk**: All tables (up to batch limit)
   - **Select**: Specific tables

3. **Generate**
   - Click "Generate Descriptions"
   - Wait for AI processing

4. **Review & Approve**
   - Go to Review page
   - Edit if needed
   - Enter your name
   - Click Approve

5. **Apply to UC**
   - Go to Dashboard
   - Click "Apply to UC"

## 🔐 Permission Check

The app automatically checks:
- ✅ USE CATALOG
- ✅ USE SCHEMA
- ✅ SELECT (read)
- ✅ MODIFY (write COMMENT)

**Green Banner** = You have access ✅
**Red Banner** = Insufficient permissions ❌

## 📊 Deployment Options

### Option 1: DABs (Recommended)
```bash
databricks bundle deploy --target dev
databricks bundle deploy --target prod
```

**Pros**: Environment management, CI/CD ready, multi-workspace

### Option 2: Legacy Script
```bash
./deploy.sh
```

**Pros**: Simple, interactive

## 🌍 Global Deployment

### Single Workspace
```bash
# Deploy once
databricks bundle deploy --target prod

# Users select any catalog/schema in UI
```

### Multi-Workspace (Regional)
```bash
# US
databricks bundle deploy --target prod --profile us-prod

# EU
databricks bundle deploy --target prod --profile eu-prod

# APAC
databricks bundle deploy --target prod --profile apac-prod
```

## 🔧 Configuration

### Environment Variables
```yaml
# databricks.dev.yml
variables:
  warehouse_id: "your-warehouse-id"
  target_catalog: "main"  # Default only
  governance_schema: "governance"
  model_endpoint: "databricks-meta-llama-3-1-70b-instruct"
```

### Using Secrets
```bash
# Create secret
databricks secrets put-secret scope-name flask_secret_key

# Reference in databricks.yml
flask_secret_key: "${secrets/scope-name/flask_secret_key}"
```

## 🐛 Troubleshooting

### Permission Denied
```sql
GRANT USE CATALOG ON CATALOG main TO `user@company.com`;
GRANT USE SCHEMA ON SCHEMA main.governance TO `user@company.com`;
GRANT SELECT, MODIFY ON SCHEMA main.* TO `user@company.com`;
```

### App Not Loading
```bash
cd frontend && npm run build && cd ..
databricks bundle deploy --target dev
```

### DABs Validation Error
```bash
databricks bundle validate --target dev
# Fix errors in databricks.yml
```

## 📞 API Endpoints

```
GET  /api/catalogs                  # List catalogs
GET  /api/schemas?catalog=X         # List schemas
GET  /api/tables?catalog=X&schema=Y # List tables
POST /api/permissions               # Check access
POST /api/generate                  # Generate descriptions
GET  /api/pending                   # Pending reviews
POST /api/review/:id                # Approve/reject
POST /api/apply                     # Apply to UC
GET  /api/stats                     # Statistics
```

## 📚 Documentation

- **README.md** - Overview
- **QUICK_START.md** - 5-min guide
- **DEPLOYMENT.md** - Detailed deploy
- **DABS_DEPLOYMENT.md** - DABs guide
- **GLOBAL_DEPLOYMENT_SUMMARY.md** - What changed
- **ARCHITECTURE.md** - Technical details

## ⚡ Common Tasks

### Check App URL
```bash
databricks apps get uc-description-generator-dev --output json | jq -r '.url'
```

### View Logs
```bash
databricks apps logs uc-description-generator-dev
```

### Redeploy After Changes
```bash
git pull
cd frontend && npm run build && cd ..
databricks bundle deploy --target dev
```

### Create Production Config
```bash
cp databricks.dev.yml databricks.prod.yml
# Update values for production
```

---

**Built for CarMax | Powered by Databricks**
