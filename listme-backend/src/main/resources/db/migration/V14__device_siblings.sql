-- Tracks pairs of devices that share the same identity (linked via sync token).
-- Both directions are stored: (A,B) and (B,A).
CREATE TABLE device_siblings (
    device_id_a UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    device_id_b UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (device_id_a, device_id_b)
);

CREATE INDEX idx_device_siblings_b ON device_siblings(device_id_b);
