-- Ensure display_name column exists (may already be present from earlier schema work)
ALTER TABLE devices ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
