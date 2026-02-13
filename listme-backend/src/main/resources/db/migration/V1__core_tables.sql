-- Devices (anonymous identity)
CREATE TABLE devices (
    id         UUID PRIMARY KEY,
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shopping lists
CREATE TABLE lists (
    id                UUID PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    emoji             VARCHAR(10)  NOT NULL DEFAULT '🛒',
    created_by_device UUID         NOT NULL REFERENCES devices(id),
    share_token       VARCHAR(16)  UNIQUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Items within a list
CREATE TABLE items (
    id                UUID PRIMARY KEY,
    list_id           UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    name              VARCHAR(500) NOT NULL,
    checked           BOOLEAN      NOT NULL DEFAULT FALSE,
    position          INTEGER      NOT NULL DEFAULT 0,
    created_by_device UUID         NOT NULL REFERENCES devices(id),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_list ON items(list_id, position);

-- Which devices have access to which lists
CREATE TABLE list_devices (
    list_id   UUID        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    device_id UUID        NOT NULL REFERENCES devices(id),
    role      VARCHAR(20) NOT NULL DEFAULT 'owner',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (list_id, device_id)
);
