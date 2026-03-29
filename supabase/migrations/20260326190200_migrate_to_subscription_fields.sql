/*
  # Migrate to Subscription Fields Schema

  ## Summary
  This migration ensures schema consistency by standardizing subscription fields in the `profiles` table.

  ## Changes Made
  1. Ensures required columns exist:
     - `is_subscribed` (boolean, default false) - Current subscription status
     - `subscription_started_at` (timestamptz, nullable) - When subscription began
     - `subscription_canceled_at` (timestamptz, nullable) - When subscription was canceled
  
  2. Data Migration:
     - If `is_premium` column exists, copies its values to `is_subscribed`
     - Preserves all existing data safely
  
  3. Safety Features:
     - Uses IF EXISTS/IF NOT EXISTS to prevent errors
     - Non-destructive (does not drop columns or delete data)
     - Idempotent (safe to run multiple times)

  ## Why This Migration Exists
  The original migration created `is_premium` and `premium_expires_at` fields, but the application
  code uses `is_subscribed`, `subscription_started_at`, and `subscription_canceled_at`. This caused
  a PGRST204 error when the code tried to access columns that didn't match the database schema.

  ## Security
  No RLS policies are modified. Existing row-level security remains intact.
*/

DO $$
BEGIN
  -- Ensure is_subscribed column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_subscribed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_subscribed boolean DEFAULT false;
    RAISE NOTICE 'Added column: is_subscribed';
  ELSE
    RAISE NOTICE 'Column already exists: is_subscribed';
  END IF;

  -- Ensure subscription_started_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_started_at timestamptz;
    RAISE NOTICE 'Added column: subscription_started_at';
  ELSE
    RAISE NOTICE 'Column already exists: subscription_started_at';
  END IF;

  -- Ensure subscription_canceled_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_canceled_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_canceled_at timestamptz;
    RAISE NOTICE 'Added column: subscription_canceled_at';
  ELSE
    RAISE NOTICE 'Column already exists: subscription_canceled_at';
  END IF;

  -- Migrate data from is_premium to is_subscribed if is_premium column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    -- Copy is_premium values to is_subscribed (only where is_subscribed is still false)
    UPDATE profiles
    SET is_subscribed = is_premium
    WHERE is_premium = true AND is_subscribed = false;
    
    RAISE NOTICE 'Migrated data from is_premium to is_subscribed';
  ELSE
    RAISE NOTICE 'Column is_premium does not exist, skipping data migration';
  END IF;

END $$;
