-- Persistent user identity (the "/<userId>" URL)
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    display_name    VARCHAR(100),
    profile_picture TEXT,
    theme           VARCHAR(20) NOT NULL DEFAULT 'dark',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Associate devices with a user
ALTER TABLE devices ADD COLUMN user_id UUID REFERENCES users(id);

-- Associate lists with a user (primary ownership)
ALTER TABLE lists ADD COLUMN user_id UUID REFERENCES users(id);

-- Associate presets with a user
ALTER TABLE presets ADD COLUMN user_id UUID REFERENCES users(id);

-- ── Migrate existing data ────────────────────────────────────────────────────

-- Every existing device becomes its own user (1:1 bootstrap)
INSERT INTO users (id, display_name, profile_picture, created_at)
SELECT id, display_name, profile_picture, created_at
FROM devices
ON CONFLICT (id) DO NOTHING;

-- Devices point to their user
UPDATE devices SET user_id = id WHERE user_id IS NULL;

-- Lists owned by whoever created them
UPDATE lists SET user_id = created_by_device WHERE user_id IS NULL;

-- Presets owned by whoever created them (system presets with NULL created_by_device stay NULL)
UPDATE presets SET user_id = created_by_device
WHERE user_id IS NULL AND created_by_device IS NOT NULL;
