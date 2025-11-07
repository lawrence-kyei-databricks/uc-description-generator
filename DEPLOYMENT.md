# UC Description Generator - Deployment Guide

## CarMax Unity Catalog Description Generator
**AI-Powered Table & Column Documentation for Compliance**

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Databricks App (Web UI)                    │
│                                                               │
│  ┌────────────────┐              ┌─────────────────────┐   │
│  │  React Frontend│──────────────│  Flask Backend API  │   │
│  │   (Vite Build) │              │                     │   │
│  │                │              │  - DescriptionService│   │
│  │  - Dashboard   │              │  - Foundation Model │   │
│  │  - Generate    │              │  - SQL Execution    │   │
│  │  - Review      │              │                     │   │
│  │  - Compliance  │              │                     │   │
│  └────────────────┘              └─────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ OAuth Authentication
                          │ via Databricks SDK
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    Databricks Workspace                       │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │ Foundation   │    │  SQL         │    │ Unity Catalog │ │
│  │ Model API    │    │  Warehouse   │    │               │ │
│  │ (Llama 3.1)  │    │              │    │  - Tables     │ │
│  └──────────────┘    └──────────────┘    │  - Columns    │ │
│                                           │  - Comments   │ │
│                                           └───────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Governance Table: main.governance.description_governance│  │
│  │  - Tracks AI-generated descriptions                   │   │
│  │  - Human review workflow                              │   │
│  │  - Full audit trail                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Databricks Requirements
- ✅ Databricks workspace (AWS, Azure, or GCP)
- ✅ Unity Catalog enabled
- ✅ SQL Warehouse (Serverless or Pro)
- ✅ Foundation Model API access (Llama 3.1 70B or similar)
- ✅ Databricks Apps enabled (Public Preview)

### Permissions Required
- `CREATE SCHEMA` on target catalog
- `CREATE TABLE` on governance schema
- `SELECT` on `system.information_schema`
- `MODIFY` + `SELECT` on tables to be documented
- `EXECUTE` on Foundation Model endpoints
- `USE CATALOG` and `USE SCHEMA` on relevant catalogs/schemas

### Local Development (Optional)
- Node.js 18+
- Python 3.9+
- Databricks CLI configured

---

## Step 1: Clone and Configure

```bash
# Navigate to app directory
cd uc-description-app

# Update app.yml with your warehouse ID
cat > app.yml << EOF
command:
  - "python"
  - "app/main.py"

name: uc-description-generator

resources:
  - name: warehouse
    description: SQL warehouse for UC operations
    warehouse:
      id: "YOUR_WAREHOUSE_ID_HERE"  # Update this!
EOF

# Set environment variables (create .env file)
cat > .env << EOF
TARGET_CATALOG=main
GOVERNANCE_SCHEMA=governance
MODEL_ENDPOINT=databricks-meta-llama-3-1-70b-instruct
FLASK_SECRET_KEY=$(openssl rand -hex 32)
EOF
```

---

## Step 2: Build React Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
# This creates optimized static files in ../static/
```

The build output will be served by the Flask backend.

---

## Step 3: Deploy to Databricks Apps

### Option A: Using Databricks CLI

```bash
# Install/update Databricks CLI
pip install --upgrade databricks-cli

# Authenticate (if not already done)
databricks configure --token

# Deploy the app
databricks apps deploy uc-description-generator \
  --source-code-path . \
  --config app.yml

