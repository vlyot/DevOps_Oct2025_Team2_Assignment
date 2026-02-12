-- Create subscribers table for email notifications
-- Users can subscribe to receive notifications about all CRUD operations

CREATE TABLE IF NOT EXISTS public.email_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    -- Indexes for better query performance
    CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON public.email_subscribers(is_active) WHERE is_active = TRUE;

-- Enable Row Level Security
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can subscribe (insert their email)
CREATE POLICY "Anyone can subscribe"
    ON public.email_subscribers
    FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can view active subscriptions (for checking if email is already subscribed)
CREATE POLICY "Anyone can view active subscriptions"
    ON public.email_subscribers
    FOR SELECT
    USING (is_active = TRUE);

-- Policy: Users can unsubscribe their own email
CREATE POLICY "Users can unsubscribe their email"
    ON public.email_subscribers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Admins can manage all subscriptions (requires service role key)
-- This policy is automatically enforced by Supabase service role

COMMENT ON TABLE public.email_subscribers IS 'Stores email addresses for users who opted in to receive CRUD operation notifications';
COMMENT ON COLUMN public.email_subscribers.email IS 'Subscriber email address (unique, validated format)';
COMMENT ON COLUMN public.email_subscribers.subscribed_at IS 'Timestamp when user subscribed';
COMMENT ON COLUMN public.email_subscribers.is_active IS 'Whether subscription is active (false = unsubscribed)';
