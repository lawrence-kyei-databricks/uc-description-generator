"""
Unity Catalog Description Generator - Databricks App
Web UI for human-in-the-loop review and approval
"""

from flask import Flask, render_template, request, jsonify, session, send_from_directory
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState
import os
import json
import time
from datetime import datetime
from typing import List, Dict, Optional
import requests

app = Flask(__name__,
            template_folder='../templates',
            static_folder='../static')

# Validate critical configuration on startup
FLASK_SECRET_KEY = os.environ.get('FLASK_SECRET_KEY')
if not FLASK_SECRET_KEY or FLASK_SECRET_KEY == 'dev-secret-key-not-for-production':
    raise ValueError("FLASK_SECRET_KEY must be set to a secure random value in production")
app.secret_key = FLASK_SECRET_KEY

# Configuration
TARGET_CATALOG = os.environ.get('TARGET_CATALOG', 'main')
GOVERNANCE_SCHEMA = os.environ.get('GOVERNANCE_SCHEMA', 'governance')
GOVERNANCE_TABLE = f"{TARGET_CATALOG}.{GOVERNANCE_SCHEMA}.description_governance"
MODEL_ENDPOINT = os.environ.get('MODEL_ENDPOINT', 'databricks-meta-llama-3-1-70b-instruct')
WAREHOUSE_ID = os.environ.get('WAREHOUSE_ID')
if not WAREHOUSE_ID:
    raise ValueError("WAREHOUSE_ID must be configured in environment variables")

# Lazy initialize Databricks client (will be created on first use)
_workspace_client = None

def get_workspace_client():
    """Get or create WorkspaceClient instance"""
    global _workspace_client
    if _workspace_client is None:
        _workspace_client = WorkspaceClient()
    return _workspace_client


