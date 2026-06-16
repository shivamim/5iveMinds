-- FiveMinds Database Migration
-- This migration fixes the critical dataset identity bug
-- by adding a proper foreign key relationship between PipelineRun and Dataset

-- Step 1: Add dataset_id column to pipeline_runs table
ALTER TABLE pipeline_runs 
ADD COLUMN IF NOT EXISTS dataset_id UUID REFERENCES datasets(id);

-- Step 2: Add column_stats and sample_data to datasets table
-- These store pre-computed statistics for real agent analysis
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS column_stats JSONB DEFAULT NULL;

ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS sample_data JSONB DEFAULT NULL;

-- Step 3: Create index for faster dataset lookups by ID
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_dataset_id 
ON pipeline_runs(dataset_id);

-- Step 4: Backfill existing pipeline runs with dataset_id
-- This attempts to match existing runs to datasets by filename
-- NOTE: This may not match correctly for duplicate filenames
UPDATE pipeline_runs pr
SET dataset_id = d.id
FROM datasets d
WHERE pr.dataset_name = d.filename
  AND pr.dataset_id IS NULL;

-- Step 5: Verify the migration
SELECT 
    'Pipeline runs with dataset_id' as check_item,
    COUNT(*) as count
FROM pipeline_runs 
WHERE dataset_id IS NOT NULL
UNION ALL
SELECT 
    'Pipeline runs without dataset_id (need manual fix)' as check_item,
    COUNT(*) as count
FROM pipeline_runs 
WHERE dataset_id IS NULL
UNION ALL
SELECT 
    'Total datasets' as check_item,
    COUNT(*) as count
FROM datasets;
