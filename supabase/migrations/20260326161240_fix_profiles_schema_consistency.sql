/*
  # Fix Profiles Schema Consistency

  1. Changes
    - Ensure core columns exist: id, email, name, phone, is_subscribed, subscription_started_at, subscription_canceled_at, created_at, updated_at
    - Keep phone instead of phone_number for consistency with existing code

  2. Purpose
    - Unify subscription fields to use only is_subscribed system
    - Ensure consistency between migrations and application code
*/

DO $$
BEGIN
  -- Ensure email column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text DEFAULT '';
  END IF;

  -- Ensure name column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name text DEFAULT '';
  END IF;

  -- Ensure phone column exists (NOT phone_number)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
  END IF;

  -- Ensure created_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Ensure updated_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Ensure is_subscribed column exists (added in previous migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_subscribed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_subscribed boolean DEFAULT false;
  END IF;

  -- Ensure subscription_started_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_started_at timestamptz;
  END IF;

  -- Ensure subscription_canceled_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_canceled_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_canceled_at timestamptz;
  END IF;
END $$;

-- Note: We keep is_premium and premium_expires_at columns to avoid data loss
-- Migration comment: Use only is_subscribed, subscription_started_at, and subscription_canceled_at in new code
