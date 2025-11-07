# Unity Catalog Description Generator - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   React Frontend (Port 3000)                    │ │
│  │                                                                  │ │
│  │  ├── Dashboard.jsx      (Overview & Stats)                     │ │
│  │  ├── Generate.jsx       (AI Generation UI)                     │ │
│  │  ├── Review.jsx         (Human Approval UI)                    │ │
│  │  └── Compliance.jsx     (Reporting & Audit)                    │ │
│  │                                                                  │ │
│  │  Technologies:                                                  │ │
│  │  • React 18 + React Router                                     │ │
│  │  • TailwindCSS + Framer Motion                                 │ │
│  │  • React Query (data fetching)                                 │ │
│  │  • Recharts (visualizations)                                   │ │
│  │  • Axios (API client)                                          │ │
│  └──────────────────────────┬───────────────────────────────────── │
│                             │ HTTP/REST API                         │
│                             ↓                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   Flask Backend (Port 8080)                     │ │
│  │                                                                  │ │
│  │  ├── API Endpoints:                                            │ │
│  │  │   • POST /api/setup                                         │ │
│  │  │   • POST /api/generate                                      │ │
│  │  │   • POST /api/review/:id                                    │ │
│  │  │   • POST /api/apply                                         │ │
│  │  │   • GET  /api/stats                                         │ │
│  │  │   • GET  /api/pending                                       │ │
│  │  │   • GET  /api/schema-progress                              │ │
│  │  │                                                              │ │
│  │  └── DescriptionService:                                       │ │
│  │      • execute_sql()                                           │ │
│  │      • generate_table_description()                            │ │
│  │      • generate_column_description()                           │ │
│  │      • apply_approved_descriptions()                           │ │
│  │                                                                  │ │
│  │  Technologies:                                                  │ │
│  │  • Flask 3.0                                                   │ │
│  │  • Databricks SDK 0.20                                         │ │
│  │  • Requests (HTTP client)                                      │ │
│  └──────────────────────────┬───────────────────────────────────── │
└────────────────────────────┬┴───────────────────────────────────────┘
                             │
                             │ OAuth Authentication
                             │ (Databricks SDK)
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                    DATABRICKS WORKSPACE                             │
│                                                                      │
│  ┌────────────────────┐        ┌────────────────────┐             │
│  │  Foundation Model  │        │   SQL Warehouse    │             │
│  │       API          │        │   (Serverless)     │             │
│  │                    │        │                    │             │
│  │  Llama 3.1 70B     │        │  Executes:         │             │
│  │  Instruct          │        │  • SELECT queries  │             │
│  │                    │        │  • COMMENT ON      │             │
│  │  Input:            │        │  • ALTER TABLE     │             │
│  │  • Prompts         │        │  • INSERT/UPDATE   │             │
│  │  • Context         │        │                    │             │
│  │                    │        │                    │             │
│  │  Output:           │        │                    │             │
│  │  • Descriptions    │        │                    │             │
│  └──────┬─────────────┘        └──────┬─────────────┘             │
│         │                             │                            │
│         │                             │                            │
│         │                             ↓                            │
│         │              ┌──────────────────────────────────────┐   │
│         │              │       Unity Catalog                   │   │
│         │              │                                       │   │
│         │              │  ┌────────────────────────────────┐ │   │
│         │              │  │  Target Tables                  │ │   │
│         │              │  │  (catalog.schema.table_name)   │ │   │
│         │              │  │                                 │ │   │
│         │              │  │  • table_catalog               │ │   │
│         │              │  │  • table_schema                │ │   │
│         │              │  │  • table_name                  │ │   │
│         │              │  │  • comment ← FINAL OUTPUT      │ │   │
│         │              │  │                                 │ │   │
│         │              │  │  Columns:                       │ │   │
│         │              │  │  • column_name                  │ │   │
│         │              │  │  • data_type                    │ │   │
│         │              │  │  • comment ← FINAL OUTPUT      │ │   │
│         │              │  └────────────────────────────────┘ │   │
│         │              │                                       │   │
│         │              │  ┌────────────────────────────────┐ │   │
│         │              │  │  Governance Table               │ │   │
│         │              │  │  (main.governance.              │ │   │
│         │              │  │   description_governance)       │ │   │
│         │              │  │                                 │ │   │
│         │              │  │  Tracks:                        │ │   │
│         │              │  │  • id (identity)                │ │   │
│         │              │  │  • object_type                  │ │   │
│         │              │  │  • catalog/schema/table/column  │ │   │
│         │              │  │  • ai_generated_description     │ │   │
│         │              │  │  • approved_description         │ │   │
│         │              │  │  • reviewer                     │ │   │
│         │              │  │  • review_status (PENDING/      │ │   │
│         │              │  │    APPROVED/REJECTED/APPLIED)   │ │   │
│         │              │  │  • generated_at                 │ │   │
│         │              │  │  • reviewed_at                  │ │   │
│         │              │  │  • applied_at                   │ │   │
│         │              │  │  • model_used                   │ │   │
│         │              │  └────────────────────────────────┘ │   │
│         │              └──────────────────────────────────────┘   │
│         │                                                          │
│         └──────────────────────────────────────────────────────── │
│                     AI Prompt Flow                                 │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Generate Flow

