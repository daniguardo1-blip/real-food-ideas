/*
  # Add Consent and Legal Compliance Fields

  1. Changes to `profiles` table
    - Add `consent_privacy` (boolean) - Privacy policy consent
    - Add `consent_terms` (boolean) - Terms of service consent
    - Add `consent_marketing` (boolean) - Marketing communications consent
    - Add `consent_date` (timestamp) - Date when consent was given
    
  2. Security
    - Users can only update their own consent status
    - Consent fields default to false for safety
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_privacy'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_privacy boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_terms'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_terms boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_marketing'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_marketing boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_date timestamptz;
  END IF;
END $$;
