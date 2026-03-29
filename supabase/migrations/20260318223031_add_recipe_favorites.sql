/*
  # Add Recipe Favorites Table

  1. New Tables
    - `recipe_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `ingredients` (text)
      - `preparation` (text)
      - `tip` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `recipe_favorites` table
    - Add policy for users to read their own favorites
    - Add policy for users to insert their own favorites
    - Add policy for users to delete their own favorites
*/

CREATE TABLE IF NOT EXISTS recipe_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  ingredients text NOT NULL,
  preparation text NOT NULL,
  tip text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipe favorites"
  ON recipe_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipe favorites"
  ON recipe_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipe favorites"
  ON recipe_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);