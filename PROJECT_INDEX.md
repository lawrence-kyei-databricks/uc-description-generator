# Project Index - UC Description Generator

## 📁 Complete File Structure

```
uc-description-app/
│
├── 📄 Documentation
│   ├── README.md                  # Project overview and features
│   ├── DEPLOYMENT.md              # Detailed deployment instructions
│   ├── QUICK_START.md             # 5-minute quick start guide
│   ├── ARCHITECTURE.md            # Technical architecture details
│   ├── UI_GUIDE.md                # User interface guide with mockups
│   └── PROJECT_INDEX.md           # This file
│
├── 🚀 Deployment
│   ├── deploy.sh                  # One-command deployment script
│   ├── app.yml                    # Databricks App configuration
│   └── requirements.txt           # Python dependencies
│
├── 🔧 Backend (Flask API)
│   └── app/
│       └── main.py                # Flask app + DescriptionService class
│                                  # • API endpoints
│                                  # • Foundation Model integration
│                                  # • SQL execution
│                                  # • OAuth authentication
│
├── 🎨 Frontend (React App)
│   └── frontend/
│       ├── package.json           # Node dependencies
│       ├── vite.config.js         # Vite build configuration
│       ├── tailwind.config.js     # TailwindCSS configuration
│       ├── postcss.config.js      # PostCSS configuration
│       │
│       └── src/
│           ├── main.jsx           # React app entry point
│           ├── App.jsx            # Main app component + routing
│           ├── index.css          # Global styles + Tailwind
│           │
│           ├── components/
│           │   └── Layout.jsx     # Navigation bar + footer
│           │
│           ├── pages/
│           │   ├── Dashboard.jsx  # Main dashboard with stats
│           │   ├── Generate.jsx   # AI generation interface
│           │   ├── Review.jsx     # Human approval workflow
│           │   └── Compliance.jsx # Compliance tracking & reports
│           │
│           ├── services/
│           │   └── api.js         # API client (Axios)
│           │
│           └── assets/
│               └── carmax-logo.png # CarMax branding
│
├── 📊 Static Assets (Generated)
│   └── static/                    # Built React app (after npm run build)
│       ├── index.html
│       ├── assets/
│       │   ├── index-[hash].js
│       │   └── index-[hash].css
│       └── carmax-logo.png
│
└── 📝 Templates
    └── templates/                 # Flask templates (if needed)
```

---

## 📚 Documentation Guide

### For First-Time Users
**Start here**: `README.md`
- What is this project?
- Key features
- Screenshots
- Quick overview

**Then**: `QUICK_START.md`
- 5-minute deployment
- Basic usage
- Common tasks

### For Deployment
**Primary**: `DEPLOYMENT.md`
- Prerequisites
- Step-by-step deployment
- Configuration options
- Troubleshooting
- Security & compliance

**Quick Deploy**: `deploy.sh`
- One-command deployment
- Interactive prompts
- Automatic setup

### For Technical Understanding
**Architecture**: `ARCHITECTURE.md`
- System architecture diagrams
- Data flow
- API endpoints
- Security model
- Performance characteristics

**UI Design**: `UI_GUIDE.md`
- Page layouts
- Component library
- Design system
- Responsive design
- Accessibility

### For Developers
**Backend**: `app/main.py`
- Flask API implementation
- DescriptionService class
- Foundation Model integration
- SQL execution logic

**Frontend**: `frontend/src/`
- React components
- API client
- State management
- Styling

---

## 🔑 Key Files Explained

### Backend

#### `app/main.py` (550+ lines)
**Purpose**: Flask backend API and business logic

**Key Classes**:
- `DescriptionService`: Main service class
  - `execute_sql()`: Execute SQL via Statement Execution API
  - `generate_table_description()`: Generate descriptions using AI
  - `generate_column_description()`: Generate column descriptions
  - `apply_approved_descriptions()`: Apply to Unity Catalog

**API Endpoints**:
```python
POST /api/setup                  # Create governance table
POST /api/generate               # Generate AI descriptions
POST /api/review/:id             # Update review status
POST /api/apply                  # Apply to Unity Catalog
GET  /api/stats                  # Get statistics
GET  /api/pending                # Get pending reviews
GET  /api/schema-progress        # Get progress by schema
GET  /api/review-activity        # Get reviewer activity
GET  /api/coverage               # Get current UC coverage
```

