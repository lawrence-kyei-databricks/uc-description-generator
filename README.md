# Unity Catalog Description Generator

<div align="center">

**AI-Powered Table & Column Documentation for Unity Catalog**

[![Databricks](https://img.shields.io/badge/Databricks-FF3621?style=for-the-badge&logo=databricks&logoColor=white)](https://databricks.com)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Screenshots](#screenshots) • [Deploy](#deployment)

</div>

---

## Overview

A production-ready Databricks App that automatically generates, reviews, and applies table and column descriptions across Unity Catalog at scale using Foundation Model API (Llama 3.1 70B).

**Use Case**: Document 1000+ tables for compliance
**Deployment**: Databricks Apps with DABs support

---

## Features

### AI-Powered Generation
- Automatically generates descriptions using Databricks Foundation Models
- Context-aware prompts with column types, sample data, and table structure
- Batch processing for 1000+ tables
- Multiple model support (Llama 3.1 70B, DBRX, 405B)

### Dynamic Selection
- **Catalog dropdown**: Select any accessible catalog
- **Schema dropdown**: Filtered by selected catalog
- **Table selection**: Bulk mode OR specific table checkboxes
- Real-time permission validation

### Human-in-the-Loop Review
- Beautiful UI for reviewing AI-generated descriptions
- Inline editing before approval
- Reviewer tracking for audit trail
- One-click approve/reject

### Permission Checking
- Automatic validation of UC permissions
- Visual feedback (green = access granted, red = denied)
- Shows current user identity
- Lists specific permission errors

### Compliance Dashboard
- Real-time progress tracking
- A-F compliance scoring
- Interactive charts and visualizations
- Schema-level completion rates
- Export capabilities

### Deployment Options
- **DABs**: Modern, CI/CD-friendly deployment
- **Multi-workspace**: Regional deployment support
- **Environment management**: Dev/staging/prod separation

---

## Architecture

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

**Technology Stack**:
- **Frontend**: React 18, TailwindCSS, Framer Motion, Recharts, React Query
- **Backend**: Flask 3.0, Databricks SDK 0.20, Python 3.9+
- **AI**: Foundation Model API (Llama 3.1 70B)
- **Database**: Unity Catalog + Governance Table
- **Deployment**: Databricks Apps, DABs

---

## Quick Start

### Prerequisites
- Databricks workspace with Unity Catalog
- SQL Warehouse (Serverless recommended)
- Foundation Model API access
- Node.js 18+ (for building frontend)
- Databricks CLI

### Deploy with DABs (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/lawrence-kyei-databricks/uc-description-generator.git
cd uc-description-generator

# 2. Build frontend
cd frontend
npm install
npm run build
cd ..

# 3. Configure
cp databricks.dev.yml databricks.prod.yml
# Edit databricks.prod.yml with your warehouse ID

# 4. Deploy
databricks bundle deploy --target prod

# 5. Get app URL
databricks apps get uc-description-generator-prod
```

### Deploy with Legacy Script

```bash
./deploy.sh
# Follow interactive prompts
```

---

## Documentation

### Getting Started
- **[README.md](README.md)** - Complete feature overview
- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command cheat sheet

### Deployment
- **[DABS_DEPLOYMENT.md](DABS_DEPLOYMENT.md)** - DABs deployment guide (500+ lines)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment instructions
- **[GLOBAL_DEPLOYMENT_SUMMARY.md](GLOBAL_DEPLOYMENT_SUMMARY.md)** - Global deployment strategies

### Technical
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture & data flow
- **[UI_GUIDE.md](UI_GUIDE.md)** - UI design system & layouts
- **[PROJECT_INDEX.md](PROJECT_INDEX.md)** - Complete file structure

### Executive
- **[SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)** - Business overview & ROI

---

## Screenshots

### Dashboard
![Dashboard](docs/dashboard.png)
*Real-time statistics, progress tracking, and quick actions*

### Generate
![Generate](docs/generate.png)
*Dynamic catalog/schema/table selection with permission checking*

### Review
![Review](docs/review.png)
*Human approval workflow with inline editing*

### Compliance
![Compliance](docs/compliance.png)
*Compliance scoring, charts, and audit trail*

---

## Workflow

```
1. SELECT CATALOG/SCHEMA → 2. CHECK PERMISSIONS → 3. CHOOSE MODE → 4. GENERATE
                                                      ↓
                    ← 7. MONITOR COMPLIANCE ← 6. APPLY TO UC ← 5. REVIEW & APPROVE
```

### Detailed Steps

1. **Select Target**: Choose catalog and schema from dropdowns
2. **Check Permissions**: Automatic validation (green = access granted)
3. **Choose Mode**:
   - **Bulk**: All tables in schema
   - **Select**: Pick specific tables
4. **Generate**: AI creates descriptions using Foundation Model API
5. **Review**: Human approves/edits descriptions
6. **Apply**: Descriptions applied to Unity Catalog via SQL
7. **Monitor**: Track progress on compliance dashboard

---

## Global Deployment

### Single Workspace, Multi-Catalog
```bash
# Deploy once
databricks bundle deploy --target prod

# Users select catalog/schema in UI:
# - sales_catalog (Sales team)
# - finance_catalog (Finance team)
# - operations_catalog (Operations team)
```

### Multi-Workspace (Regional)
```bash
# US Region
databricks bundle deploy --target prod --profile us-prod

# EU Region
databricks bundle deploy --target prod --profile eu-prod

# APAC Region
databricks bundle deploy --target prod --profile apac-prod
```

---

## Security & Compliance

### Authentication
- OAuth-based authentication via Databricks SDK
- No hardcoded credentials
- Workspace-level access control

### Authorization
- Inherits Unity Catalog permissions
- Real-time permission checking
- Users can only document tables they have access to

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
SELECT
  reviewer,
  COUNT(*) as items_reviewed,
  MIN(reviewed_at) as first_review,
  MAX(reviewed_at) as last_review
FROM main.governance.description_governance
WHERE reviewer IS NOT NULL
GROUP BY reviewer;
```

---

## Performance

- **Generation**: ~2-5 seconds per table (including columns)
- **Review**: Manual (depends on SME availability)
- **Application**: ~0.5 seconds per SQL COMMENT
- **1000 tables**: ~1-2 hours generation + review time + 10 min application

### Cost Estimates
- **Foundation Model API**: ~$2-3 per 1000 tables
- **SQL Warehouse (Serverless)**: ~$1-2 per 1000 tables
- **Total**: **~$3-5 per 1000 tables**

---

## Use Cases

### Multi-Tenant Organization
```
Finance Team → Select "finance_catalog"
Sales Team → Select "sales_catalog"
Operations Team → Select "operations_catalog"
```

### Progressive Rollout
```
Week 1: Document "sales" schema (bulk mode)
Week 2: Update specific tables in "customers" schema (select mode)
Week 3: Document "orders" schema (bulk mode)
```

### Global Deployment
```
US Region → Deploy to us-workspace
EU Region → Deploy to eu-workspace
APAC Region → Deploy to apac-workspace
```

---

## Configuration

### Environment Variables

```yaml
# databricks.prod.yml
variables:
  warehouse_id: "your-warehouse-id"
  target_catalog: "main"  # Default (changeable in UI)
  governance_schema: "governance"
  model_endpoint: "databricks-meta-llama-3-1-70b-instruct"
  flask_secret_key: "${secrets/scope/flask_secret_key}"
```

### Customize AI Model

```python
# app/main.py
MODEL_ENDPOINT = "databricks-meta-llama-3-1-405b-instruct"  # Larger model

# Or via environment variable
MODEL_ENDPOINT = os.environ.get('MODEL_ENDPOINT', 'databricks-dbrx-instruct')
```

---

## Troubleshooting

### Permission Denied
```sql
GRANT USE CATALOG ON CATALOG main TO `user@company.com`;
GRANT USE SCHEMA ON SCHEMA main.governance TO `user@company.com`;
GRANT SELECT, MODIFY ON SCHEMA main.* TO `user@company.com`;
```

### Frontend Not Loading
```bash
cd frontend && npm run build && cd ..
databricks bundle deploy --target dev
```

### Foundation Model Timeout
```python
# Edit app/main.py
response = requests.post(url, headers=headers, json=payload, timeout=60)
```

---

## Roadmap

### Phase 1 (Current)
- AI-powered description generation
- Dynamic catalog/schema/table selection
- Permission checking
- Human review workflow
- Compliance dashboard
- DABs deployment

### Phase 2 (Planned)
- Bulk CSV import/export
- Scheduled regeneration
- Slack/email notifications
- Description quality scoring
- Multi-language support

### Phase 3 (Future)
- Auto-approval based on confidence
- Data lineage integration
- Custom model fine-tuning
- Advanced analytics

---

## Contributing

For questions or improvements:

1. Create an issue
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

---

## License

Apache 2.0

---

## Acknowledgments

- **Databricks** - Foundation Model API and Unity Catalog
- **Open Source Community** - React, TailwindCSS, and dependencies

---

## Support

### Documentation
- Full documentation in repository
- API reference in `ARCHITECTURE.md`
- Troubleshooting in `DEPLOYMENT.md`

### Contact
- **Databricks**: Your Solutions Architect
- **Issues**: [GitHub Issues](https://github.com/lawrence-kyei-databricks/uc-description-generator/issues)

---

## Success Metrics

- **95% time savings** vs manual documentation
- **1000+ tables** documented at scale
- **Single deployment** works globally
- **Full audit trail** for compliance
- **Modern UI** for great user experience

---

<div align="center">

**Powered by Databricks Foundation Models**

[Back to Top](#unity-catalog-description-generator)

</div>