# Get the app URL
databricks apps get uc-description-generator
```

### Option B: Using Databricks Workspace UI

1. Navigate to **Workspace** → **Create** → **App**
2. Select "From Git" or "Upload folder"
3. Point to `uc-description-app` directory
4. Configure:
   - **Name**: `uc-description-generator`
   - **Warehouse**: Select your SQL warehouse
   - **Environment Variables**:
     ```
     TARGET_CATALOG=main
     GOVERNANCE_SCHEMA=governance
     MODEL_ENDPOINT=databricks-meta-llama-3-1-70b-instruct
     ```
5. Click **Deploy**

---

## Step 4: Initialize the Application

1. **Open the App URL** (from deployment output or Apps UI)

2. **First-time Setup**:
   - Navigate to the Dashboard
   - Click **"Initialize Setup"** button
   - This creates the `main.governance.description_governance` table

3. **Verify Setup**:
   ```sql
   -- Run in SQL Editor
   SELECT * FROM main.governance.description_governance LIMIT 10;

   DESCRIBE TABLE EXTENDED main.governance.description_governance;
   ```

---

## Step 5: Workflow Usage

### 1. Generate Descriptions

**UI Path**: Dashboard → Generate

1. Enter **Catalog Name**: `main`
2. Enter **Schema Name**: (optional, leave empty for all schemas)
3. Set **Batch Size**: `50` (recommended for first run)
4. Click **"Generate Descriptions"**

**What happens**:
- Extracts table/column metadata from Unity Catalog
- Calls Foundation Model API for each table/column
- Stores AI-generated descriptions in governance table
- Status: `PENDING`

### 2. Review & Approve

**UI Path**: Dashboard → Review

1. Browse AI-generated descriptions
2. For each item:
   - **Edit** description if needed (click pencil icon)
   - **Enter your name/email** as reviewer
   - Click **Approve** or **Reject**

**Review Best Practices**:
- Start with one schema to validate quality
- Involve SMEs for domain-specific tables
- Check that descriptions are accurate and compliant
- Edit generic descriptions to add context

### 3. Apply to Unity Catalog

**UI Path**: Dashboard → Click "Apply to UC" or Review → After approval

1. Click **"Apply to UC"** button
2. Confirm the action
3. Wait for completion

**What happens**:
- Executes `COMMENT ON TABLE` for table descriptions
- Executes `ALTER TABLE ... ALTER COLUMN ... COMMENT` for columns
- Updates governance table status to `APPLIED`
- Descriptions now visible in:
  - Databricks Catalog Explorer
  - `system.information_schema.tables/columns`
  - Data lineage and discovery tools

### 4. Monitor Compliance

**UI Path**: Dashboard → Compliance

View:
- **Compliance Score** (A-F grade)
- **Progress by Schema** (charts)
- **Coverage Details** (table)
- **Reviewer Activity**

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_CATALOG` | `main` | Unity Catalog catalog to document |
| `GOVERNANCE_SCHEMA` | `governance` | Schema for governance table |
| `MODEL_ENDPOINT` | `databricks-meta-llama-3-1-70b-instruct` | Foundation Model endpoint |
| `WAREHOUSE_ID` | (required) | SQL Warehouse ID |
| `FLASK_SECRET_KEY` | (auto-generated) | Flask session secret |
| `PORT` | `8080` | Application port |

### Customizing the Model

To use a different Foundation Model:

1. Update `MODEL_ENDPOINT` in environment variables
2. Available models:
   - `databricks-meta-llama-3-1-70b-instruct` (Recommended)
   - `databricks-dbrx-instruct`
   - `databricks-meta-llama-3-1-405b-instruct` (For complex tables)

3. Adjust `max_tokens` and `temperature` in `app/main.py` if needed:
   ```python
   payload = {
       "messages": [...],
       "max_tokens": 200,  # Increase for longer descriptions
       "temperature": 0.3   # Lower = more consistent
   }
   ```

---

## Security & Compliance

### Authentication
- OAuth-based authentication via Databricks SDK
- No hardcoded credentials
- Workspace-level access control

### Authorization
- Inherits user permissions from Unity Catalog
- Users can only document tables they have access to
- Governance table has full audit trail

### Audit Trail
Every description includes:
- `reviewer` - Who approved
- `generated_at` - When AI generated
- `reviewed_at` - When reviewed
- `applied_at` - When applied to UC
- `model_used` - Which AI model
- `ai_generated_description` - Original AI output
- `approved_description` - Final approved version

### Query Audit Trail

```sql
-- Who reviewed what and when
SELECT
  reviewer,
  COUNT(*) as items_reviewed,
  MIN(reviewed_at) as first_review,
  MAX(reviewed_at) as last_review
FROM main.governance.description_governance
WHERE reviewer IS NOT NULL
GROUP BY reviewer;

-- Recently applied descriptions
SELECT
  CONCAT(catalog_name, '.', schema_name, '.', table_name) as object_path,
  approved_description,
  reviewer,
  applied_at
FROM main.governance.description_governance
WHERE review_status = 'APPLIED'
ORDER BY applied_at DESC
LIMIT 50;
```

