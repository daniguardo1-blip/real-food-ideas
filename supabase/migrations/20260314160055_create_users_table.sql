/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User ID matching auth.users
      - `email` (text, not null) - User's email address
      - `name` (text, optional) - User's name (added in profile)
      - `phone_number` (text, optional) - User's phone number (added in profile)
      - `language` (text, not null) - Selected language during registration (es, en, fr, de, it, pt, ru)
      - `pet_type` (text, optional) - Pet type selected in premium advisor (dog, cat, bird, fish, rabbit, other)
      - `premium_user` (boolean, default false) - Whether user has active premium subscription
      - `created_at` (timestamptz, default now) - Account creation timestamp

  2. Security
    - Enable RLS on `users` table
    - Users can read and update their own data
    - Service role can access all user data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  phone_number text,
  language text NOT NULL DEFAULT 'en',
  pet_type text,
  premium_user boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can access all data (for admin purposes)
CREATE POLICY "Service role can access all data"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create index on premium_user for analytics
CREATE INDEX IF NOT EXISTS users_premium_idx ON users(premium_user);
