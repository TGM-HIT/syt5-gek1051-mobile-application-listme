-- Favorites (per device, quick-add items)
CREATE TABLE favorites (
    id          UUID         PRIMARY KEY,
    device_id   UUID         NOT NULL REFERENCES devices(id),
    item_name   VARCHAR(500) NOT NULL,
    emoji       VARCHAR(10),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(device_id, item_name)
);

-- Sync tokens (cross-device transfer)
CREATE TABLE sync_tokens (
    token             VARCHAR(32) PRIMARY KEY,
    created_by_device UUID        NOT NULL REFERENCES devices(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at        TIMESTAMPTZ
);

-- Sync token ↔ List mapping
CREATE TABLE sync_token_lists (
    sync_token VARCHAR(32) NOT NULL REFERENCES sync_tokens(token) ON DELETE CASCADE,
    list_id    UUID        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    PRIMARY KEY (sync_token, list_id)
);

-- Images (attached to items)
CREATE TABLE images (
    id            UUID          PRIMARY KEY,
    item_id       UUID          NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    url           VARCHAR(1000) NOT NULL,
    thumbnail_url VARCHAR(1000),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
