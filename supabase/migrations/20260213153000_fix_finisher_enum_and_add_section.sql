-- Migration to add 'finisher' to block_type enum and 'section' column to workout_blocks

-- 1. Add 'finisher' to block_type enum
ALTER TYPE "public"."block_type" ADD VALUE IF NOT EXISTS 'finisher';

-- 2. Add 'section' column to workout_blocks
ALTER TABLE "public"."workout_blocks" 
ADD COLUMN IF NOT EXISTS "section" text NOT NULL DEFAULT 'main';

-- 3. Add check constraint for section values
ALTER TABLE "public"."workout_blocks" 
ADD CONSTRAINT "workout_blocks_section_check" 
CHECK (section IN ('warmup', 'main', 'cooldown'));

-- 4. Migrate existing 'warmup' blocks to 'main' section but keep type as 'warmup' for now?
-- Actually, user wants 'warmup' to be a section.
-- Strategy: update existing blocks of type 'warmup' to be section='warmup' and type='strength_linear' (or whatever default makes sense).
-- For now, let's keep type='warmup' valid until frontend is fully updated, but move them to section='warmup'.
UPDATE "public"."workout_blocks"
SET "section" = 'warmup'
WHERE "type" = 'warmup';
