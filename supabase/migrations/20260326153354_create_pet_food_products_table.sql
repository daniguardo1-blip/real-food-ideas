/*
  # Create pet_food_products table
  
  1. New Table
    - `pet_food_products`
      - `id` (uuid, primary key) - Unique identifier
      - `barcode` (text, unique, required) - Product barcode
      - `product_name` (text, required) - Product name
      - `brand` (text, nullable) - Brand name
      - `ingredients` (text, nullable) - Ingredients list
      - `protein` (numeric, nullable) - Protein content per 100g
      - `fat` (numeric, nullable) - Fat content per 100g
      - `fiber` (numeric, nullable) - Fiber content per 100g
      - `carbohydrates` (numeric, nullable) - Carbohydrates content per 100g
      - `energy` (numeric, nullable) - Energy content per 100g (kcal)
      - `ash` (numeric, nullable) - Ash content per 100g
      - `image_url` (text, nullable) - Product image URL
      - `categories` (text, nullable) - Product categories
      - `nutriscore_grade` (text, nullable) - Nutriscore grade
      - `animal_type` (text, nullable) - Target animal (dog/cat/etc)
      - `is_veterinary_food` (boolean, default false) - Veterinary diet flag
      - `is_snack` (boolean, default false) - Snack/treat flag
      - `data_source` (text, nullable) - Source of the data
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `pet_food_products` table
    - Add policy for authenticated users to read all products
    - Only admins can insert/update/delete (will be added via admin panel later)
  
  3. Indexes
    - Index on barcode for fast lookups
    - Index on animal_type for filtering
*/

CREATE TABLE IF NOT EXISTS pet_food_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  product_name text NOT NULL,
  brand text,
  ingredients text,
  protein numeric,
  fat numeric,
  fiber numeric,
  carbohydrates numeric,
  energy numeric,
  ash numeric,
  image_url text,
  categories text,
  nutriscore_grade text,
  animal_type text,
  is_veterinary_food boolean DEFAULT false,
  is_snack boolean DEFAULT false,
  data_source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pet_food_products ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read pet food products
CREATE POLICY "Authenticated users can read pet food products"
  ON pet_food_products
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Public access for unauthenticated users (for product lookup)
CREATE POLICY "Public can read pet food products"
  ON pet_food_products
  FOR SELECT
  TO anon
  USING (true);

-- Create index on barcode for fast lookups
CREATE INDEX IF NOT EXISTS idx_pet_food_products_barcode ON pet_food_products(barcode);

-- Create index on animal_type for filtering
CREATE INDEX IF NOT EXISTS idx_pet_food_products_animal_type ON pet_food_products(animal_type);

-- Create index on brand for searching
CREATE INDEX IF NOT EXISTS idx_pet_food_products_brand ON pet_food_products(brand);
