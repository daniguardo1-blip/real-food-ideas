/*
  # Add Pet Profiles Table

  1. New Tables
    - `pet_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `pet_name` (text, required)
      - `pet_type` (text, required - dog, cat, bird, rabbit, etc.)
      - `breed` (text, nullable - only for non-cats)
      - `age_years` (integer, required)
      - `additional_info` (text, nullable - allergies, diseases, special needs)
      - `location` (text, nullable - where the pet lives)
      - `photo_url` (text, nullable - pet profile photo)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `onboarding_completed` (boolean, default false)

  2. Security
    - Enable RLS on `pet_profiles` table
    - Add policies for users to read/write their own pet profiles
    
  3. Notes
    - Users can have one pet profile (one-to-one relationship)
    - The onboarding_completed flag tracks if the user has completed the initial setup
*/

CREATE TABLE IF NOT EXISTS pet_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pet_name text NOT NULL,
  pet_type text NOT NULL,
  breed text,
  age_years integer NOT NULL,
  additional_info text,
  location text,
  photo_url text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pet profile"
  ON pet_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pet profile"
  ON pet_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pet profile"
  ON pet_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pet profile"
  ON pet_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster user_id lookups
CREATE INDEX IF NOT EXISTS idx_pet_profiles_user_id ON pet_profiles(user_id);