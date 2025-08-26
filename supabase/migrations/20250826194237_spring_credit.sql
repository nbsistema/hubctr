/*
  # Fix empresas table - make email optional

  1. Changes
    - Remove NOT NULL constraint from email column in empresas table
    - Make email optional for company registration

  2. Security
    - Maintain existing RLS policies
*/

-- Remove NOT NULL constraint from email column
ALTER TABLE empresas ALTER COLUMN email DROP NOT NULL;

-- Update unique constraint to allow multiple NULL values
DROP INDEX IF EXISTS empresas_email_key;
CREATE UNIQUE INDEX empresas_email_unique ON empresas(email) WHERE email IS NOT NULL;