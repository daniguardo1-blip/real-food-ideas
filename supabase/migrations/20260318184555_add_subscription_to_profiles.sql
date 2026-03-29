/*
  # Add Subscription Fields to Profiles

  1. Changes
    - Add `is_subscribed` boolean field to profiles table (for detailed reports subscription)
    - Add `subscription_started_at` timestamp field
    - Add `subscription_canceled_at` timestamp field
  
  2. Purpose
    - Track detailed reports subscription status (1,99€/mes)
    - Enable temporary development testing without real payment
    - Support subscription management from profile screen
*/

DO $$
BEGIN
  -- Add is_subscribed field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_subscribed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_subscribed boolean DEFAULT false;
  END IF;

  -- Add subscription_started_at field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_started_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_started_at timestamptz;
  END IF;

  -- Add subscription_canceled_at field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_canceled_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_canceled_at timestamptz;
  END IF;
END $$;