```
User clicks "Generate"
      ↓
Frontend sends POST /api/generate
  {catalog: "main", schema: "customers", batch_size: 50}
      ↓
Backend: DescriptionService.generate()
      ↓
Query Unity Catalog for tables:
  SELECT table_catalog, table_schema, table_name
  FROM system.information_schema.tables
  WHERE table_catalog = 'main'
      ↓
For each table:
  ├─→ Get column metadata:
  │     SELECT column_name, data_type
  │     FROM system.information_schema.columns
  │
  ├─→ Get sample data:
  │     SELECT * FROM {table} LIMIT 5
  │
  ├─→ Build AI prompt:
  │     "You are a data documentation expert...
  │      Table: main.customers.users
  │      Columns: id (BIGINT), email (STRING), ...
  │      Sample data: [...]
  │      Generate a 1-2 sentence description..."
  │
  ├─→ Call Foundation Model API:
  │     POST /serving-endpoints/llama-3-1-70b/invocations
  │     {messages: [...], max_tokens: 200, temperature: 0.3}
  │
  ├─→ Receive AI response:
  │     "This table contains user account information..."
  │
  └─→ Store in governance table:
        INSERT INTO main.governance.description_governance
        (object_type, catalog_name, schema_name, table_name,
         ai_generated_description, review_status, generated_at)
        VALUES ('TABLE', 'main', 'customers', 'users',
         'This table contains...', 'PENDING', current_timestamp())
      ↓
Repeat for all columns in each table
      ↓
Return results to frontend:
  {total_found: 100, processing: 50, generated: 45, errors: 5}
```

### 2. Review Flow

```
User navigates to Review page
      ↓
Frontend requests GET /api/pending?page=1&per_page=20
      ↓
Backend queries governance table:
  SELECT id, object_type, catalog_name, schema_name, table_name,
         column_name, ai_generated_description, generated_at
  FROM main.governance.description_governance
  WHERE review_status = 'PENDING'
  ORDER BY generated_at DESC
  LIMIT 20 OFFSET 0
      ↓
Frontend displays review cards
      ↓
User edits description (optional)
User enters reviewer name/email
User clicks "Approve"
      ↓
Frontend sends POST /api/review/123
  {status: "APPROVED", approved_description: "...", reviewer: "john@carmax.com"}
      ↓
Backend updates governance table:
  UPDATE main.governance.description_governance
  SET review_status = 'APPROVED',
      approved_description = '...',
      reviewer = 'john@carmax.com',
      reviewed_at = current_timestamp()
  WHERE id = 123
      ↓
Frontend refreshes review queue
```

### 3. Apply Flow

```
User clicks "Apply to UC"
      ↓
Frontend sends POST /api/apply
      ↓
Backend queries approved descriptions:
  SELECT id, object_type, catalog_name, schema_name, table_name,
         column_name, approved_description
  FROM main.governance.description_governance
  WHERE review_status = 'APPROVED' AND applied_at IS NULL
      ↓
For each approved item:

  If TABLE:
    Execute via SQL Warehouse:
      COMMENT ON TABLE main.customers.users
      IS 'This table contains user account information...'

  If COLUMN:
    Execute via SQL Warehouse:
      ALTER TABLE main.customers.users
      ALTER COLUMN email
      COMMENT 'Email address for user login...'
      ↓
  Update governance table:
    UPDATE main.governance.description_governance
    SET review_status = 'APPLIED',
        applied_at = current_timestamp()
    WHERE id = {id}
      ↓
Frontend shows success message:
  {applied: 45, errors: 0}
      ↓
Descriptions now visible in:
  • Databricks Catalog Explorer
  • system.information_schema.tables/columns
  • Data lineage tools
  • Search and discovery
```

## State Diagram

