/*
  # Ensure scanned_products table exists

  ## Purpose
  This migration ensures the scanned_products table exists with proper structure and RLS policies.
  It's idempotent and safe to run multiple times.

  ## What it does
  1. Creates scanned_products table if it doesn't exist
  2. Sets up Row Level Security (RLS)
  3. Creates necessary policies for user access
  4. Creates performance indexes

  ## Table Structure
  - id: UUID primary key
  - user_id: References profiles table
  - barcode: Product barcode
  - product_name: Name of the product
  - brands: Brand information
  - image_url: Product image URL
  - ingredients_text: Ingredients list
  - nutriments: JSONB containing nutritional data
  - nutriscore_grade: Nutriscore rating
  - scanned_at: Timestamp when product was scanned

  ## Security
  - RLS enabled
  - Users can only view/insert/delete their own scanned products
*/

-- Create table if not exists
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

-- Enable RLS
ALTER TABLE scanned_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Users can view own scanned products" ON scanned_products;
DROP POLICY IF EXISTS "Users can insert own scanned products" ON scanned_products;
DROP POLICY IF EXISTS "Users can delete own scanned products" ON scanned_products;

-- Create policies
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS scanned_products_user_id_idx ON scanned_products(user_id);
CREATE INDEX IF NOT EXISTS scanned_products_scanned_at_idx ON scanned_products(scanned_at DESC);
CREATE INDEX IF NOT EXISTS scanned_products_barcode_idx ON scanned_products(barcode);
