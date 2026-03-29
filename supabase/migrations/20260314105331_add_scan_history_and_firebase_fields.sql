/*
  # Add Scan History and Firebase Integration Fields

  1. New Tables
    - `scan_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `product_name` (text)
      - `barcode` (text)
      - `health_score` (int)
      - `ingredients` (text array)
      - `price` (text)
      - `dangerous_ingredients` (text array)
      - `scanned_at` (timestamp)

  2. Modifications to profiles table
    - Add `phone_number` field
    - Add `pet_type` field
    - Add `pet_breed` field
    - Add `pet_age` field
    - Add `pet_living_environment` field
    - Add `firebase_uid` field for Firebase integration

  3. Security
    - Enable RLS on `scan_history` table
    - Add policies for users to manage their own scan history
*/

-- Add new fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pet_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pet_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pet_breed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pet_breed text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pet_age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pet_age text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pet_living_environment'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pet_living_environment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'firebase_uid'
  ) THEN
    ALTER TABLE profiles ADD COLUMN firebase_uid text;
  END IF;
END $$;

-- Create scan_history table
CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  barcode text NOT NULL,
  health_score int DEFAULT 0,
  ingredients text[] DEFAULT '{}',
  price text,
  dangerous_ingredients text[] DEFAULT '{}',
  scanned_at timestamptz DEFAULT now()
);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan history"
  ON scan_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history"
  ON scan_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan history"
  ON scan_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_barcode ON scan_history(barcode);
