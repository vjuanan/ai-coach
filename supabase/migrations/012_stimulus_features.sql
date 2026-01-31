-- ============================================
-- STIMULUS FEATURES TABLE
-- ============================================

CREATE TABLE stimulus_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE, -- Nullable for system defaults
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- Hex code or CSS value
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_stimulus_coach ON stimulus_features(coach_id);

-- Update trigger
CREATE TRIGGER update_stimulus_features_updated_at
    BEFORE UPDATE ON stimulus_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE stimulus_features ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Coaches can view system defaults (coach_id IS NULL)
CREATE POLICY "Coaches can view system defaults"
    ON stimulus_features FOR SELECT
    USING (coach_id IS NULL);

-- 2. Coaches can view/manage their own features
CREATE POLICY "Coaches can view own features"
    ON stimulus_features FOR SELECT
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY "Coaches can manage own features"
    ON stimulus_features FOR ALL
    USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));


-- ============================================
-- MODIFY DAYS TABLE
-- ============================================

ALTER TABLE days
ADD COLUMN stimulus_id UUID REFERENCES stimulus_features(id) ON DELETE SET NULL;

CREATE INDEX idx_days_stimulus ON days(stimulus_id);
