/*
  # Add User Submitted Products Table

  1. New Tables
    - `submitted_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `barcode` (text)
      - `product_name` (text)
      - `brand` (text)
      - `ingredients` (text)
      - `proteins` (numeric)
      - `fat` (numeric)
      - `carbohydrates` (numeric)
      - `image_url` (text, nullable)
      - `status` (text, default 'pending')
      - `submitted_at` (timestamptz)
      - `reviewed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `submitted_products` table
    - Add policy for users to insert their own submissions
    - Add policy for users to view their own submissions
*/

CREATE TABLE IF NOT EXISTS submitted_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode text NOT NULL,
  product_name text NOT NULL,
  brand text DEFAULT '',
  ingredients text DEFAULT '',
  proteins numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  carbohydrates numeric DEFAULT 0,
  image_url text,
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE submitted_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own product submissions"
  ON submitted_products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own product submissions"
  ON submitted_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);