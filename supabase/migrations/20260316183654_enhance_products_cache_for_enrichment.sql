/*
  # Enhance Products Cache for Data Enrichment

  1. Schema Changes
    - Add `protein` (numeric) - protein content per 100g
    - Add `fat` (numeric) - fat content per 100g
    - Add `fiber` (numeric) - fiber content per 100g
    - Add `ash` (numeric) - ash/mineral content per 100g
    - Add `energy` (numeric) - energy/calories per 100g
    - Add `product_type` (text) - type of product (complete food, snack, treat, etc)
    - Add `is_veterinary_food` (boolean) - whether this is prescription/veterinary diet
    - Add `is_snack` (boolean) - whether this is a treat/snack/complementary food
    - Add `data_confidence` (text) - confidence level: high, medium, low
    - Add `enrichment_source` (text) - where enrichment data came from
    - Add `enriched_at` (timestamp) - when enrichment was performed

  2. Purpose
    - Support multi-source data enrichment
    - Track data quality and confidence
    - Store detailed nutrition information
    - Enable better product classification
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'protein'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN protein numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'fat'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN fat numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'fiber'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN fiber numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'ash'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN ash numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'energy'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN energy numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN product_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'is_veterinary_food'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN is_veterinary_food boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'is_snack'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN is_snack boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'data_confidence'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN data_confidence text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'enrichment_source'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN enrichment_source text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_cache' AND column_name = 'enriched_at'
  ) THEN
    ALTER TABLE products_cache ADD COLUMN enriched_at timestamptz;
  END IF;
END $$;