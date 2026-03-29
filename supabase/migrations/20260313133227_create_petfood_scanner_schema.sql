/*
  # PetFood Scanner Database Schema
  
  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `phone` (text)
      - `email` (text)
      - `is_premium` (boolean, default false)
      - `premium_expires_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `scanned_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `barcode` (text)
      - `product_name` (text)
      - `brands` (text)
      - `image_url` (text)
      - `ingredients_text` (text)
      - `nutriments` (jsonb)
      - `nutriscore_grade` (text)
      - `scanned_at` (timestamptz)
    
    - `favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `barcode` (text)
      - `product_name` (text)
      - `brands` (text)
      - `image_url` (text)
      - `nutriscore_grade` (text)
      - `created_at` (timestamptz)
    
    - `user_pets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `pet_type` (text)
      - `breed` (text)
      - `age` (text)
      - `location` (text)
      - `ai_report` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  is_premium boolean DEFAULT false,
  premium_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create scanned_products table
CREATE TABLE IF NOT EXISTS scanned_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  barcode text NOT NULL,
  product_name text DEFAULT '',
  brands text DEFAULT '',
  image_url text DEFAULT '',
  ingredients_text text DEFAULT '',
  nutriments jsonb DEFAULT '{}'::jsonb,
  nutriscore_grade text DEFAULT '',
  scanned_at timestamptz DEFAULT now()
);

ALTER TABLE scanned_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scanned products"
  ON scanned_products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scanned products"
  ON scanned_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scanned products"
  ON scanned_products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  barcode text NOT NULL,
  product_name text DEFAULT '',
  brands text DEFAULT '',
  image_url text DEFAULT '',
  nutriscore_grade text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, barcode)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_pets table
CREATE TABLE IF NOT EXISTS user_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pet_type text DEFAULT '',
  breed text DEFAULT '',
  age text DEFAULT '',
  location text DEFAULT '',
  ai_report text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pets"
  ON user_pets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pets"
  ON user_pets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets"
  ON user_pets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pets"
  ON user_pets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS scanned_products_user_id_idx ON scanned_products(user_id);
CREATE INDEX IF NOT EXISTS scanned_products_scanned_at_idx ON scanned_products(scanned_at DESC);
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS user_pets_user_id_idx ON user_pets(user_id);