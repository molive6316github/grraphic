/*
  # Add Admin Policy for Viewing All Analyses

  1. Changes
    - Add policy for admins to view all design analyses (not just public or their own)
    
  2. Security
    - Only authenticated users who are in the admins table can view all analyses
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'design_analyses' 
    AND policyname = 'Admins can view all analyses'
  ) THEN
    CREATE POLICY "Admins can view all analyses"
      ON design_analyses
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admins
          WHERE admins.user_id = auth.uid()
        )
      );
  END IF;
END $$;
