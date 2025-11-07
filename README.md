# Unity Catalog Description Generator

![CarMax Logo](frontend/src/assets/carmax-logo.png)

**AI-Powered Table & Column Documentation for Compliance**

A production-ready Databricks App that uses Foundation Model API to automatically generate, review, and apply table and column descriptions across Unity Catalog at scale.

---

## 🎯 Overview

This solution addresses CarMax's requirement to document ~1000 tables and columns in Unity Catalog for compliance purposes, using:

- **Foundation Model API** (Llama 3.1 70B) for AI-generated descriptions
- **Human-in-the-loop workflow** for quality assurance
- **Full audit trail** for compliance tracking
- **Modern React UI** for easy review and approval
- **SQL-based updates** (not REST API) for reliability

---

## ✨ Features

### 🤖 AI-Powered Generation
- Automatically generates descriptions using Databricks Foundation Models
- Context-aware prompts include column types, sample data, and table structure
- Batch processing for 1000+ tables
- Customizable AI model selection

### 👥 Human-in-the-Loop Review
- Beautiful UI for reviewing AI-generated descriptions
- Inline editing before approval
- Reviewer tracking for audit trail
- Bulk approval capabilities

### 📊 Compliance Dashboard
- Real-time progress tracking
- Schema-level completion rates
- Interactive charts and visualizations
- Compliance scoring (A-F grade)
- Export capabilities for reporting

### 🔒 Security & Governance
- OAuth authentication via Databricks SDK
- Full audit trail (who, what, when)
- Unity Catalog permission inheritance
- SQL-based updates (governed by UC)

---

## 🏗️ Architecture

```
React Frontend (Vite + TailwindCSS)
           ↓
Flask Backend API (Databricks SDK)
           ↓
    ┌──────┴──────┐
    ↓             ↓
Foundation    Unity Catalog
Model API     (via SQL Warehouse)
```

### Technology Stack

**Frontend**:
- React 18
- TailwindCSS
- Framer Motion
- React Query
- Recharts
- Lucide Icons

**Backend**:
- Flask 3.0
- Databricks SDK 0.20
- Python 3.9+

**Databricks**:
- Foundation Model API (Llama 3.1 70B)
- SQL Warehouse (Serverless/Pro)
- Unity Catalog
- Databricks Apps

---

## 🚀 Quick Start

### Prerequisites

- Databricks workspace with Unity Catalog
- SQL Warehouse (Serverless recommended)
- Foundation Model API access
- Databricks Apps enabled

### Deployment

```bash
# 1. Build React frontend
cd uc-description-app/frontend
npm install
npm run build

# 2. Configure app.yml
# Update warehouse_id with your SQL Warehouse ID

# 3. Deploy to Databricks
databricks apps deploy uc-description-generator \
  --source-code-path ../. \
  --config ../app.yml

# 4. Open the app and click "Initialize Setup"
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📖 User Workflow

### 1. Generate Descriptions

1. Navigate to **Generate** page
2. Enter catalog name (e.g., `main`)
3. Optionally specify schema
4. Set batch size (50 recommended)
5. Click **Generate**

**Result**: AI generates descriptions for tables and columns, stored in `main.governance.description_governance`

### 2. Review & Approve

1. Navigate to **Review** page
2. Browse AI-generated descriptions
3. Edit if needed (click pencil icon)
4. Enter your name/email as reviewer
5. Click **Approve** or **Reject**

**Result**: Descriptions marked as `APPROVED` and ready to apply

### 3. Apply to Unity Catalog

1. Navigate to **Dashboard**
2. Click **Apply to UC** button
3. Confirm

**Result**: Descriptions applied via SQL `COMMENT ON` statements, visible in Catalog Explorer

### 4. Monitor Compliance

1. Navigate to **Compliance** page
2. View:
   - Overall compliance score
   - Progress by schema
   - Coverage details
   - Reviewer activity

---

## 🎨 UI Screenshots

### Dashboard
![Dashboard](docs/dashboard-screenshot.png)
- Real-time statistics
- Progress tracking
- Quick actions
- Schema-level overview

### Generate
![Generate](docs/generate-screenshot.png)
- Batch processing configuration
- AI model selection
- Results summary

### Review
![Review](docs/review-screenshot.png)
- Side-by-side review cards
- Inline editing
- One-click approval/rejection
- Filter by object type

### Compliance
![Compliance](docs/compliance-screenshot.png)
- Compliance scoring
- Interactive charts
- Schema progress table
- Audit trail

---

## 🗄️ Database Schema

### Governance Table

```sql
CREATE TABLE main.governance.description_governance (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    object_type STRING,                    -- 'TABLE' or 'COLUMN'
    catalog_name STRING,
    schema_name STRING,
    table_name STRING,
    column_name STRING,                    -- NULL for tables
    column_data_type STRING,
    ai_generated_description STRING,       -- Original AI output
    approved_description STRING,           -- Final approved version
    reviewer STRING,                       -- Who reviewed
    review_status STRING,                  -- PENDING/APPROVED/REJECTED/APPLIED
    generated_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    applied_at TIMESTAMP,
    model_used STRING,                     -- e.g., 'llama-3-1-70b-instruct'
    generation_error STRING,
    confidence_score DOUBLE
);
```

---

## 🔧 Configuration

### Environment Variables

```bash
TARGET_CATALOG=main
GOVERNANCE_SCHEMA=governance
MODEL_ENDPOINT=databricks-meta-llama-3-1-70b-instruct
WAREHOUSE_ID=your-warehouse-id
FLASK_SECRET_KEY=your-secret-key
```

### Customizing AI Prompts

Edit `app/main.py`:

```python
def generate_table_description(self, catalog, schema, table):
    prompt = f"""You are a data documentation expert...

    Table: {catalog}.{schema}.{table}

    Columns:
    {columns_info}

    Sample data:
    {sample_info}

    Generate a 1-2 sentence description...
    """

    return self.call_foundation_model(prompt)
