# Unity Catalog Description Generator

An AI-powered web application for generating and managing Unity Catalog table and column descriptions with human-in-the-loop review workflow.

## 📚 Documentation

- **README.md** (this file) - Quick start and technical reference
- **[User Guide](docs/User_Guide.md)** - Complete step-by-step guide for end users
- **[MCP vs UC Description Generator](docs/MCP_vs_UC_Description_Generator_Technical_Overview.md)** - Technical comparison with Model Context Protocol approach

## Features

- **AI-Powered Generation**: Uses Databricks SQL AI Functions with Llama 3.3 70B to generate intelligent descriptions
- **Interactive UI**: Modern React interface for catalog/schema/table navigation
- **Human-in-the-Loop**: Review and approve/edit/reject AI-generated descriptions
- **Governance Tracking**: Stores all descriptions with metadata in a governance table
- **Bulk Operations**: Generate descriptions for multiple tables at once
- **Permission Checking**: Validates user permissions before operations
- **Compliance Dashboard**: Track coverage and approval metrics

## Architecture

### Tech Stack

- **Backend**: Flask + Databricks SDK
- **Frontend**: React 18 + TailwindCSS + Framer Motion + Recharts
- **AI**: Databricks SQL AI Functions (`ai_query()`)
- **Deployment**: Databricks Apps with DABs (Databricks Asset Bundles)

### Key Components

- **Flask API** (`app/main.py`): REST API for UC operations and AI generation
- **React UI** (`frontend/src/`): Single-page application for user interaction
- **SQL AI Functions**: Uses `ai_query()` for generation (no REST API calls needed)
- **Governance Table**: `main.governance.description_governance` stores all generated descriptions

## Prerequisites

- Databricks workspace (AWS, Azure, or GCP)
- SQL Warehouse with access to Unity Catalog
- Databricks CLI installed and configured
- Node.js 18+ (for frontend development)
- Python 3.9+ (for local development)

## Quick Start

### 1. Setup Governance Table

Run the setup SQL to create the governance schema and table:

```sql
-- Create governance schema
CREATE SCHEMA IF NOT EXISTS main.governance;

-- Create governance table
CREATE TABLE IF NOT EXISTS main.governance.description_governance (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    object_type STRING NOT NULL,
    catalog_name STRING NOT NULL,
    schema_name STRING NOT NULL,
    table_name STRING,
    column_name STRING,
    data_type STRING,
    generated_description STRING NOT NULL,
    approved_description STRING,
    review_status STRING DEFAULT 'PENDING',
    reviewer STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    metadata STRING
);
```

### 2. Configure Application

Update `app.yml` with your warehouse ID:

```yaml
resources:
  - name: warehouse
    warehouse:
      id: "your-warehouse-id"  # Replace with your SQL Warehouse ID

env:
  - name: WAREHOUSE_ID
    value: "your-warehouse-id"  # Replace with your SQL Warehouse ID
```

### 3. Build Frontend

```bash
cd frontend
npm install
npm run build
```

### 4. Deploy to Databricks

```bash
# Deploy using Databricks CLI
databricks apps deploy uc-description-generator \
  --source-code-path /Workspace/Users/your.email@company.com/uc-description-app \
  --profile your-profile
```

Or use DABs:

```bash
# Deploy with bundle
databricks bundle deploy -t dev
```

### 5. Grant Permissions

Grant the app's service principal necessary permissions. First, get your service principal ID:

```bash
# Get the service principal client ID
databricks apps get uc-description-generator --profile your-profile | grep service_principal_client_id
```

Then grant the required permissions:

```sql
-- 1. Grant warehouse access (REQUIRED)
GRANT USAGE ON WAREHOUSE `your-warehouse-name` TO `service-principal-id`;

-- 2. Grant governance table access (REQUIRED)
GRANT USAGE ON CATALOG main TO `service-principal-id`;
GRANT USAGE ON SCHEMA main.governance TO `service-principal-id`;
GRANT ALL PRIVILEGES ON TABLE main.governance.description_governance TO `service-principal-id`;

-- 3. Grant access to catalogs/schemas you want to document (REQUIRED)
-- The service principal needs SELECT (to read metadata) and MODIFY (to set comments)
-- on all tables you want to document. Examples:

-- Option A: Grant on entire catalog (easiest)
GRANT USAGE ON CATALOG your_catalog TO `service-principal-id`;
GRANT SELECT ON CATALOG your_catalog TO `service-principal-id`;
GRANT MODIFY ON CATALOG your_catalog TO `service-principal-id`;

-- Option B: Grant on specific schema
GRANT USAGE ON CATALOG your_catalog TO `service-principal-id`;
GRANT USAGE ON SCHEMA your_catalog.your_schema TO `service-principal-id`;
GRANT SELECT ON SCHEMA your_catalog.your_schema TO `service-principal-id`;
GRANT MODIFY ON SCHEMA your_catalog.your_schema TO `service-principal-id`;

-- Option C: Grant on specific table (most restrictive)
GRANT USAGE ON CATALOG your_catalog TO `service-principal-id`;
GRANT USAGE ON SCHEMA your_catalog.your_schema TO `service-principal-id`;
GRANT SELECT ON TABLE your_catalog.your_schema.your_table TO `service-principal-id`;
GRANT MODIFY ON TABLE your_catalog.your_schema.your_table TO `service-principal-id`;
```

