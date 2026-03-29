/*
  # Create user_submitted_products table

  1. New Tables
    - `user_submitted_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `product_name` (text)
      - `brand` (text)
      - `ingredients` (text array)
      - `proteins` (text)
      - `fat` (text)
      - `carbohydrates` (text)
      - `barcode` (text)
      - `status` (text, default 'pending')
      - `submitted_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `user_submitted_products` table
    - Add policy for authenticated users to insert their own submissions
    - Add policy for authenticated users to read their own submissions
*/

CREATE TABLE IF NOT EXISTS user_submitted_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  brand text NOT NULL,
  ingredients text[] NOT NULL DEFAULT '{}',
  proteins text DEFAULT '0',
  fat text DEFAULT '0',
  carbohydrates text DEFAULT '0',
  barcode text DEFAULT '',
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE user_submitted_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own product submissions"
  ON user_submitted_products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own product submissions"
  ON user_submitted_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);