```

### Changing AI Model

1. Update `MODEL_ENDPOINT` environment variable
2. Available models:
   - `databricks-meta-llama-3-1-70b-instruct` (Recommended)
   - `databricks-dbrx-instruct`
   - `databricks-meta-llama-3-1-405b-instruct` (For complex tables)

---

## 📊 Performance

### Benchmarks

- **Generation**: ~2-5 seconds per table (including columns)
- **Review**: Manual (depends on SME availability)
- **Application**: ~0.5 seconds per SQL COMMENT
- **1000 tables**: ~1-2 hours generation + review time + 10 min application

### Cost Estimates (1000 tables)

- **Foundation Model API**: ~$2-3
- **SQL Warehouse (Serverless)**: ~$1-2
- **Total**: **~$3-5 per run**

---

## 🔐 Security & Compliance

### Authentication
- ✅ OAuth-based (Databricks SDK)
- ✅ No hardcoded credentials
- ✅ Workspace-level access control

### Authorization
- ✅ Inherits Unity Catalog permissions
- ✅ Users can only document tables they have access to
- ✅ Governance table has full audit trail

### Audit Trail
Every action is tracked:
- Who generated (system + timestamp)
- Who reviewed (name/email + timestamp)
- Who applied (system + timestamp)
- Original AI output
- Final approved version
- Model used

### Query Audit Trail

```sql
-- Reviewer activity
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
ORDER BY applied_at DESC;
```

---

## 🛠️ Development

### Local Development

```bash
# Backend (Flask)
cd uc-description-app
pip install -r requirements.txt
python app/main.py

# Frontend (React)
cd frontend
npm install
npm run dev  # Starts Vite dev server on port 3000
```

### Project Structure

```
uc-description-app/
├── app/
│   └── main.py              # Flask backend + API
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Generate.jsx
│   │   │   ├── Review.jsx
│   │   │   └── Compliance.jsx
│   │   ├── services/
│   │   │   └── api.js       # API client
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── static/                  # Built React app (after npm run build)
├── templates/               # Flask templates
├── app.yml                  # Databricks App config
├── requirements.txt
├── README.md
└── DEPLOYMENT.md
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Foundation Model API timeout**
```python
# Increase timeout in app/main.py
response = requests.post(url, headers=headers, json=payload, timeout=60)
```

**2. Permission denied**
```sql
GRANT SELECT, MODIFY ON TABLE catalog.schema.table TO `user@example.com`;
```

**3. Descriptions too generic**
- Edit prompts to include more context
- Use larger model (405B)
- Manually edit in Review UI

**4. Frontend not loading**
```bash
cd frontend && npm run build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting tips.

---

## 📈 Roadmap

### Phase 1 (Current)
- ✅ AI-powered description generation
- ✅ Human review workflow
- ✅ Compliance dashboard
- ✅ Audit trail

### Phase 2 (Future)
- ⬜ Bulk CSV import/export
- ⬜ Scheduled regeneration for new tables
- ⬜ Slack/email notifications for reviewers
- ⬜ Description quality scoring
- ⬜ Integration with data lineage

### Phase 3 (Future)
- ⬜ Multi-language descriptions
- ⬜ Auto-approval based on confidence scores
- ⬜ Integration with external documentation systems
- ⬜ Custom AI model fine-tuning

---

## 🤝 Contributing

This is an internal CarMax project. For questions or support:

1. Contact your Databricks Solutions Architect
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Check Databricks documentation:
   - [Databricks Apps](https://docs.databricks.com/en/dev-tools/databricks-apps/)
   - [Foundation Models](https://docs.databricks.com/en/machine-learning/foundation-models/)
   - [Unity Catalog](https://docs.databricks.com/en/data-governance/unity-catalog/)

---

## 📄 License

Internal use only - CarMax proprietary

---

## 🙏 Acknowledgments

- **CarMax** for the business requirement
- **Databricks** for Foundation Model API and Unity Catalog
- **Community** for React, TailwindCSS, and open-source libraries

---

**Built for CarMax | Powered by Databricks Foundation Models**

---

## 📞 Support

For technical support:
- **Internal**: Contact CarMax Data Platform team
- **Databricks**: Your Solutions Architect
- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

*Last Updated: 2025-11-07*
