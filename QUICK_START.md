# Quick Start Guide - UC Description Generator

## 🚀 5-Minute Setup

### Step 1: Deploy (2 minutes)

```bash
cd uc-description-app
./deploy.sh
```

Enter when prompted:
- Workspace URL: `https://your-workspace.cloud.databricks.com`
- Warehouse ID: `abc123def456` (get from SQL Warehouses page)
- Catalog: `main` (or your target catalog)
- Schema: `governance` (where tracking table will be created)
- Model: `databricks-meta-llama-3-1-70b-instruct` (or press Enter for default)

**Result**: App deployed and URL returned

### Step 2: Initialize (1 minute)

1. Open the app URL from deployment
2. Click **"Initialize Setup"** on dashboard
3. Wait for confirmation

**Result**: Governance table created at `main.governance.description_governance`

### Step 3: Generate (30 seconds)

1. Click **"Generate"** in navigation
2. Enter catalog: `main`
3. Leave schema empty (for all schemas) or specify one
4. Set batch size: `10` (for testing)
5. Click **"Generate Descriptions"**

**Result**: 10 tables processed, descriptions stored

### Step 4: Review (1 minute)

1. Click **"Review"** in navigation
2. Browse AI-generated descriptions
3. For one description:
   - Click pencil icon to edit (optional)
   - Enter your name/email
   - Click **"Approve"**

**Result**: Description approved and ready to apply

### Step 5: Apply (30 seconds)

1. Click **"Dashboard"**
2. Click **"Apply to UC"** button
3. Confirm

**Result**: Approved description(s) now live in Unity Catalog!

---

## ✅ Verify It Worked

### Check in Databricks

```sql
-- View in Catalog Explorer
-- Navigate to: Data > Catalog > main > [schema] > [table]
-- Description should appear at top

-- Or query directly:
SELECT table_schema, table_name, comment
FROM system.information_schema.tables
WHERE table_catalog = 'main'
  AND comment IS NOT NULL
ORDER BY table_name;

-- Check governance table
SELECT *
FROM main.governance.description_governance
ORDER BY generated_at DESC
LIMIT 10;
```

---

## 📋 Common Tasks

### Generate for Specific Schema

```
Dashboard → Generate
  Catalog: main
  Schema: sales
  Batch: 50
  → Click "Generate"
```

### Approve All Pending in Schema

```sql
-- Review first, then:
UPDATE main.governance.description_governance
SET
  review_status = 'APPROVED',
  approved_description = ai_generated_description,
  reviewer = 'your.name@carmax.com',
  reviewed_at = current_timestamp()
WHERE review_status = 'PENDING'
  AND schema_name = 'sales';
```

Then: Dashboard → Apply to UC

### Check Progress

```
Dashboard → Compliance
  • View overall score
  • Check schema breakdown
  • Export reports
```

### Re-generate for New Tables

```
Dashboard → Generate
  (same settings as before)
  → Only generates for tables without descriptions
```

---

## 🎯 Best Practices

### For Pilot

1. **Start small**: Generate for 1 schema first (10-20 tables)
2. **Validate quality**: Review AI descriptions carefully
3. **Iterate prompts**: Edit `app/main.py` if descriptions are too generic
4. **Train reviewers**: Show SMEs how to use Review page
5. **Document process**: Create internal wiki/guide

### For Scale

1. **Batch processing**: Generate 50-100 tables at a time
2. **Review SLAs**: Set expectations for SME review time
3. **Quality thresholds**: Only approve descriptions that meet standards
4. **Schedule refreshes**: Run monthly for new tables
5. **Monitor compliance**: Weekly checks on progress

---

## 🔧 Configuration

### Change AI Model

```bash
# Edit app.yml
env:
  - name: MODEL_ENDPOINT
    value: "databricks-meta-llama-3-1-405b-instruct"  # Larger model

# Redeploy
databricks apps deploy uc-description-generator --config app.yml
```

### Change Target Catalog

