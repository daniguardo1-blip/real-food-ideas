/*
  # Add Products Cache Table

  1. New Tables
    - `products_cache`
      - `id` (uuid, primary key)
      - `barcode` (text, unique, indexed)
      - `product_name` (text)
      - `brands` (text)
      - `image_url` (text)
      - `ingredients_text` (text)
      - `nutriments` (jsonb)
      - `nutriscore_grade` (text)
      - `categories` (text)
      - `source` (text) - which API the product was found from
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `products_cache` table
    - Add policy for authenticated users to read cached products
    - Add policy for authenticated users to insert new cached products

  3. Purpose
    - Cache products found from external APIs (UPCitemDB, Barcode Lookup)
    - Reduce API calls by reusing cached product data
    - Improve app performance and reliability
*/

CREATE TABLE IF NOT EXISTS products_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  product_name text DEFAULT '',
  brands text DEFAULT '',
  image_url text DEFAULT '',
  ingredients_text text DEFAULT '',
  nutriments jsonb DEFAULT '{}'::jsonb,
  nutriscore_grade text DEFAULT '',
  categories text DEFAULT '',
  source text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_cache_barcode_idx ON products_cache(barcode);

ALTER TABLE products_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read cached products"
  ON products_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert cached products"
  ON products_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update cached products"
  ON products_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);