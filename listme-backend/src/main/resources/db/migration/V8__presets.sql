CREATE TABLE presets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    emoji       VARCHAR(10)  NOT NULL DEFAULT '📋',
    created_by_device UUID REFERENCES devices(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE preset_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_id       UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
    name            VARCHAR(500) NOT NULL,
    quantity        NUMERIC(10,3),
    quantity_unit   VARCHAR(20),
    price           NUMERIC(10,2),
    image_url       TEXT,
    position        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_preset_items_preset ON preset_items(preset_id);
CREATE INDEX idx_presets_device      ON presets(created_by_device, created_at DESC);