---

## Troubleshooting

### Issue: "Foundation Model API timeout"

**Solution**:
- Increase timeout in `app/main.py`:
  ```python
  response = requests.post(url, headers=headers, json=payload, timeout=60)
  ```
- Use smaller batch sizes (10-25 tables)
- Check Foundation Model endpoint availability

### Issue: "Permission denied on table"

**Solution**:
- Grant necessary permissions:
  ```sql
  GRANT SELECT, MODIFY ON TABLE catalog.schema.table TO `user@example.com`;
  GRANT USE CATALOG ON CATALOG catalog TO `user@example.com`;
  GRANT USE SCHEMA ON SCHEMA catalog.schema TO `user@example.com`;
  ```

### Issue: "Descriptions are too generic"

**Solution**:
- Edit prompts in `app/main.py` to add more context
- Include lineage information in prompts
- Use the larger 405B model for complex tables
- Manually edit descriptions in Review UI before approval

### Issue: "Frontend not loading"

**Solution**:
1. Verify React build completed:
   ```bash
   cd frontend && npm run build
   ```
2. Check that `static/` folder contains built files
3. Restart the Databricks App

### Issue: "No tables found"

**Solution**:
- Verify catalog/schema names
- Check Unity Catalog permissions
- Ensure tables are `MANAGED` type (not `EXTERNAL` or `VIEW`)
- Run:
  ```sql
  SHOW TABLES IN catalog.schema;
  ```

---

## Performance Optimization

### For Large Catalogs (1000+ tables)

1. **Process in batches**:
   - Run generation in batches of 50-100 tables
   - Monitor Foundation Model API rate limits
   - Use off-peak hours for large batches

2. **Parallel processing** (future enhancement):
   - Modify `api_generate` to use threading
   - Be mindful of rate limits

3. **Caching** (future enhancement):
   - Cache sample data queries
   - Store table metadata snapshots

### Cost Management

- **Foundation Model API**: ~$0.001 per description
- **SQL Warehouse**: Serverless recommended for cost efficiency
- **1000 tables estimate**: ~$2-5 in compute costs

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review pending approvals
- Check compliance dashboard
- Monitor reviewer activity

**Monthly**:
- Re-generate descriptions for new tables
- Update descriptions for modified tables
- Review rejected descriptions and improve prompts

**Quarterly**:
- Audit trail export for compliance reporting
- Review and improve AI prompt templates
- Update Foundation Model if better versions available

### Backup Governance Table

```sql
-- Create backup
CREATE TABLE main.governance.description_governance_backup
AS SELECT * FROM main.governance.description_governance;

-- Restore if needed
INSERT INTO main.governance.description_governance
SELECT * FROM main.governance.description_governance_backup
WHERE id NOT IN (SELECT id FROM main.governance.description_governance);
```

---

## Scaling to Multiple Catalogs

To document multiple catalogs:

1. **Deploy separate app instances** (recommended):
   - One app per catalog
   - Easier to manage and monitor

2. **Or use single app**:
   - Change `TARGET_CATALOG` in UI
   - Governance table tracks all catalogs
   - Filter by catalog in queries

---

## Support & Resources

- **Databricks Apps**: https://docs.databricks.com/en/dev-tools/databricks-apps/
- **Foundation Model API**: https://docs.databricks.com/en/machine-learning/foundation-models/
- **Unity Catalog**: https://docs.databricks.com/en/data-governance/unity-catalog/
- **CarMax Internal**: Contact your Databricks Solutions Architect

---

## Next Steps

1. ✅ Deploy the app
2. ✅ Initialize governance table
3. ✅ Generate descriptions for first schema (pilot)
4. ✅ Review and validate quality
5. ✅ Scale to remaining schemas
6. ✅ Monitor compliance dashboard
7. ✅ Train team on review workflow
8. ✅ Schedule regular maintenance

---

**Built for CarMax | Powered by Databricks Foundation Models**