```
┌──────────────┐
│   NOT IN     │
│  GOVERNANCE  │  ← Tables/columns without descriptions
│    TABLE     │
└──────┬───────┘
       │
       │ Generate (AI)
       ↓
┌──────────────┐
│   PENDING    │  ← AI-generated, awaiting human review
│   (YELLOW)   │
└──────┬───────┘
       │
       ├──→ Approve (Human)  ──→ ┌──────────────┐
       │                          │  APPROVED    │
       │                          │  (GREEN)     │
       │                          └──────┬───────┘
       │                                 │
       │                                 │ Apply to UC
       │                                 ↓
       │                          ┌──────────────┐
       │                          │   APPLIED    │  ← Live in Unity Catalog
       │                          │   (BLUE)     │
       │                          └──────────────┘
       │
       └──→ Reject (Human)   ──→ ┌──────────────┐
                                  │  REJECTED    │  ← Needs regeneration
                                  │   (RED)      │
                                  └──────────────┘
```

## Security Model

```
┌────────────────────────────────────────────────────────────┐
│                  Authentication Layer                       │
│                                                             │
│  User → Databricks Workspace (OAuth) → App                │
│         ↓                                                  │
│         WorkspaceClient (Databricks SDK)                   │
│         • Inherits user credentials                        │
│         • No hardcoded tokens                              │
│         • Workspace-level permissions                      │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│                  Authorization Layer                        │
│                                                             │
│  Unity Catalog Permissions:                                │
│  • SELECT on system.information_schema.*                   │
│  • SELECT + MODIFY on target tables                        │
│  • CREATE TABLE on governance schema                       │
│  • USE CATALOG / USE SCHEMA on relevant catalogs/schemas  │
│                                                             │
│  Foundation Model Permissions:                             │
│  • EXECUTE on model endpoints                              │
│                                                             │
│  SQL Warehouse Permissions:                                │
│  • CAN USE on warehouse                                    │
└────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────┐
│                     Audit Layer                             │
│                                                             │
│  Governance Table Tracks:                                  │
│  • Who generated (system + timestamp)                      │
│  • Who reviewed (name/email + timestamp)                   │
│  • Who applied (system + timestamp)                        │
│  • Original AI output                                      │
│  • Final approved version                                  │
│  • Model used                                              │
│                                                             │
│  Query Audit Trail:                                        │
│    SELECT * FROM main.governance.description_governance   │
│    WHERE reviewer IS NOT NULL                              │
│    ORDER BY reviewed_at DESC                               │
└────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────┐
│                 Development Environment                     │
│                                                             │
│  Local Machine:                                            │
│  ├── frontend/ (React + Vite dev server)                  │
│  │   npm run dev → localhost:3000                         │
│  │                                                         │
│  └── app/main.py (Flask dev server)                       │
│      python app/main.py → localhost:8080                  │
│                                                             │
│  Proxy: Vite proxies /api → localhost:8080                │
└────────────────────────────────────────────────────────────┘
         │
         │ npm run build
         ↓
┌────────────────────────────────────────────────────────────┐
│                Production Build                             │
│                                                             │
│  frontend/dist/ → static/                                  │
│  • index.html                                              │
│  • assets/index-abc123.js                                  │
│  • assets/index-def456.css                                 │
│  • carmax-logo.png                                         │
└────────────────────────────────────────────────────────────┘
         │
         │ databricks apps deploy
         ↓
┌────────────────────────────────────────────────────────────┐
│              Databricks Apps (Production)                   │
│                                                             │
│  Container:                                                │
│  • Python 3.9+                                             │
│  • Flask app (serves static + API)                        │
│  • Databricks SDK                                          │
│  • OAuth authentication                                    │
│                                                             │
│  Resources:                                                │
│  • SQL Warehouse (configurable)                            │
│  • Foundation Model endpoints                              │
│  • Unity Catalog access                                    │
│                                                             │
│  Exposed URL:                                              │
│  https://<workspace>/apps/uc-description-generator         │
└────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### AI Generation
- **Throughput**: 20-30 tables/minute
- **Latency**: 2-5 seconds per table
- **Bottleneck**: Foundation Model API rate limits
- **Optimization**: Batch processing, rate limiting

### Review Workflow
- **Throughput**: Variable (human-dependent)
- **Latency**: Minutes to hours
- **Bottleneck**: SME availability
- **Optimization**: Bulk approval, filtered views

### Apply to UC
- **Throughput**: 100+ descriptions/minute
- **Latency**: 0.5 seconds per SQL COMMENT
- **Bottleneck**: SQL Warehouse concurrency
- **Optimization**: Parallel execution (future)

### Dashboard/Reporting
- **Queries**: 5-10 per page load
- **Latency**: 100-500ms per query
- **Bottleneck**: Governance table size
- **Optimization**: Indexes, materialized views (future)

---

**Built for CarMax | Databricks Solution Architecture**
