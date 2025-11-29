/*
  # Create Error Logs Table

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `error_message` (text)
      - `error_stack` (text, nullable)
      - `context` (text)
      - `created_at` (timestamptz)
      - `resolved` (boolean, default false)
      - `resolved_at` (timestamptz, nullable)
      - `resolved_by` (uuid, nullable, references auth.users)

  2. Security
    - Enable RLS on `error_logs` table
    - Add policy for admins to view all errors
    - Add policy for users to view only their own errors
    - Add policy for anyone authenticated to insert errors
    - Add policy for admins to update errors
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message text NOT NULL,
  error_stack text,
  context text NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update error logs"
  ON error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
