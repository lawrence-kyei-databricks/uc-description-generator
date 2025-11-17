-- Create governance schema and table
CREATE SCHEMA IF NOT EXISTS main.governance;

CREATE TABLE IF NOT EXISTS main.governance.description_governance (
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
    model_used STRING COMMENT 'Model endpoint used for generation',
    metadata STRING COMMENT 'JSON metadata'
)
TBLPROPERTIES ('delta.feature.allowColumnDefaults' = 'supported')
COMMENT 'Tracks AI-generated descriptions and their review status';

-- NOTE: Grant permissions to the Service Principal manually
-- Replace <SERVICE_PRINCIPAL_ID> with your app's service principal client ID
--
-- GRANT USE SCHEMA ON SCHEMA main.governance TO `<SERVICE_PRINCIPAL_ID>`;
-- GRANT SELECT, MODIFY ON TABLE main.governance.description_governance TO `<SERVICE_PRINCIPAL_ID>`;
--
-- To find your service principal ID, run:
-- databricks apps get <app-name> --profile <profile-name>
-- Look for "service_principal_client_id" in the output
