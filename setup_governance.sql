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
    metadata STRING COMMENT 'JSON metadata'
) COMMENT 'Tracks AI-generated descriptions and their review status';

-- Grant permissions to Service Principal
GRANT USE SCHEMA ON SCHEMA main.governance TO `f71e1384-89ee-41b2-8c5c-cd2273c5756b`;
GRANT SELECT, MODIFY ON TABLE main.governance.description_governance TO `f71e1384-89ee-41b2-8c5c-cd2273c5756b`;
