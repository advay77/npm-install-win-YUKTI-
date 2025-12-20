-- Create interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
    id BIGSERIAL PRIMARY KEY,
    interview_id TEXT UNIQUE NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT,
    "interviewDuration" TEXT,
    "interviewType" TEXT[],
    "acceptResume" BOOLEAN DEFAULT false,
    "questionList" JSONB,
    "userEmail" TEXT NOT NULL,
    organization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on interview_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_interviews_interview_id ON public.interviews(interview_id);

-- Create index on userEmail for faster user queries
CREATE INDEX IF NOT EXISTS idx_interviews_user_email ON public.interviews("userEmail");

-- Enable Row Level Security
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own interviews
DROP POLICY IF EXISTS "Users can view their own interviews" ON public.interviews;
CREATE POLICY "Users can view their own interviews"
ON public.interviews
FOR SELECT
TO authenticated
USING ("userEmail" = auth.jwt()->>'email');

-- Policy: Allow authenticated users to insert their own interviews
DROP POLICY IF EXISTS "Users can create their own interviews" ON public.interviews;
CREATE POLICY "Users can create their own interviews"
ON public.interviews
FOR INSERT
TO authenticated
WITH CHECK ("userEmail" = auth.jwt()->>'email');

-- Policy: Allow authenticated users to update their own interviews
DROP POLICY IF EXISTS "Users can update their own interviews" ON public.interviews;
CREATE POLICY "Users can update their own interviews"
ON public.interviews
FOR UPDATE
TO authenticated
USING ("userEmail" = auth.jwt()->>'email')
WITH CHECK ("userEmail" = auth.jwt()->>'email');

-- Policy: Allow authenticated users to delete their own interviews
DROP POLICY IF EXISTS "Users can delete their own interviews" ON public.interviews;
CREATE POLICY "Users can delete their own interviews"
ON public.interviews
FOR DELETE
TO authenticated
USING ("userEmail" = auth.jwt()->>'email');

-- Optional: Grant admin full access (replace with your admin email)
DROP POLICY IF EXISTS "Admin has full access" ON public.interviews;
CREATE POLICY "Admin has full access"
ON public.interviews
FOR ALL
TO authenticated
USING ("userEmail" = 'syedmohammadaquib12@gmail.com');

-- =============================================
-- Tickets table + RLS for user-owned tickets
-- =============================================

CREATE TABLE IF NOT EXISTS public.tickets (
        id BIGSERIAL PRIMARY KEY,
        "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','open','closed','resolved')),
        created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If tickets already exists with integer userId, migrate to uuid and fix FK
ALTER TABLE public.tickets
    DROP CONSTRAINT IF EXISTS tickets_userId_fkey;
ALTER TABLE public.tickets
    ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE public.tickets
    ADD CONSTRAINT tickets_userId_fkey FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tickets_userId ON public.tickets("userId");

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select their own tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = public.tickets."userId"
            AND u.email = auth.jwt()->>'email'
    )
);

-- Allow authenticated users to insert their own tickets
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
CREATE POLICY "Users can create their own tickets"
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = public.tickets."userId"
            AND u.email = auth.jwt()->>'email'
    )
);

-- Allow authenticated users to update their own tickets
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = public.tickets."userId"
            AND u.email = auth.jwt()->>'email'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = public.tickets."userId"
            AND u.email = auth.jwt()->>'email'
    )
);

-- =============================================
-- Interview Details table (stores candidate runs)
-- =============================================

CREATE TABLE IF NOT EXISTS public."interview-details" (
    id BIGSERIAL PRIMARY KEY,
    interview_id TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    organization TEXT DEFAULT ''::TEXT,
    "acceptResume" BOOLEAN DEFAULT false,
    "resumeURL" TEXT,
    recomended TEXT DEFAULT 'No',
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional FK to interviews (keeps referential integrity)
-- Ensure the FK exists (Postgres doesn't support IF NOT EXISTS here reliably)
ALTER TABLE public."interview-details"
    DROP CONSTRAINT IF EXISTS fk_interview_details_interview;
ALTER TABLE public."interview-details"
    ADD CONSTRAINT fk_interview_details_interview
    FOREIGN KEY (interview_id)
    REFERENCES public.interviews(interview_id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_interview_details_interview_id
    ON public."interview-details"(interview_id);

CREATE INDEX IF NOT EXISTS idx_interview_details_user_email
    ON public."interview-details"("userEmail");

-- Enable RLS and keep open read/write (adjust if you want stricter rules)
ALTER TABLE public."interview-details" ENABLE ROW LEVEL SECURITY;

-- Recreate policies idempotently (Postgres doesn't support IF NOT EXISTS on policies)
DROP POLICY IF EXISTS "interview-details allow insert" ON public."interview-details";
DROP POLICY IF EXISTS "interview-details allow select" ON public."interview-details";

CREATE POLICY "interview-details allow insert"
ON public."interview-details"
FOR INSERT
TO public
WITH CHECK (TRUE);

CREATE POLICY "interview-details allow select"
ON public."interview-details"
FOR SELECT
TO public
USING (TRUE);