```bash
# Edit app.yml
env:
  - name: TARGET_CATALOG
    value: "production"  # Different catalog

# Redeploy
databricks apps deploy uc-description-generator --config app.yml
```

### Customize Prompts

Edit `app/main.py`:

```python
def generate_table_description(self, catalog, schema, table):
    prompt = f"""[Your custom prompt here]

    Include business context:
    - Data source: ERP system
    - Update frequency: Daily
    - Compliance level: PII

    Table: {catalog}.{schema}.{table}
    ...
    """
```

---

## 🐛 Troubleshooting

### Issue: "Permission denied"

**Fix**: Grant permissions
```sql
GRANT USE CATALOG ON CATALOG main TO `your.user@carmax.com`;
GRANT USE SCHEMA ON SCHEMA main.governance TO `your.user@carmax.com`;
GRANT CREATE TABLE ON SCHEMA main.governance TO `your.user@carmax.com`;
```

### Issue: "Foundation Model timeout"

**Fix 1**: Use smaller batch size (10-25 instead of 50)

**Fix 2**: Increase timeout in `app/main.py`:
```python
response = requests.post(url, headers=headers, json=payload, timeout=60)
```

### Issue: "Descriptions too generic"

**Fix 1**: Edit descriptions in Review page before approving

**Fix 2**: Customize prompts in `app/main.py` with more context

**Fix 3**: Use larger model (405B) for complex tables

### Issue: "App not loading"

**Fix**: Rebuild frontend
```bash
cd frontend
npm run build
cd ..
databricks apps deploy uc-description-generator --config app.yml
```

---

## 📊 Metrics to Track

### Week 1
- Tables processed: **Target 100**
- Approval rate: **Target >80%**
- Time per review: **Track average**

### Month 1
- Total documented: **Target 1000**
- Compliance score: **Target B+**
- Reviewer activity: **Track who's active**

### Quarter 1
- Coverage: **Target 100% of critical tables**
- Compliance score: **Target A**
- Process documented: **Internal wiki complete**

---

## 📞 Need Help?

### Documentation
- **README.md**: Full feature overview
- **DEPLOYMENT.md**: Detailed deployment guide
- **ARCHITECTURE.md**: Technical architecture
- **SOLUTION_SUMMARY.md**: Executive summary

### Support
- **Databricks Docs**: https://docs.databricks.com/
- **CarMax Team**: Contact Data Platform team
- **Solutions Architect**: Your Databricks contact

---

## 🎓 Training Materials

### For Reviewers (SMEs)

**5-Minute Training**:
1. Show Review page
2. Explain: "Green = Approve, Red = Reject"
3. Demo: Edit description, enter name, click Approve
4. Show: Compliance dashboard to see progress

### For Admins

**15-Minute Training**:
1. Show entire workflow (Generate → Review → Apply)
2. Explain governance table and audit trail
3. Demo SQL queries for reporting
4. Show how to customize prompts
5. Review troubleshooting guide

---

## 🔄 Maintenance Schedule

### Daily
- ✅ Check for pending reviews
- ✅ Monitor error logs

### Weekly
- ✅ Review compliance dashboard
- ✅ Check reviewer activity
- ✅ Generate for new tables

### Monthly
- ✅ Audit trail export
- ✅ Update documentation
- ✅ Review and improve prompts

### Quarterly
- ✅ Major version updates
- ✅ Add new features
- ✅ Expand to new catalogs

---

## 💡 Pro Tips

1. **Start with one schema**: Validate before scaling
2. **Involve SMEs early**: Get feedback on description quality
3. **Edit before approving**: AI is good but not perfect
4. **Track metrics**: Use Compliance dashboard regularly
5. **Document internally**: Create CarMax-specific guide
6. **Schedule reviews**: Set aside time for SME review
7. **Automate refreshes**: Run monthly for new tables
8. **Export for compliance**: Regular audit reports
9. **Share success**: Show time savings to stakeholders
10. **Iterate**: Improve prompts based on feedback

---

**Built for CarMax | Powered by Databricks Foundation Models**

*Last Updated: 2025-11-07*
