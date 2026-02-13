-- Force add 'finisher' to block_type enum (safe)
-- We use a DO block to avoid errors if it exists, or just catch the exception
DO $$
BEGIN
    ALTER TYPE "public"."block_type" ADD VALUE 'finisher';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
