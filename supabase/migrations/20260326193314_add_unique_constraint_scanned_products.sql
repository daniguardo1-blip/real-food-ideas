/*
  # Add unique constraint to scanned_products

  ## Purpose
  Adds a unique constraint on (user_id, barcode) to prevent duplicate scans
  and enable upsert operations for updating scan history.

  ## Changes
  - Creates unique index on (user_id, barcode) if it doesn't exist
  - Removes any duplicate records keeping only the most recent scan
*/

-- First, remove any duplicates by keeping only the most recent scan per user+barcode
DO $$
BEGIN
  DELETE FROM scanned_products a
  USING scanned_products b
  WHERE a.user_id = b.user_id
    AND a.barcode = b.barcode
    AND a.scanned_at < b.scanned_at;
  
  RAISE NOTICE 'Removed duplicate scans';
END $$;

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS scanned_products_user_barcode_unique 
  ON scanned_products(user_id, barcode);