class DescriptionService:
    """Service for managing UC descriptions"""

    def __init__(self):
        self.w = get_workspace_client()

    def _validate_identifier(self, identifier: str, name: str):
        """Validate SQL identifier (catalog, schema, table, column name)"""
        if not identifier:
            raise ValueError(f"{name} cannot be empty")
        # Check for valid identifier characters (alphanumeric, underscore, hyphen)
        # Allow dots for fully qualified names
        if not all(c.isalnum() or c in ('_', '-', '.') for c in identifier):
            raise ValueError(f"Invalid {name}: contains illegal characters")
        if len(identifier) > 255:
            raise ValueError(f"{name} too long (max 255 characters)")

    def _escape_sql_string(self, value: str) -> str:
        """Escape single quotes in SQL string values"""
        if value is None:
            return ""
        return str(value).replace("'", "''")

    def check_permissions(self, catalog: str, schema: str, table: Optional[str] = None) -> Dict:
        """
        Check if current user has necessary permissions

        Returns:
            Dict with permission status and details
        """
        permissions = {
            'can_select': False,
            'can_modify': False,
            'can_use_catalog': False,
            'can_use_schema': False,
            'user': None,
            'errors': []
        }

        try:
            # Get current user
            current_user = self.w.current_user.me()
            permissions['user'] = current_user.user_name

            # Check catalog access
            try:
                catalogs = self.w.catalogs.list()
                catalog_names = [c.name for c in catalogs]
                if catalog in catalog_names:
                    permissions['can_use_catalog'] = True
                else:
                    permissions['errors'].append(f"Catalog '{catalog}' not accessible")
            except Exception as e:
                permissions['errors'].append(f"Cannot list catalogs: {str(e)}")

            # Check schema access
            try:
                schemas = self.w.schemas.list(catalog_name=catalog)
                schema_names = [s.name for s in schemas]
                if schema in schema_names:
                    permissions['can_use_schema'] = True
                else:
                    permissions['errors'].append(f"Schema '{schema}' not accessible")
            except Exception as e:
                permissions['errors'].append(f"Cannot list schemas: {str(e)}")

            # Check table access (if specified)
            if table:
                try:
                    # Try to SELECT from table
                    test_query = f"SELECT * FROM {catalog}.{schema}.{table} LIMIT 1"
                    self.execute_sql(test_query)
                    permissions['can_select'] = True

                    # Check if we can modify (try DESCRIBE)
                    desc_query = f"DESCRIBE TABLE EXTENDED {catalog}.{schema}.{table}"
                    self.execute_sql(desc_query)
                    permissions['can_modify'] = True
                except Exception as e:
                    permissions['errors'].append(f"Cannot access table '{table}': {str(e)}")
            else:
                # Check if we can list tables in schema
                try:
                    query = f"""
                    SELECT table_name
                    FROM system.information_schema.tables
                    WHERE table_catalog = '{catalog}' AND table_schema = '{schema}'
                    LIMIT 1
                    """
                    self.execute_sql(query)
                    permissions['can_select'] = True
                    permissions['can_modify'] = True  # Assume if can list, can modify
                except Exception as e:
                    permissions['errors'].append(f"Cannot list tables: {str(e)}")

        except Exception as e:
            permissions['errors'].append(f"Error checking permissions: {str(e)}")

        return permissions

    def get_catalogs(self) -> List[str]:
        """Get list of accessible catalogs"""
        try:
            catalogs = self.w.catalogs.list()
            return sorted([c.name for c in catalogs if c.name])
        except Exception as e:
            print(f"Error listing catalogs: {e}")
            return []

    def get_schemas(self, catalog: str) -> List[str]:
        """Get list of schemas in catalog"""
        try:
            schemas = self.w.schemas.list(catalog_name=catalog)
            return sorted([s.name for s in schemas if s.name])
        except Exception as e:
            print(f"Error listing schemas: {e}")
            return []

    def get_tables(self, catalog: str, schema: str) -> List[Dict]:
        """Get list of tables in schema with metadata"""
        query = f"""
        SELECT
            table_name,
            table_type,
            comment as current_comment,
            (SELECT COUNT(*) FROM system.information_schema.columns
             WHERE table_catalog = t.table_catalog
               AND table_schema = t.table_schema
               AND table_name = t.table_name) as column_count
        FROM system.information_schema.tables t
        WHERE table_catalog = '{catalog}'
          AND table_schema = '{schema}'
          AND table_type = 'MANAGED'
        ORDER BY table_name
        """
        return self.execute_sql(query)

    def execute_sql(self, query: str, warehouse_id: str = WAREHOUSE_ID) -> List[Dict]:
        """Execute SQL and return results"""
        try:
            statement = self.w.statement_execution.execute_statement(
                statement=query,
                warehouse_id=warehouse_id,
                wait_timeout='30s'
            )

            # Wait for completion
            while statement.status.state in [StatementState.PENDING, StatementState.RUNNING]:
                time.sleep(1)
                statement = self.w.statement_execution.get_statement(statement.statement_id)

            if statement.status.state != StatementState.SUCCEEDED:
                raise Exception(f"Query failed: {statement.status.error}")

            # Parse results
            if not statement.result or not statement.result.data_array:
                return []

            # Get column names
            columns = [col.name for col in statement.manifest.schema.columns]

            # Convert to list of dicts
            results = []
            for row in statement.result.data_array:
                results.append(dict(zip(columns, row)))

            return results

        except Exception as e:
            print(f"SQL Error: {e}")
            raise

    def setup_governance_table(self):
        """Create governance table if not exists"""
        create_schema = f"CREATE SCHEMA IF NOT EXISTS {TARGET_CATALOG}.{GOVERNANCE_SCHEMA}"
        self.execute_sql(create_schema)

        create_table = f"""
        CREATE TABLE IF NOT EXISTS {GOVERNANCE_TABLE} (
            id BIGINT GENERATED ALWAYS AS IDENTITY,
            object_type STRING COMMENT 'TABLE or COLUMN',
            catalog_name STRING,
            schema_name STRING,
            table_name STRING,
            column_name STRING,
            column_data_type STRING,
            ai_generated_description STRING COMMENT 'AI-generated description',
            approved_description STRING COMMENT 'Human-approved description',
            reviewer STRING COMMENT 'User who reviewed',
            review_status STRING COMMENT 'PENDING, APPROVED, REJECTED, APPLIED',
            generated_at TIMESTAMP,
            reviewed_at TIMESTAMP,
            applied_at TIMESTAMP,
            model_used STRING,
            generation_error STRING,
            confidence_score DOUBLE COMMENT 'AI confidence 0-1'
        )
        COMMENT 'Governance tracking for UC description generation'
        """
        self.execute_sql(create_table)

    def get_tables_for_generation(self, catalog: str, schema: Optional[str] = None) -> List[Dict]:
        """Get tables for description generation - shows all tables"""
        if schema:
            query = f"""
            SELECT
                table_catalog,
                table_schema,
                table_name,
                comment as current_comment
            FROM system.information_schema.tables
            WHERE table_catalog = '{catalog}'
              AND table_schema = '{schema}'
              AND table_type = 'MANAGED'
            ORDER BY table_name
            """
        else:
            query = f"""
            SELECT
                table_catalog,
                table_schema,
                table_name,
                comment as current_comment
            FROM system.information_schema.tables
            WHERE table_catalog = '{catalog}'
              AND table_type = 'MANAGED'
              AND (comment IS NULL OR comment = '')
            ORDER BY table_schema, table_name
            """

        return self.execute_sql(query)

    def get_table_metadata(self, catalog: str, schema: str, table: str) -> Dict:
        """Get detailed metadata for a table"""
        # Get columns
        columns_query = f"""
        SELECT column_name, data_type, comment
        FROM system.information_schema.columns
        WHERE table_catalog = '{catalog}'
          AND table_schema = '{schema}'
          AND table_name = '{table}'
        ORDER BY ordinal_position
        """
        columns = self.execute_sql(columns_query)

        # Get sample data (safely)
        sample_data = []
        try:
            sample_query = f"SELECT * FROM {catalog}.{schema}.{table} LIMIT 5"
            sample_data = self.execute_sql(sample_query)
        except:
            pass

        return {
            'columns': columns,
            'sample_data': sample_data
        }

    def call_foundation_model(self, prompt: str) -> str:
        """Call Foundation Model API"""
        try:
            # Get workspace URL and token
            workspace_url = self.w.config.host
            token = self.w.config.token

            url = f"{workspace_url}/serving-endpoints/{MODEL_ENDPOINT}/invocations"

            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }

            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 200,
                "temperature": 0.3
            }

            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            result = response.json()
            return result['choices'][0]['message']['content'].strip()

        except Exception as e:
            return f"ERROR: {str(e)}"

    def generate_table_description(self, catalog: str, schema: str, table: str) -> str:
        """Generate description for a table"""
        metadata = self.get_table_metadata(catalog, schema, table)

        columns_info = "\n".join([
            f"  - {col['column_name']} ({col['data_type']})"
            for col in metadata['columns']
        ])

        sample_info = ""
        if metadata['sample_data']:
            sample_info = f"\n\nSample data (first 3 rows):\n{json.dumps(metadata['sample_data'][:3], indent=2, default=str)}"

        prompt = f"""You are a data documentation expert. Generate a clear, concise description for this database table.

Table: {catalog}.{schema}.{table}

Columns:
{columns_info}
{sample_info}

Generate a 1-2 sentence description explaining:
1. What data this table contains
2. The primary purpose or use case

Description:"""

        return self.call_foundation_model(prompt)

    def generate_column_description(self, catalog: str, schema: str, table: str,
                                   column_name: str, column_type: str, sample_values: List = None) -> str:
        """Generate description for a column"""
        sample_info = ""
        if sample_values:
            values = [str(v) for v in sample_values if v is not None][:5]
            if values:
                sample_info = f"\n\nSample values: {', '.join(values)}"

        prompt = f"""You are a data documentation expert. Generate a clear, concise description for this database column.

Table: {catalog}.{schema}.{table}
Column: {column_name}
Data Type: {column_type}
{sample_info}

Generate a brief 1-sentence description explaining what this column represents and its purpose.

Description:"""

        return self.call_foundation_model(prompt)

    def store_generated_description(self, object_type: str, catalog: str, schema: str,
                                   table: str, column: Optional[str], column_type: Optional[str],
                                   description: str):
        """Store generated description in governance table"""
        # Validate inputs
        self._validate_identifier(catalog, "catalog")
        self._validate_identifier(schema, "schema")
        self._validate_identifier(table, "table")
        if column:
            self._validate_identifier(column, "column")

        # Escape all string values for SQL
        column_val = f"'{self._escape_sql_string(column)}'" if column else "NULL"
        column_type_val = f"'{self._escape_sql_string(column_type)}'" if column_type else "NULL"
        escaped_desc = self._escape_sql_string(description)

        insert_sql = f"""
        INSERT INTO {GOVERNANCE_TABLE}
        (object_type, catalog_name, schema_name, table_name, column_name, column_data_type,
         ai_generated_description, review_status, generated_at, model_used)
        VALUES
        ('{self._escape_sql_string(object_type)}', '{self._escape_sql_string(catalog)}',
         '{self._escape_sql_string(schema)}', '{self._escape_sql_string(table)}',
         {column_val}, {column_type_val},
         '{escaped_desc}', 'PENDING', current_timestamp(), '{self._escape_sql_string(MODEL_ENDPOINT)}')
        """

        self.execute_sql(insert_sql)

    def get_pending_reviews(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get descriptions for review - sorted by status then date"""
        query = f"""
        SELECT
            id,
            object_type,
            CONCAT(catalog_name, '.', schema_name, '.', table_name,
                   CASE WHEN column_name IS NOT NULL THEN CONCAT('.', column_name) ELSE '' END) as object_path,
            catalog_name,
            schema_name,
            table_name,
            column_name,
            column_data_type,
            ai_generated_description,
            approved_description,
            review_status,
            reviewer,
            generated_at,
            reviewed_at,
            model_used
        FROM {GOVERNANCE_TABLE}
        WHERE review_status IN ('PENDING', 'APPROVED', 'APPLIED')
        ORDER BY
            CASE review_status
                WHEN 'PENDING' THEN 1
                WHEN 'APPROVED' THEN 2
                WHEN 'APPLIED' THEN 3
            END,
            generated_at DESC
        LIMIT {limit} OFFSET {offset}
        """

        return self.execute_sql(query)

    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        query = f"""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN review_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN review_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN review_status = 'APPLIED' THEN 1 ELSE 0 END) as applied,
            SUM(CASE WHEN object_type = 'TABLE' THEN 1 ELSE 0 END) as tables,
            SUM(CASE WHEN object_type = 'COLUMN' THEN 1 ELSE 0 END) as columns
        FROM {GOVERNANCE_TABLE}
        """

        results = self.execute_sql(query)
        return results[0] if results else {}

    def get_schema_progress(self) -> List[Dict]:
        """Get progress by schema"""
        query = f"""
        SELECT
            schema_name,
            COUNT(*) as total,
            SUM(CASE WHEN review_status = 'APPLIED' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN review_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
            ROUND(100.0 * SUM(CASE WHEN review_status = 'APPLIED' THEN 1 ELSE 0 END) / COUNT(*), 2) as pct_complete
        FROM {GOVERNANCE_TABLE}
        GROUP BY schema_name
        ORDER BY pct_complete DESC, schema_name
        """

        return self.execute_sql(query)

    def update_review_status(self, record_id: int, status: str,
                            approved_desc: Optional[str], reviewer: str):
        """Update review status"""
        # Validate inputs
        if not isinstance(record_id, int) or record_id <= 0:
            raise ValueError("Invalid record_id")
        if status not in ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED'):
            raise ValueError(f"Invalid status: {status}")

        if approved_desc:
            escaped_desc = self._escape_sql_string(approved_desc)
            update_sql = f"""
            UPDATE {GOVERNANCE_TABLE}
            SET
                review_status = '{self._escape_sql_string(status)}',
                approved_description = '{escaped_desc}',
                reviewer = '{self._escape_sql_string(reviewer)}',
                reviewed_at = current_timestamp()
            WHERE id = {record_id}
            """
        else:
            update_sql = f"""
            UPDATE {GOVERNANCE_TABLE}
            SET
                review_status = '{self._escape_sql_string(status)}',
                approved_description = ai_generated_description,
                reviewer = '{self._escape_sql_string(reviewer)}',
                reviewed_at = current_timestamp()
            WHERE id = {record_id}
            """

        self.execute_sql(update_sql)

    def apply_approved_descriptions(self) -> Dict:
        """Apply approved descriptions to UC"""
        # Get approved items
        query = f"""
        SELECT id, object_type, catalog_name, schema_name, table_name, column_name, approved_description
        FROM {GOVERNANCE_TABLE}
        WHERE review_status = 'APPROVED' AND applied_at IS NULL
        """

        approved = self.execute_sql(query)
        applied_count = 0
        error_count = 0

        for item in approved:
            try:
                # Validate identifiers
                self._validate_identifier(item['catalog_name'], "catalog")
                self._validate_identifier(item['schema_name'], "schema")
                self._validate_identifier(item['table_name'], "table")
                if item['column_name']:
                    self._validate_identifier(item['column_name'], "column")

                escaped_desc = self._escape_sql_string(item['approved_description'])

                if item['object_type'] == 'TABLE':
                    apply_sql = f"""
                    COMMENT ON TABLE {item['catalog_name']}.{item['schema_name']}.{item['table_name']}
                    IS '{escaped_desc}'
                    """
                else:
                    apply_sql = f"""
                    ALTER TABLE {item['catalog_name']}.{item['schema_name']}.{item['table_name']}
                    ALTER COLUMN {item['column_name']}
                    COMMENT '{escaped_desc}'
                    """

                self.execute_sql(apply_sql)

                # Mark as applied
                if not isinstance(item['id'], int) or item['id'] <= 0:
                    raise ValueError("Invalid record ID")
                update_sql = f"""
                UPDATE {GOVERNANCE_TABLE}
                SET review_status = 'APPLIED', applied_at = current_timestamp()
                WHERE id = {item['id']}
                """
                self.execute_sql(update_sql)

                applied_count += 1

            except Exception as e:
                print(f"Error applying description for {item['object_type']}: {e}")
                error_count += 1

        return {'applied': applied_count, 'errors': error_count}


# Initialize service
service = DescriptionService()


# API Endpoints
@app.route('/api/setup', methods=['POST'])
def api_setup():
    """Setup governance table"""
    try:
        service.setup_governance_table()
        return jsonify({'success': True, 'message': 'Governance table created'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/generate', methods=['POST'])
def api_generate():
    """Generate descriptions for tables"""
    try:
        data = request.json
        catalog = data.get('catalog', TARGET_CATALOG)
        schema = data.get('schema')
        tables_list = data.get('tables', [])  # Specific tables or empty for all
        batch_size = data.get('batch_size', 10)

        # Check permissions first
        perms = service.check_permissions(catalog, schema)
        if not perms['can_select'] or not perms['can_modify']:
            return jsonify({
                'success': False,
                'error': f"Insufficient permissions: {', '.join(perms['errors'])}"
            }), 403

        # Get tables to process
        if tables_list:
            # Filter for specific tables
            all_tables = service.get_tables_for_generation(catalog, schema)
            tables_to_process = [t for t in all_tables if t['table_name'] in tables_list]
        else:
            # Get all tables (up to batch size)
            tables = service.get_tables_for_generation(catalog, schema)
            tables_to_process = tables[:batch_size]

        results = {
            'total_found': len(tables),
            'processing': len(tables_to_process),
            'generated': 0,
            'errors': 0,
            'items': []
        }

        for table_info in tables_to_process:
            cat = table_info['table_catalog']
            sch = table_info['table_schema']
            tbl = table_info['table_name']

            try:
                # Generate table description
                table_desc = service.generate_table_description(cat, sch, tbl)
                if not table_desc.startswith('ERROR:'):
                    service.store_generated_description('TABLE', cat, sch, tbl, None, None, table_desc)
                    results['generated'] += 1
                    results['items'].append({
                        'type': 'TABLE',
                        'path': f"{cat}.{sch}.{tbl}",
                        'description': table_desc[:100] + '...'
                    })

                # Generate column descriptions
                metadata = service.get_table_metadata(cat, sch, tbl)
                for col in metadata['columns']:
                    if not col.get('comment'):
                        sample_values = None
                        if metadata['sample_data']:
                            sample_values = [row.get(col['column_name']) for row in metadata['sample_data']]

                        col_desc = service.generate_column_description(
                            cat, sch, tbl, col['column_name'], col['data_type'], sample_values
                        )

                        if not col_desc.startswith('ERROR:'):
                            service.store_generated_description(
                                'COLUMN', cat, sch, tbl, col['column_name'], col['data_type'], col_desc
                            )
                            results['generated'] += 1

                time.sleep(0.5)  # Rate limiting

            except Exception as e:
                results['errors'] += 1
                print(f"Error processing {cat}.{sch}.{tbl}: {e}")

        return jsonify({'success': True, 'results': results})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/review/<int:record_id>', methods=['POST'])
def api_review(record_id):
    """Update review status"""
    try:
        data = request.json
        status = data.get('status')  # APPROVED or REJECTED
        approved_desc = data.get('approved_description')
        reviewer = data.get('reviewer', 'unknown')

        service.update_review_status(record_id, status, approved_desc, reviewer)

        return jsonify({'success': True, 'message': f'Review status updated to {status}'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/apply', methods=['POST'])
def api_apply():
    """Apply approved descriptions to UC"""
    try:
        results = service.apply_approved_descriptions()
        return jsonify({'success': True, 'results': results})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def api_stats():
    """Get statistics"""
    try:
        stats = service.get_statistics()
        return jsonify({'success': True, 'stats': stats})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/catalogs', methods=['GET'])
def api_catalogs():
    """Get list of accessible catalogs"""
    try:
        catalogs = service.get_catalogs()
        return jsonify({'success': True, 'catalogs': catalogs})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/schemas', methods=['GET'])
def api_schemas():
    """Get list of schemas in catalog"""
    try:
        catalog = request.args.get('catalog')
        if not catalog:
            return jsonify({'success': False, 'error': 'catalog parameter required'}), 400

        schemas = service.get_schemas(catalog)
        return jsonify({'success': True, 'schemas': schemas})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/tables', methods=['GET'])
def api_tables():
    """Get list of tables in schema"""
    try:
        catalog = request.args.get('catalog')
        schema = request.args.get('schema')

        if not catalog or not schema:
            return jsonify({'success': False, 'error': 'catalog and schema parameters required'}), 400

        tables = service.get_tables(catalog, schema)
        return jsonify({'success': True, 'tables': tables})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/permissions', methods=['POST'])
def api_permissions():
    """Check permissions for catalog/schema/table"""
    try:
        data = request.json
        catalog = data.get('catalog')
        schema = data.get('schema')
        table = data.get('table')

        if not catalog or not schema:
            return jsonify({'success': False, 'error': 'catalog and schema required'}), 400

        permissions = service.check_permissions(catalog, schema, table)
        return jsonify({'success': True, 'permissions': permissions})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/pending', methods=['GET'])
def api_pending():
    """Get pending reviews with pagination"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        pending = service.get_pending_reviews(limit=per_page, offset=(page-1)*per_page)

        return jsonify({'success': True, 'pending': pending, 'page': page})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/schema-progress', methods=['GET'])
def api_schema_progress():
    """Get progress by schema"""
    try:
        progress = service.get_schema_progress()
        return jsonify({'success': True, 'schema_progress': progress})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/review-activity', methods=['GET'])
def api_review_activity():
    """Get reviewer activity"""
    try:
        query = f"""
        SELECT
            reviewer,
            review_status,
            COUNT(*) as count,
            MIN(reviewed_at) as first_review,
            MAX(reviewed_at) as last_review
        FROM {GOVERNANCE_TABLE}
        WHERE reviewer IS NOT NULL
        GROUP BY reviewer, review_status
        ORDER BY reviewer, review_status
        """

        activity = service.execute_sql(query)
        return jsonify({'success': True, 'activity': activity})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/coverage', methods=['GET'])
def api_coverage():
    """Get current UC coverage"""
    try:
        catalog = request.args.get('catalog', TARGET_CATALOG)

        query = f"""
        WITH current_coverage AS (
          SELECT
            table_schema,
            COUNT(*) as total_tables,
            SUM(CASE WHEN comment IS NOT NULL AND comment != '' THEN 1 ELSE 0 END) as documented
          FROM system.information_schema.tables
          WHERE table_catalog = '{catalog}'
            AND table_type = 'MANAGED'
          GROUP BY table_schema
        )
        SELECT
          table_schema as schema_name,
          total_tables,
          documented,
          total_tables - documented as missing,
          ROUND(100.0 * documented / total_tables, 2) as pct_complete
        FROM current_coverage
        ORDER BY pct_complete DESC
        """

        coverage = service.execute_sql(query)
        return jsonify({'success': True, 'coverage': coverage})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Health check endpoint
@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'app': 'uc-description-generator',
        'version': '1.0.0'
    })


# Serve React assets
@app.route('/assets/<path:path>')
def serve_assets(path):
    """Serve React assets (JS, CSS, images)"""
    return send_from_directory(os.path.join(app.static_folder, 'assets'), path)

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React frontend"""
    # Don't intercept API calls
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404

    # For all other routes, serve the React app
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    # For local development
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