**Notes**:
- `MODIFY` permission is required to set table and column comments. Without it, the apply step will fail.
- SQL AI Functions (`ai_query()`) do not require special permissions - they work automatically through warehouse access. No additional grants needed for the AI model.

## Usage

### Generate Descriptions

1. Navigate to the **Generate** page
2. Select catalog and schema
3. Select specific tables (or leave empty for all)
4. Click **Generate Descriptions**
5. AI will generate descriptions for tables and their columns

### Review Descriptions

1. Navigate to the **Review** page
2. Browse pending descriptions
3. For each description:
   - **Approve**: Accept as-is
   - **Edit & Approve**: Modify and approve
   - **Reject**: Reject the description

### Apply to Unity Catalog

1. Navigate to the **Compliance** page
2. Click **Apply Approved Descriptions**
3. Approved descriptions will be written to Unity Catalog using `COMMENT` statements

### Monitor Progress

The **Dashboard** page shows:
- Coverage metrics by schema
- Review activity over time
- Top documented catalogs
- Overall statistics

## How It Works

### AI Generation Process

1. **Metadata Collection**: App queries `system.information_schema` for table/column metadata
2. **Sample Data**: Retrieves sample rows for context
3. **AI Generation**: Uses SQL AI Functions:
   ```sql
   SELECT ai_query(
     'databricks-meta-llama-3-3-70b-instruct',
     'Generate a description for table X with columns Y...'
   ) as response
   ```
4. **Storage**: Saves generated descriptions to governance table with `PENDING` status

### Review Workflow

1. User reviews generated descriptions in the UI
2. Can approve, edit, or reject each description
3. Approved descriptions are marked with `APPROVED` status
4. Reviewer name and timestamp are recorded

### Application to UC

1. App reads all `APPROVED` descriptions from governance table
2. Executes `COMMENT` statements:
   ```sql
   COMMENT ON TABLE catalog.schema.table IS 'description';
   COMMENT ON COLUMN catalog.schema.table.column IS 'description';
   ```
3. Marks as applied in governance table

## Configuration

### Environment Variables (app.yml)

- `TARGET_CATALOG`: Default catalog for operations (default: `main`)
- `GOVERNANCE_SCHEMA`: Schema for governance table (default: `governance`)
- `MODEL_ENDPOINT`: AI model endpoint (default: `databricks-meta-llama-3-3-70b-instruct`)
- `WAREHOUSE_ID`: SQL Warehouse ID (required)
- `FLASK_SECRET_KEY`: Flask session secret (required)

### Metadata-Only Mode (No Sample Data)

By default, the app retrieves **5 sample rows** from each table to provide context for better AI-generated descriptions. If you have **PII/sensitive data concerns** or prefer metadata-only generation, you can disable sample data collection.

**To enable metadata-only mode:**

Edit `app/main.py` around line 296-302 and comment out or remove the sample data collection:

```python
# Get sample data (safely) - DISABLED FOR METADATA-ONLY MODE
sample_data = []
# try:
#     sample_query = f"SELECT * FROM {catalog}.{schema}.{table} LIMIT 5"
#     sample_data = self.execute_sql(sample_query)
# except:
#     pass
```

**Trade-offs:**
- ✅ **More secure**: No actual data is processed by the AI model
- ✅ **Faster**: Skips data retrieval queries
- ✅ **Compliance-friendly**: Only column names and types are analyzed
- ⚠️ **Lower quality**: Descriptions may be less accurate without data context
- ⚠️ **Generic descriptions**: AI relies only on naming conventions

**Recommendation:** Use metadata-only mode for highly sensitive data. For general use cases, sample data significantly improves description quality.

### Databricks Bundle (databricks.yml)

```yaml
bundle:
  name: uc-description-generator

targets:
  dev:
    mode: development
    workspace:
      host: https://your-workspace.cloud.databricks.com
      profile: your-profile

    resources:
      apps:
        uc_description_generator_app:
          name: uc-description-generator
          description: "UC Description Generator"
          source_code_path: .
```

## Development

### Local Frontend Development

```bash
cd frontend
npm install
npm run dev  # Starts dev server on http://localhost:5173
```

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
export DATABRICKS_TOKEN=your-token
export WAREHOUSE_ID=your-warehouse-id
export FLASK_SECRET_KEY=your-secret-key

