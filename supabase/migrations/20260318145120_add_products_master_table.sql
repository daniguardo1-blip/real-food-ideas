/*
  # Create products_master table

  1. New Tables
    - `products_master`
      - `id` (uuid, primary key, auto-generated)
      - `barcode` (text, indexed for fast lookups)
      - `product_name` (text)
      - `brand` (text)
      - `ingredients` (text)
      - `protein` (float)
      - `fat` (float)
      - `fiber` (float)
      - `carbohydrates` (float)
      - `energy` (float)
      - `image_url` (text)
      - `source` (text)
      - `created_at` (timestamp, default now)

  2. Security
    - Enable RLS on `products_master` table
    - Add policy for authenticated users to read all products
    - Add policy for authenticated users to insert products

  3. Indexes
    - Create index on barcode for fast product lookups
*/

CREATE TABLE IF NOT EXISTS products_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text,
  product_name text,
  brand text,
  ingredients text,
  protein float,
  fat float,
  fiber float,
  carbohydrates float,
  energy float,
  image_url text,
  source text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_master_barcode ON products_master(barcode);

ALTER TABLE products_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all products"
  ON products_master
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products_master
  FOR INSERT
  TO authenticated
  WITH CHECK (true);