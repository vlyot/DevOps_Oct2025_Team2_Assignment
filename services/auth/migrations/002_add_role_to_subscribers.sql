-- Add role column to email_subscribers table
ALTER TABLE email_subscribers
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'stakeholder'
CHECK (role IN ('admin', 'developer', 'stakeholder'));

-- Add notification_types column for granular preferences (future use)
ALTER TABLE email_subscribers
ADD COLUMN IF NOT EXISTS notification_types TEXT[] DEFAULT ARRAY['pipeline_failure', 'security_alert'];

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_email_subscribers_role ON email_subscribers(role) WHERE is_active = true;

-- Backfill existing subscribers with 'stakeholder' role
UPDATE email_subscribers
SET role = 'stakeholder'
WHERE role IS NULL;

-- Make role NOT NULL after backfill
ALTER TABLE email_subscribers
ALTER COLUMN role SET NOT NULL;