**Dependencies**:
- Flask 3.0
- Databricks SDK 0.20
- Requests (for Foundation Model API)

---

### Frontend

#### `frontend/src/pages/Dashboard.jsx` (~200 lines)
**Purpose**: Main landing page with statistics and overview

**Features**:
- Real-time stats display
- Progress bar animation
- Schema progress chart
- Quick action buttons
- Initialize setup button

**Key Components**:
- `StatCard`: Individual stat display
- Charts: Recharts bar chart
- Quick action grid

#### `frontend/src/pages/Generate.jsx` (~150 lines)
**Purpose**: AI description generation interface

**Features**:
- Configuration form (catalog, schema, batch size)
- Generate button with loading state
- Results display with sample descriptions
- Error handling

#### `frontend/src/pages/Review.jsx` (~250 lines)
**Purpose**: Human review and approval workflow

**Features**:
- Filter by object type (ALL/TABLE/COLUMN)
- Review cards in 2-column grid
- Inline editing
- Approve/Reject buttons
- Pagination
- Reviewer name tracking

**Key Components**:
- `ReviewCard`: Individual review card with edit capability

#### `frontend/src/pages/Compliance.jsx` (~200 lines)
**Purpose**: Compliance tracking and reporting

**Features**:
- Compliance score (A-F grade)
- Pie chart (status distribution)
- Bar chart (schema completion)
- Progress table
- Export button

#### `frontend/src/components/Layout.jsx` (~100 lines)
**Purpose**: Navigation and layout wrapper

**Features**:
- CarMax branded header
- Animated navigation tabs
- Responsive design
- Footer with Databricks branding

#### `frontend/src/services/api.js` (~50 lines)
**Purpose**: API client for backend communication

**Exports**:
- `descriptionService`: Object with all API methods
- Axios interceptors for error handling

---

### Configuration

#### `app.yml`
**Purpose**: Databricks App configuration

```yaml
command:
  - "python"
  - "app/main.py"

name: uc-description-generator

resources:
  - name: warehouse
    warehouse:
      id: "{{warehouse_id}}"

env:
  - name: TARGET_CATALOG
    value: "main"
  - name: GOVERNANCE_SCHEMA
    value: "governance"
  - name: MODEL_ENDPOINT
    value: "databricks-meta-llama-3-1-70b-instruct"
```

#### `requirements.txt`
**Python dependencies**:
```
flask==3.0.0
databricks-sdk==0.20.0
requests==2.31.0
pandas==2.1.3
gunicorn==21.2.0
```

#### `frontend/package.json`
**Node dependencies**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.0",
    "axios": "^1.6.2",
    "framer-motion": "^10.16.16",
    "recharts": "^2.10.3",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^3.3.6"
  }
}
```

---

## 🔄 Development Workflow

### Local Development

```bash
# Terminal 1: Backend
cd uc-description-app
python app/main.py
# Runs on localhost:8080

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Runs on localhost:3000
# Proxies /api to localhost:8080
```

### Build for Production

```bash
cd frontend
npm run build
# Output: ../static/
```

### Deploy to Databricks

```bash
./deploy.sh
# Interactive deployment script
```

---

## 🧪 Testing

### Manual Testing Checklist

**Setup**:
- [ ] Deploy app successfully
- [ ] Initialize governance table
- [ ] Verify SQL Warehouse connection

**Generate**:
- [ ] Generate for 5 tables
- [ ] Verify descriptions stored in governance table
- [ ] Check error handling for invalid catalog

**Review**:
- [ ] View pending reviews
- [ ] Edit description inline
- [ ] Approve description
- [ ] Reject description
- [ ] Verify reviewer name stored

**Apply**:
- [ ] Apply approved descriptions
- [ ] Verify in Catalog Explorer
- [ ] Query system.information_schema.tables

**Compliance**:
- [ ] View compliance score
- [ ] Check charts render
- [ ] Verify progress table
- [ ] Export report (future)

---

## 🐛 Common Issues & Solutions

### Issue: Frontend not building

```bash
# Solution
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Backend not starting