# Run Flask app
python -m app.main
```

### Project Structure

```
uc-description-app/
├── app/
│   └── main.py              # Flask backend + AI generation logic
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages (Dashboard, Generate, Review, Compliance)
│   │   ├── components/      # Reusable React components
│   │   └── services/        # API client
│   └── vite.config.js       # Vite build configuration
├── static/                  # Built frontend assets (generated)
├── app.yml                  # Databricks App configuration
├── databricks.yml           # DABs bundle configuration
├── requirements.txt         # Python dependencies
├── setup_governance.sql     # Database setup script
└── README.md               # This file
```

## Troubleshooting

### "Model endpoint does not exist"

Update `MODEL_ENDPOINT` in `app.yml` to an available Foundation Model endpoint:

```bash
# List available endpoints
databricks serving-endpoints list | grep databricks
```

### "Permission denied" errors

Ensure the service principal has proper grants:
- Warehouse usage
- Catalog/schema/table access
- Governance table permissions

### "Table not found" errors

Run the governance table setup SQL script first.

## Security Considerations

- **Authentication**: App uses service principal authentication (app authorization)
- **No user credentials stored**: All API calls use the app's service principal identity
- **Data privacy**: By default, app reads 5 sample rows for AI context. See "Metadata-Only Mode" section to disable this for sensitive data
- **SQL injection prevention**: All queries use parameterized statements and input validation
- **Secret management**: FLASK_SECRET_KEY should be a secure random value in production (never commit to git)
- **Audit trail**: All reviews are logged with reviewer name and timestamp in governance table

## Performance & Cost

### Performance
- Table listing queries exclude correlated subqueries for speed
- Batch generation processes multiple tables in parallel
- SQL AI Functions execute directly in the warehouse (no network overhead)
- Frontend uses React Query for efficient caching

### Cost Estimates
Typical usage costs approximately **$10-25/month** depending on volume:

- **SQL Warehouse**: DBUs per second for query execution (~$0.50/DBU for SQL Pro)
- **Foundation Model API**: Pay-per-token for Llama 3.3 70B (~$15 per 1M tokens)
- **Databricks App**: Minimal hosting overhead

**Example**: Generating 1,000 descriptions/month ≈ $15-20 total cost

For detailed cost analysis, see [Cost Breakdown](#when-to-use-each-approach) section.

## Alternative Approaches (No UI)

If you don't need the web interface, you can use Databricks SQL AI Functions directly for simpler, lightweight documentation workflows.

### Option 1: Direct SQL AI Functions

Execute AI functions directly in Databricks SQL or notebooks:

```sql
-- Generate table description
SELECT ai_query(
  'databricks-meta-llama-3-3-70b-instruct',
  CONCAT(
    'Generate a concise 1-2 sentence description for a database table named ',
    table_name,
    ' with columns: ',
    columns_list,
    '. Explain its business purpose.'
  )
) as description
FROM your_metadata_query;

-- Apply description
COMMENT ON TABLE catalog.schema.table_name IS 'Your generated description';
```

**Pros:** Simple, no deployment needed
**Cons:** No workflow, no governance tracking, manual process

### Option 2: Databricks Workflows

Create a Databricks Workflow (Job) that runs on a schedule:

```python
# notebook: generate_descriptions.py
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()

# Query tables needing descriptions
tables = w.statement_execution.execute_statement(
    statement="""
    SELECT table_catalog, table_schema, table_name, comment
    FROM system.information_schema.tables
    WHERE comment IS NULL OR comment = ''
    """,
    warehouse_id=warehouse_id
)

# Generate and apply descriptions
for table in tables:
    # Generate with AI
    description = w.statement_execution.execute_statement(
        statement=f"""
        SELECT ai_query(
            'databricks-meta-llama-3-3-70b-instruct',
            'Generate description for table {table.table_name}...'
        )
        """,
        warehouse_id=warehouse_id
    )

    # Apply to UC
    w.statement_execution.execute_statement(
        statement=f"""
        COMMENT ON TABLE {table.table_catalog}.{table.table_schema}.{table.table_name}
        IS '{description}'
        """,
        warehouse_id=warehouse_id
    )
```

Schedule this workflow to run weekly/monthly for continuous documentation.

**Pros:** Automated, scheduled, serverless
**Cons:** No human review, no governance UI, limited error handling

### Option 3: Custom MCP Servers

For power users with Claude Desktop or other LLM clients, build custom Model Context Protocol servers:

1. **Unity Catalog MCP** - Read metadata, write descriptions
2. **Foundation Model MCP** - Generate descriptions via AI
3. **Governance MCP** - Track reviews and compliance

See `docs/MCP_vs_UC_Description_Generator_Technical_Overview.md` for detailed implementation guide.

**Pros:** Natural language interaction, flexible workflows
**Cons:** Complex setup, requires MCP knowledge, no persistent UI

### When to Use Each Approach

| Approach | Best For | Complexity |
|----------|----------|-----------|
| **UC Description Generator (this app)** | Enterprise teams, compliance-driven, human-in-the-loop workflows | Medium |
| **Direct SQL AI Functions** | Quick one-off documentation, simple use cases | Low |
| **Databricks Workflows** | Automated scheduled documentation, no UI needed | Medium |
| **Custom MCP Servers** | Power users, ad-hoc exploration, developer workflows | High |

## Future Enhancements

- [ ] Support for more AI models
- [ ] Custom prompt templates
- [ ] Scheduled batch generation
- [ ] Integration with data quality checks
- [ ] Export descriptions to documentation systems
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact your Databricks account team

---

**Built with ❤️ using Databricks Apps, SQL AI Functions, and React**
