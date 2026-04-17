-- Idempotent re-seed: inserts the system default preset if it is missing.
-- Needed because V11 may have been recorded in flyway_schema_history on the
-- production DB before its INSERT statements were actually executed.

INSERT INTO presets (id, name, emoji, created_by_device)
VALUES ('00000000-0000-0000-0000-000000000001', 'Wocheneinkauf', '🛒', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO preset_items (preset_id, name, quantity, quantity_unit, position)
SELECT '00000000-0000-0000-0000-000000000001'::uuid,
       v.name,
       v.quantity::numeric(10,3),
       v.quantity_unit,
       v.position::integer
FROM (VALUES
    ('Eier',             10::numeric,  'Stück',    0),
    ('Milch',             1::numeric,  'L',        1),
    ('Butter',          250::numeric,  'g',        2),
    ('Brot',              1::numeric,  NULL,       3),
    ('Käse',            200::numeric,  'g',        4),
    ('Joghurt',         500::numeric,  'g',        5),
    ('Äpfel',             1::numeric,  'kg',       6),
    ('Bananen',           1::numeric,  'Bund',     7),
    ('Tomaten',         500::numeric,  'g',        8),
    ('Gurke',             1::numeric,  'Stück',    9),
    ('Kartoffeln',        1::numeric,  'kg',      10),
    ('Zwiebeln',        500::numeric,  'g',       11),
    ('Nudeln',          500::numeric,  'g',       12),
    ('Reis',            500::numeric,  'g',       13),
    ('Olivenöl',          1::numeric,  'Flasche', 14),
    ('Salz',              1::numeric,  'Packung', 15),
    ('Pfeffer',           1::numeric,  'Packung', 16),
    ('Hähnchenbrust',   500::numeric,  'g',       17),
    ('Hackfleisch',     400::numeric,  'g',       18),
    ('Toilettenpapier',   1::numeric,  'Packung', 19)
) AS v(name, quantity, quantity_unit, position)
WHERE NOT EXISTS (
    SELECT 1 FROM preset_items
    WHERE preset_id = '00000000-0000-0000-0000-000000000001'
);