```bash
# Solution
pip install -r requirements.txt --upgrade
python app/main.py
# Check logs for errors
```

### Issue: Foundation Model timeout

```python
# Edit app/main.py, line ~120
response = requests.post(url, headers=headers, json=payload, timeout=60)
# Increase timeout from 30 to 60 seconds
```

### Issue: Permission denied

```sql
-- Grant necessary permissions
GRANT USE CATALOG ON CATALOG main TO `user@carmax.com`;
GRANT USE SCHEMA ON SCHEMA main.governance TO `user@carmax.com`;
GRANT CREATE TABLE ON SCHEMA main.governance TO `user@carmax.com`;
GRANT SELECT ON SCHEMA main.* TO `user@carmax.com`;
```

---

## 📊 Metrics & Monitoring

### Application Metrics

**Generation**:
- Tables/columns processed
- Success rate
- Error rate
- Average time per table

**Review**:
- Pending count
- Approval rate
- Rejection rate
- Reviewer activity

**Compliance**:
- Overall completion %
- Per-schema completion %
- Time to compliance

### SQL Queries for Monitoring

```sql
-- Daily generation activity
SELECT
  DATE(generated_at) as date,
  COUNT(*) as items_generated,
  SUM(CASE WHEN generation_error IS NULL THEN 1 ELSE 0 END) as successful
FROM main.governance.description_governance
WHERE generated_at >= CURRENT_DATE - INTERVAL 7 DAYS
GROUP BY DATE(generated_at)
ORDER BY date DESC;

-- Review velocity
SELECT
  reviewer,
  DATE(reviewed_at) as date,
  COUNT(*) as items_reviewed,
  SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) as approved
FROM main.governance.description_governance
WHERE reviewed_at >= CURRENT_DATE - INTERVAL 7 DAYS
GROUP BY reviewer, DATE(reviewed_at);

-- Compliance over time
SELECT
  DATE(applied_at) as date,
  COUNT(*) as items_applied
FROM main.governance.description_governance
WHERE applied_at >= CURRENT_DATE - INTERVAL 30 DAYS
GROUP BY DATE(applied_at)
ORDER BY date DESC;
```

---

## 🔐 Security Checklist

- [x] OAuth authentication (no hardcoded tokens)
- [x] Unity Catalog permission inheritance
- [x] SQL injection prevention (parameterized queries via SDK)
- [x] HTTPS only
- [x] No secrets in code
- [x] Audit trail for all actions
- [x] Reviewer identity tracking
- [x] Read-only system catalog access
- [x] Controlled MODIFY permissions

---

## 📈 Roadmap

### Phase 1 (Current) ✅
- AI-powered generation
- Human review workflow
- Compliance dashboard
- Full audit trail

### Phase 2 (Q1 2026)
- Bulk CSV import/export
- Scheduled regeneration
- Email/Slack notifications
- Quality scoring

### Phase 3 (Q2 2026)
- Multi-language support
- Auto-approval based on confidence
- Data lineage integration
- Custom model fine-tuning

---

## 🤝 Contributing

### Code Style

**Python (Backend)**:
- PEP 8 compliant
- Type hints where appropriate
- Docstrings for all functions

**JavaScript (Frontend)**:
- ESLint + Prettier
- Functional components
- Hooks over classes
- PropTypes for components

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/description-editing

# Make changes
git add .
git commit -m "Add inline editing to review cards"

# Push and create PR
git push origin feature/description-editing
```

---

## 📞 Support

### Documentation
- README.md - Overview
- DEPLOYMENT.md - Setup guide
- QUICK_START.md - 5-min guide
- ARCHITECTURE.md - Technical details
- UI_GUIDE.md - Interface guide

### Contact
- **CarMax Team**: Data Platform team
- **Databricks**: Solutions Architect
- **GitHub Issues**: For bug reports

---

## 📜 License

Internal use only - CarMax proprietary

---

## 🏆 Credits

**Built for**: CarMax
**Technology**: Databricks Foundation Models, Unity Catalog
**Framework**: React, Flask, TailwindCSS
**Design**: Modern, accessible, compliant

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Status**: Production Ready
