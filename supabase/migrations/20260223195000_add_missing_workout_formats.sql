-- Hotfix: align workout_format enum with active training_methodologies codes.
-- Safe/idempotent migration using DO blocks to avoid duplicate_object failures.

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'EMOM_ALT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'E2MOM';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'FOR_TIME';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'CHIPPER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'DEATH_BY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'TABATA';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'LADDER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'INTERVALS';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'CLUSTER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'DROP_SET';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'GIANT_SET';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'SUPER_SET';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'NOT_FOR_TIME';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'TEMPO';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'DROPSET_FINISHER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'REST_PAUSE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'LADDER_FINISHER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE '21S';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE 'ISO_HOLD';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.workout_format ADD VALUE '1_5_REPS';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

