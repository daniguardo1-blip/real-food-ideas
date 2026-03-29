/*
  # Add Health Reminders Table

  1. New Tables
    - `health_reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `type` (text) - vaccination, deworming, or vetVisit
      - `date` (date)
      - `time` (time)
      - `notes` (text)
      - `notification_id` (text) - for managing scheduled notifications
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `health_reminders` table
    - Add policies for users to manage their own reminders
*/

CREATE TABLE IF NOT EXISTS health_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('vaccination', 'deworming', 'vetVisit')),
  date date NOT NULL,
  time time NOT NULL,
  notes text DEFAULT '',
  notification_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE health_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health reminders"
  ON health_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health reminders"
  ON health_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health reminders"
  ON health_reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health reminders"
  ON health_reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_health_reminders_user_id ON health_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reminders_date ON health_reminders(date);
