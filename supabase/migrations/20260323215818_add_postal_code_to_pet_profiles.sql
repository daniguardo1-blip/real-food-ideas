/*
  # Add postal code field to pet profiles

  1. Changes
    - Add `postal_code` column to `pet_profiles` table
    - This will be used for location-based services like veterinarians, shelters, and groomers

  2. Notes
    - Column is nullable to support existing profiles
    - Kept separate from the general location field for flexibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE pet_profiles ADD COLUMN postal_code text;
  END IF;
END $$;