/*
  # Create Gradi Chat Logs Table

  1. New Tables
    - `gradi_chat_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable for anonymous chats)
      - `session_id` (text) - to group messages from the same conversation
      - `message_role` (text) - 'user' or 'assistant'
      - `message_content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `gradi_chat_logs` table
    - Add policy for admins to view all chat logs
    - Add policy for users to view their own chat logs
    - Add policy for anyone to insert chat logs (users can log their own chats)
*/

CREATE TABLE IF NOT EXISTS gradi_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  message_role text NOT NULL CHECK (message_role IN ('user', 'assistant')),
  message_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gradi_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all chat logs"
  ON gradi_chat_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own chat logs"
  ON gradi_chat_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can insert chat logs"
  ON gradi_chat_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_gradi_chat_logs_user_id ON gradi_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gradi_chat_logs_session_id ON gradi_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_gradi_chat_logs_created_at ON gradi_chat_logs(created_at DESC);
