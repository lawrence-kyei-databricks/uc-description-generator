# Unity Catalog Description Generator
## User Guide

**Version:** 1.0
**Last Updated:** November 11, 2025
**Application URL:** https://your-workspace.databricksapps.com/uc-description-generator

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Generating Descriptions](#generating-descriptions)
5. [Reviewing Descriptions](#reviewing-descriptions)
6. [Applying Descriptions](#applying-descriptions)
7. [Compliance & Reporting](#compliance--reporting)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

### What is the Unity Catalog Description Generator?

The Unity Catalog Description Generator is an AI-powered application that helps you create, review, and manage descriptions for your Unity Catalog tables and columns at scale.

### Key Features

- 🤖 **AI-Powered Generation**: Uses Databricks Foundation Models (Llama 3.3 70B) to generate intelligent descriptions
- ✅ **Human Review Workflow**: Approve, edit, or reject AI-generated descriptions before applying them
- 📊 **Compliance Dashboard**: Track documentation coverage and compliance metrics
- ⚡ **Batch Operations**: Document hundreds or thousands of tables with a few clicks
- 📝 **Audit Trail**: Complete history of who generated, reviewed, and applied each description
- 🎯 **Real-time Updates**: See changes immediately with optimistic UI updates

### Who Should Use This App?

- **Data Engineers**: Document data pipelines and tables
- **Data Stewards**: Ensure catalog documentation quality and compliance
- **Data Governance Teams**: Maintain metadata standards and audit trails
- **Analytics Teams**: Improve data discoverability for business users

---

## Getting Started

### Accessing the Application

1. Navigate to your Databricks workspace
2. Click on **Apps** in the left sidebar
3. Find **UC Description Generator** in the list
4. Click to open the application

**Direct URL:** `https://your-workspace.databricksapps.com/uc-description-generator`

### First Time Setup

When you first access the application, the system automatically:
- ✅ Connects to your Unity Catalog
- ✅ Verifies permissions
- ✅ Initializes the governance tracking table

**No manual setup required!**

### Navigation

The application has four main sections:

```
┌─────────────────────────────────────────┐
│  Navigation Bar                         │
├─────────────────────────────────────────┤
│  📊 Dashboard    → Overview & metrics   │
│  ✨ Generate     → Create descriptions  │
│  ✅ Review       → Approve/reject       │
│  📈 Compliance   → Apply & report       │
└─────────────────────────────────────────┘
```

---

## Dashboard Overview

### Purpose

The Dashboard provides a high-level overview of your documentation progress and quick access to common actions.

### Key Metrics

![Dashboard Screenshot]

#### 1. **Total Descriptions**
- Shows total number of descriptions generated
- Color-coded by status (Pending, Approved, Rejected, Applied)

#### 2. **Coverage by Schema**
- Visual breakdown of documentation coverage
- Identify which schemas need more documentation

#### 3. **Recent Activity**
- Latest generated descriptions
- Recent review actions
- System notifications

### Quick Actions

The Dashboard provides quick action cards:

#### **Generate New Descriptions**
- Click to jump to Generate page
- Start documenting new tables

#### **Review Pending**
- Shows count of pending reviews
- Click to go to Review page

#### **Apply to UC**
- Apply approved descriptions to Unity Catalog
- Only enabled when approved descriptions exist

#### **View Reports**
- Access compliance reports
- Export documentation metrics

---

## Generating Descriptions

### Step-by-Step Guide

#### Step 1: Navigate to Generate Page

Click **Generate** in the navigation bar.

#### Step 2: Select Catalog

1. Click the **Catalog** dropdown
2. Select the catalog you want to document
3. Wait for schemas to load

**Example:** `main`, `dev`, `prod_analytics`

#### Step 3: Select Schema

1. Click the **Schema** dropdown
2. Select the schema containing your tables
3. Wait for tables to load

**Example:** `sales`, `marketing`, `customer_360`

#### Step 4: Select Tables (Optional)

Two options:

**Option A: Generate for All Tables**
- Leave the **Tables** field empty
- All tables in the schema will be documented

**Option B: Generate for Specific Tables**
- Click the **Tables** dropdown
- Select specific tables from the list
- Multiple selection supported

**Example:** Select `orders`, `customers`, `products`

#### Step 5: Check Permissions

Before generating, the app automatically checks:
- ✅ Can read table metadata
- ✅ Can write to governance table
- ✅ Has access to AI models

If permissions are missing, you'll see an error message with instructions.

#### Step 6: Generate Descriptions

1. Click **Generate Descriptions** button
2. Watch the progress indicator
3. AI generates descriptions for:
   - Table-level descriptions
   - All column descriptions

**Time Estimate:**
- Single table: ~2-5 seconds
- 10 tables: ~30 seconds
- 100 tables: ~5-10 minutes

#### Step 7: Review Results

When generation completes, you'll see:
- ✅ Success message with count
- 📊 Summary of generated items
- 🔗 Link to Review page

---

### What Gets Generated?

#### Table Description

The AI analyzes:
- Table name
- Column names and data types
- Sample data (if available)
- Existing comments (if any)

**Example Output:**
```
Table: sales.orders
Description: "Customer purchase orders including line items,
pricing, shipping details, and fulfillment status. Updates
daily at 2 AM UTC."
```

#### Column Descriptions

For each column, the AI generates:
- Purpose and meaning
- Data type explanation
- Value examples (when relevant)
- Business context

**Example Output:**
```
Column: order_status
Type: STRING
Description: "Current order state indicating fulfillment
progress. Valid values: PENDING, PROCESSING, SHIPPED,
DELIVERED, CANCELLED, RETURNED."
```

---

### Generation Settings

#### AI Model

**Default Model:** `databricks-meta-llama-3-3-70b-instruct`

This model is optimized for:
- Technical documentation
- Data schema understanding
- Business context generation

#### Sample Data

By default, the AI uses:
- ✅ Column names
- ✅ Data types
- ❌ Actual data values (for privacy)

**Note:** Sample data access can be configured by administrators.

---

### Tips for Better Results

#### ✅ Do:
- Use descriptive table and column names
- Document schemas with related tables together
- Review AI suggestions before approving

#### ❌ Avoid:
- Generating for tables with PII without review
- Applying descriptions without human verification
- Documenting deprecated tables

---

## Reviewing Descriptions

### Overview

The Review page is where you approve, edit, or reject AI-generated descriptions before they're applied to Unity Catalog.

### Review Workflow

```
AI Generates → Review Queue → Human Decision → Governance Table
                                    ↓
                        ┌───────────┼───────────┐
                        ↓           ↓           ↓
                    Approve      Edit +      Reject
                                Approve
                        ↓           ↓           ↓
                    Ready to   Ready to    Not applied
                     Apply       Apply
```

---

### Step-by-Step Review Process

#### Step 1: Navigate to Review Page

Click **Review** in the navigation bar.

#### Step 2: Filter Items (Optional)

Use the filter buttons to focus on specific types:
- **All** - Show everything
- **Table** - Only table descriptions
- **Column** - Only column descriptions

**Current Filters:** Count updates in real-time

#### Step 3: Review Each Item

Each review card shows:

```
┌─────────────────────────────────────────┐
│ 📊 TABLE: main.sales.orders             │
│ Status: PENDING                          │
├─────────────────────────────────────────┤
│ AI Generated Description:                │
│ "Customer purchase orders including..."  │
│                                          │
│ [Edit Button]                            │
├─────────────────────────────────────────┤
│ Generated: 2025-11-11 10:30 AM          │
│ Model: llama-3-3-70b                    │
├─────────────────────────────────────────┤
│ Reviewer Name/Email: [Input Field]      │
├─────────────────────────────────────────┤
│ [✅ Approve]  [❌ Reject]                │
└─────────────────────────────────────────┘
```

#### Step 4: Read the Description

Carefully review the AI-generated description:
- ✅ Is it accurate?
- ✅ Does it provide useful context?
- ✅ Is the language clear and professional?
- ✅ Does it follow your organization's standards?

#### Step 5: Edit (If Needed)

To modify the description:

1. Click **Edit** button
2. Text area becomes editable
3. Make your changes
4. Click **Edit** again to stop editing (or just approve)

**Common Edits:**
- Fix technical inaccuracies
- Add business context
- Improve clarity
- Remove sensitive information
- Standardize terminology

#### Step 6: Enter Your Name

**Required for Audit Trail:**

Enter your name or email in the **Reviewer Name/Email** field.

**Examples:**
- `john.doe@company.com`
- `John Doe`
- `J. Doe - Data Team`

**Why Required:**
- Audit trail for compliance
- Accountability for approvals
- Track reviewer activity

#### Step 7: Make Decision

Choose one of two actions:

##### ✅ **Approve**

Click the **Approve** button to:
- Accept the description (as-is or after edits)
- Mark as ready to apply to Unity Catalog
- Move to "Approved" status

**Result:** Description will be applied when you run "Apply to UC"

##### ❌ **Reject**

Click the **Reject** button to:
- Decline the AI-generated description
- Mark as not suitable for Unity Catalog
- Remove from the apply queue

**Confirmation:** You'll be asked to confirm rejection

**Result:** Description will NOT be applied

#### Step 8: Watch Real-Time Updates

After approval/rejection:
- ✅ Card disappears immediately (optimistic update)
- 📊 Pending count decreases
- ✨ Smooth animation

**If error occurs:** Card reappears with error message

---

### Review Page Features

#### Real-Time Updates

The UI updates instantly when you:
- Approve a description
- Reject a description
- Edit content

**No page refresh needed!**

#### Pagination

When you have many pending reviews:
- View 20 items per page
- Use **Previous** / **Next** buttons
- Current page number shown

#### Bulk Review (Coming Soon)

Future feature:
- Select multiple items
- Approve/reject in batch
- Export to CSV for offline review

---

### Review Best Practices

#### Quality Checks

Before approving, verify:

✅ **Accuracy**
- Description matches actual table/column purpose
- Technical details are correct
- No outdated information

✅ **Completeness**
- Key information is included
- Business context is clear
- Examples are relevant

✅ **Clarity**
- Language is clear and concise
- Technical jargon is explained
- Business users can understand

✅ **Compliance**
- No sensitive information disclosed
- Follows organizational standards
- Appropriate classification level

#### When to Reject

Reject descriptions that:
- ❌ Contain inaccurate information
- ❌ Are too vague or generic
- ❌ Include sensitive data
- ❌ Don't follow standards
- ❌ Are for deprecated tables

#### Editing Guidelines

When editing:
- ✅ Preserve the AI's structure
- ✅ Add specific business context
- ✅ Fix technical errors
- ✅ Improve clarity
- ❌ Don't completely rewrite (regenerate instead)

---

## Applying Descriptions

### Overview

Once descriptions are approved, you can apply them to Unity Catalog. This writes the descriptions to the actual catalog metadata where users and tools (like Genie) can access them.

---

### Two Ways to Apply

#### Method 1: Dashboard "Apply to UC" Card

1. Go to **Dashboard**
2. Find the **"Apply to UC"** card
3. Shows count of approved descriptions
4. Click the card
5. Confirm the action
6. Watch progress

#### Method 2: Compliance Page Button

1. Go to **Compliance** page
2. Click **"Apply X Approved"** button (top right)
3. Confirm the action
4. Watch progress

---

### Step-by-Step Application Process

#### Step 1: Navigate to Apply

Use either method above to access the apply function.

#### Step 2: Review Summary

Before applying, you'll see:
- 📊 Number of approved descriptions
- 📋 List of affected tables/columns
- ⚠️ Any warnings or issues

**Example:**
```
Ready to apply 45 approved descriptions:
- 5 table descriptions
- 40 column descriptions

Catalogs affected:
- main (3 tables)
- analytics (2 tables)
```

#### Step 3: Confirm Application

Click **Apply** and confirm when prompted.

**Confirmation Dialog:**
```
Apply 45 approved descriptions to Unity Catalog?

This will update table and column comments in Unity Catalog.
This action requires MODIFY permission on the tables.

[Cancel] [Apply]
```

#### Step 4: Watch Progress

The system shows:
- ⏳ Progress indicator
- 📊 Count of applied descriptions
- ✅ Success messages
- ❌ Any errors

**Example Progress:**
```
Applying descriptions to Unity Catalog...

Progress: 23 / 45 (51%)

✅ Applied: main.sales.orders (table)
✅ Applied: main.sales.orders.order_id (column)
✅ Applied: main.sales.orders.customer_id (column)
...
```

#### Step 5: Review Results

When complete, you'll see:
- ✅ Total applied successfully
- ❌ Any errors (with details)
- 📊 Updated statistics

**Success Message:**
```
✅ Successfully applied 45 descriptions!

Results:
- 45 applied successfully
- 0 errors

Your Unity Catalog has been updated.
```

---

### What Happens When You Apply?

#### Behind the Scenes

For each approved description, the system:

1. **Validates permissions**
   - Checks MODIFY permission on table
   - Verifies catalog access

2. **Executes SQL commands**
   - Table: `COMMENT ON TABLE catalog.schema.table IS 'description'`
   - Column: `COMMENT ON COLUMN catalog.schema.table.column IS 'description'`

3. **Updates governance table**
   - Marks as `APPLIED`
   - Records timestamp
   - Saves metadata

4. **Logs audit trail**
   - Who applied
   - When applied
   - What was applied

#### Permissions Required

To apply descriptions, the app needs:
- ✅ `USAGE` on catalog
- ✅ `USAGE` on schema
- ✅ `SELECT` on table (to read metadata)
- ✅ `MODIFY` on table (to set comments)

**Note:** Administrators should grant these permissions to the app's service principal.

---

### Viewing Applied Descriptions

After applying, descriptions are visible in:

#### 1. **Unity Catalog UI**

**In Catalog Explorer:**
1. Navigate to **Catalog** in Databricks
2. Browse to your table
3. Click on table name
4. Description appears in details panel
5. Click columns to see column descriptions

**Note:** You may need to expand collapsed sections (▶ arrow) to see descriptions.

#### 2. **Data Explorer**

**In Data Explorer:**
1. Navigate to **Data** in Databricks
2. Browse to your table
3. View descriptions in **Details** tab
4. Column descriptions shown in schema view

#### 3. **SQL Queries**

**Using DESCRIBE:**
```sql
-- See table description
DESCRIBE TABLE EXTENDED main.sales.orders;

-- See column descriptions
DESCRIBE TABLE main.sales.orders;
```

**Using Information Schema:**
```sql
-- Query table comments
SELECT table_name, comment
FROM system.information_schema.tables
WHERE table_catalog = 'main'
  AND table_schema = 'sales';

-- Query column comments
SELECT column_name, comment
FROM system.information_schema.columns
WHERE table_catalog = 'main'
  AND table_schema = 'sales'
  AND table_name = 'orders';
```

#### 4. **Genie (AI/BI)**

Genie automatically uses your descriptions to:
- Better understand data structure
- Generate more accurate SQL queries
- Provide context to business users

**Example:**
```
User: "Show me pending orders"

Genie (uses descriptions):
- Reads order_status column description
- Understands "PENDING" is a valid status
- Generates: SELECT * FROM orders WHERE order_status = 'PENDING'
```

---

### Troubleshooting Apply Issues

#### Common Errors

##### Error: "Permission denied"

**Cause:** App doesn't have MODIFY permission on table

**Solution:**
```sql
GRANT MODIFY ON TABLE catalog.schema.table
TO `service-principal-id`;
```

##### Error: "Table not found"

**Cause:** Table was deleted or renamed

**Solution:**
- Verify table still exists
- Regenerate descriptions if needed
- Remove stale entries from governance table

##### Error: "Invalid description format"

**Cause:** Description contains special characters

**Solution:**
- Edit description to remove problematic characters
- The app auto-escapes most characters

#### Partial Success

If some descriptions apply and others fail:
- ✅ Successfully applied descriptions are marked `APPLIED`
- ❌ Failed descriptions remain `APPROVED`
- You can retry applying failed items

**View Errors:**
Check application logs for detailed error messages.

---

## Compliance & Reporting

### Overview

The Compliance page provides visibility into your documentation coverage, quality metrics, and compliance status.

---

### Key Metrics

#### 1. **Compliance Score**

Large grade display (A, B, C, D, F):
- **A (90-100%)**: Excellent coverage
- **B (80-89%)**: Good coverage
- **C (70-79%)**: Fair coverage
- **D (60-69%)**: Needs improvement
- **F (<60%)**: Poor coverage

**Calculation:**
```
Score = (Applied Descriptions / Total Items) × 100
```

#### 2. **Tables Documented**

Count of tables with descriptions applied.

#### 3. **Columns Documented**

Count of columns with descriptions applied.

#### 4. **Status Distribution**

Pie chart showing:
- 🟢 Applied (green)
- 🟡 Approved (yellow)
- 🔴 Pending (red)
- ⚫ Rejected (gray)

---

### Schema Progress

Table showing documentation progress by schema:

| Schema | Total Items | Completed | Pending | Progress | Status |
|--------|-------------|-----------|---------|----------|--------|
| sales | 250 | 230 | 20 | 92% | ✅ On Track |
| marketing | 180 | 120 | 60 | 67% | ⚠️ In Progress |
| finance | 95 | 45 | 50 | 47% | ❌ Needs Attention |

**Color Coding:**
- 🟢 100%: Complete
- 🔵 75-99%: On Track
- 🟡 50-74%: In Progress
- 🔴 <50%: Needs Attention

---

### Review Activity

Timeline showing:
- Recent approvals
- Recent rejections
- Application events
- User activity

---

### Compliance Recommendations

The system provides actionable recommendations:

**Example Recommendations:**
```
⚠️ 45 descriptions pending review
   → Prioritize review workflow

⚠️ Schema 'legacy_data' has low completion (23%)
   → Consider generating more descriptions

✅ All descriptions tracked with full audit trail
   → Compliance-ready for audits
```

---

### Exporting Reports

#### Export Coverage Report

1. Click **Export Report** button
2. Choose format (CSV, PDF)
3. Download file

**Report Contents:**
- Schema-by-schema coverage
- Timestamp and user info
- Compliance metrics
- Trend data

#### Export Audit Trail

Query the governance table directly:

```sql
SELECT
  object_type,
  catalog_name,
  schema_name,
  table_name,
  column_name,
  review_status,
  reviewer,
  generated_at,
  reviewed_at,
  applied_at
FROM main.governance.description_governance
WHERE applied_at >= CURRENT_DATE - INTERVAL 30 DAYS
ORDER BY applied_at DESC;
```

---

### Compliance Features

#### Audit Trail

Every action is logged:
- ✅ Who generated the description
- ✅ When it was generated
- ✅ Who reviewed it
- ✅ What decision was made
- ✅ When it was applied
- ✅ What changes were made

**Compliance Standards Supported:**
- SOC 2
- ISO 27001
- GDPR
- HIPAA
- SOX

#### Change Tracking

The governance table maintains:
- Original AI-generated description
- Human-edited description (if modified)
- Reviewer identity
- Full timestamp history

#### Access Control

Documentation actions are controlled by:
- Unity Catalog permissions
- Service principal security
- Role-based access

---

## Best Practices

### Documentation Standards

#### Writing Style

✅ **Do:**
- Use clear, concise language
- Define technical terms
- Include business context
- Provide examples when helpful
- Use consistent terminology

❌ **Don't:**
- Use jargon without explanation
- Write overly long descriptions
- Include sensitive information
- Use abbreviations without defining them

#### Content Guidelines

**Table Descriptions Should Include:**
- Purpose of the table
- Key business entities stored
- Update frequency
- Data source
- Important relationships

**Example:**
```
"Customer order transactions including line items,
pricing, and fulfillment status. Updated in real-time
from e-commerce platform. Links to customers and
products tables."
```

**Column Descriptions Should Include:**
- What the column represents
- Data type explanation
- Valid values or ranges
- Business meaning
- Relationships to other columns

**Example:**
```
"Unique identifier for each order assigned at creation.
Integer auto-increment starting from 1000000. Used
as foreign key in order_items and shipments tables."
```

---

### Workflow Best Practices

#### 1. **Start Small**

When first using the app:
- Document one schema completely
- Review and refine your process
- Expand to additional schemas
- Scale gradually

#### 2. **Batch Similar Tables**

Group related tables for generation:
- Process entire domains together (e.g., all sales tables)
- Maintain consistency in descriptions
- Review related tables in context

#### 3. **Regular Review Cycles**

Establish a review rhythm:
- Daily: Review new generations
- Weekly: Apply approved descriptions
- Monthly: Review coverage metrics
- Quarterly: Update existing descriptions

#### 4. **Assign Reviewers**

Designate subject matter experts:
- Sales tables → Sales data team
- Finance tables → Finance analysts
- Marketing tables → Marketing ops

#### 5. **Quality Over Speed**

Take time to:
- Read descriptions carefully
- Edit for accuracy and clarity
- Ensure compliance with standards
- Don't rush approvals

---

### Team Collaboration

#### Roles & Responsibilities

**Data Engineers:**
- Generate descriptions for new tables
- Initial technical review
- Apply descriptions to UC

**Data Stewards:**
- Final approval of descriptions
- Enforce standards
- Monitor compliance

**Business Analysts:**
- Add business context
- Review for clarity
- Validate accuracy

**Data Governance Team:**
- Set documentation standards
- Monitor audit trail
- Generate compliance reports

---

### Maintenance

#### Regular Tasks

**Weekly:**
- Review pending items
- Apply approved descriptions
- Check error logs

**Monthly:**
- Review coverage metrics
- Update documentation standards
- Generate compliance reports

**Quarterly:**
- Audit applied descriptions
- Update stale descriptions
- Train new team members

---

## Troubleshooting

### Common Issues

#### Issue: "No catalogs showing in dropdown"

**Possible Causes:**
- No Unity Catalog access
- Permission issues
- Network connectivity

**Solution:**
1. Verify Unity Catalog permissions
2. Check service principal grants
3. Contact administrator

---

#### Issue: "Generation fails with timeout"

**Possible Causes:**
- Large number of tables
- Complex table schemas
- Warehouse performance

**Solution:**
1. Generate fewer tables at once
2. Use smaller batches (10-20 tables)
3. Check warehouse size/performance

---

#### Issue: "Descriptions not showing in UI"

**Possible Causes:**
- Unity Catalog UI caching
- Browser cache
- Descriptions not applied

**Solution:**
1. Verify descriptions were applied (check Compliance page)
2. Clear browser cache (hard refresh: Ctrl+Shift+R)
3. Check in SQL using DESCRIBE command
4. Open Unity Catalog in private/incognito window
5. Look for collapsed sections (▶ arrow) in UI

---

#### Issue: "Apply failed with permission error"

**Possible Causes:**
- Missing MODIFY permission
- Service principal not granted access
- Catalog/schema restrictions

**Solution:**
1. Check permissions:
```sql
SHOW GRANTS ON TABLE catalog.schema.table;
```

2. Grant required permissions:
```sql
GRANT MODIFY ON TABLE catalog.schema.table
TO `service-principal-id`;
```

3. Contact Unity Catalog administrator

---

#### Issue: "Can't approve - 'Please enter reviewer name'"

**Cause:** Reviewer name field is empty

**Solution:**
1. Enter your name or email in the "Reviewer Name/Email" field
2. Required for audit trail
3. Then click Approve

---

#### Issue: "Approved descriptions disappear but not applied"

**Cause:** May have been rejected or failed to apply

**Solution:**
1. Check Compliance page for status
2. Look for error messages in logs
3. Try applying again from Compliance page

---

### Getting Help

#### Application Logs

View detailed logs in Databricks Apps console:
1. Go to Apps in Databricks
2. Click on UC Description Generator
3. Click **Logs** tab
4. Search for errors or warnings

#### Support Channels

- **Technical Issues:** Create GitHub issue
- **Feature Requests:** GitHub discussions
- **Enterprise Support:** Contact Databricks account team
- **Documentation:** See README.md

---

## FAQ

### General Questions

**Q: How much does it cost to use the app?**

A: The app is included with Databricks Apps. You only pay for:
- SQL Warehouse compute (for queries)
- Storage for governance table (minimal)

---

**Q: Can multiple people use the app at the same time?**

A: Yes! The app supports concurrent users. Each user can:
- Generate descriptions independently
- Review different items
- See real-time updates

---

**Q: Is my data sent to external services?**

A: No. Everything runs within your Databricks workspace:
- AI models run in your workspace (SQL AI Functions)
- No data leaves your environment
- No external API calls

---

**Q: Can I customize the AI prompts?**

A: Currently, AI prompts are built-in. Future versions may support:
- Custom prompt templates
- Industry-specific terminology
- Organization-specific guidelines

---

### Technical Questions

**Q: Which AI model is used?**

A: Databricks Foundation Model: `databricks-meta-llama-3-3-70b-instruct`

This is optimized for technical documentation and data understanding.

---

**Q: Does the AI see my actual data?**

A: By default, no. The AI uses:
- ✅ Table and column names
- ✅ Data types
- ❌ Actual data values (unless configured)

---

**Q: What permissions does the app need?**

A: The app's service principal needs:
- `USAGE` on warehouse
- `USAGE` on catalogs/schemas
- `SELECT` on tables (to read metadata)
- `MODIFY` on tables (to set comments)
- Full access to governance table

---

**Q: Where are descriptions stored before applying?**

A: In the governance table: `main.governance.description_governance`

This provides:
- Audit trail
- Review history
- Metadata tracking

---

### Workflow Questions

**Q: Can I edit descriptions after they're applied?**

A: Yes. Two options:
1. Edit in Unity Catalog UI directly
2. Generate new description and approve

The governance table keeps history of changes.

---

**Q: What happens if I reject a description?**

A: The description is:
- Marked as REJECTED
- Not applied to Unity Catalog
- Kept in governance table for audit
- Can be regenerated later

---

**Q: Can I bulk approve multiple descriptions?**

A: Not yet. Currently reviews are individual.

**Workaround:** Use filters to focus on specific types (tables vs columns).

**Future:** Bulk approval feature planned.

---

**Q: How do I update descriptions for existing documented tables?**

A: Two approaches:

1. **Regenerate:**
   - Generate new descriptions
   - Review and approve
   - Apply (overwrites old)

2. **Manual Edit:**
   - Edit directly in Unity Catalog UI
   - Changes not tracked in governance table

---

### Compliance Questions

**Q: Is there an audit trail?**

A: Yes! The governance table tracks:
- Who generated each description
- Who reviewed it
- What decision was made (approve/reject)
- When it was applied
- All timestamps

---

**Q: Can I export audit reports?**

A: Yes. Two methods:
1. Use "Export Report" button in Compliance page
2. Query governance table directly in SQL

---

**Q: Does this meet compliance requirements (SOC 2, HIPAA, etc.)?**

A: Yes. The app provides:
- ✅ Complete audit trail
- ✅ Change tracking
- ✅ Access control (via Unity Catalog)
- ✅ Data residency (all in your workspace)
- ✅ No external data transfer

Consult your compliance team for specific requirements.

---

**Q: Who can see the governance table?**

A: Access is controlled by Unity Catalog permissions.

Typically granted to:
- Data governance team
- Auditors
- Compliance officers
- Administrators

---

### Integration Questions

**Q: Does this work with Genie?**

A: Yes! Genie automatically uses your Unity Catalog descriptions to:
- Better understand your data
- Generate more accurate SQL
- Provide context to users

Better descriptions = Better Genie results.

---

**Q: Can I use this with other BI tools?**

A: Yes! Descriptions written to Unity Catalog are available to:
- Tableau
- Power BI
- Looker
- Any tool reading UC metadata

---

**Q: Can I integrate this with my approval workflow (Jira, ServiceNow)?**

A: Not directly in current version.

**Workarounds:**
- Export pending items to CSV
- Review in external system
- Import approvals back

**Future:** API endpoints for custom integrations.

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + D` | Go to Dashboard |
| `Alt + G` | Go to Generate |
| `Alt + R` | Go to Review |
| `Alt + C` | Go to Compliance |
| `Esc` | Close dialogs |

---

### Status Definitions

| Status | Meaning | Next Action |
|--------|---------|-------------|
| **PENDING** | AI generated, awaiting review | Review and approve/reject |
| **APPROVED** | Reviewed and approved | Apply to Unity Catalog |
| **REJECTED** | Reviewed and rejected | Regenerate or skip |
| **APPLIED** | Written to Unity Catalog | View in UC UI |

---

### Glossary

| Term | Definition |
|------|------------|
| **Unity Catalog** | Databricks unified governance solution |
| **Service Principal** | Non-human identity for app authentication |
| **Governance Table** | Database table storing metadata audit trail |
| **SQL AI Functions** | Databricks functions for running AI models via SQL |
| **Optimistic Update** | UI updates immediately before server confirms |

---

### Support Contact

**Questions or Issues?**

- 📧 Email: support@yourcompany.com
- 💬 Slack: #uc-description-generator
- 📝 GitHub: [Create Issue](https://github.com/your-repo/issues)
- 📚 Docs: See README.md

---

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2025 | Initial release with core features |

---

**Document End**

Thank you for using the Unity Catalog Description Generator! 🚀
