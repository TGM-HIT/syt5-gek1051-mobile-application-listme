-- Vector clock entries (per list, per device)
CREATE TABLE vector_clocks (
    list_id   UUID   NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    device_id UUID   NOT NULL REFERENCES devices(id),
    counter   BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (list_id, device_id)
);

-- CRDT operations log
CREATE TABLE crdt_operations (
    id              UUID        PRIMARY KEY,
    list_id         UUID        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    device_id       UUID        NOT NULL REFERENCES devices(id),
    operation_type  VARCHAR(50) NOT NULL,
    payload         JSONB       NOT NULL,
    vector_clock    JSONB       NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crdt_ops_list_time ON crdt_operations(list_id, created_at);
CREATE INDEX idx_crdt_ops_device    ON crdt_operations(device_id);
