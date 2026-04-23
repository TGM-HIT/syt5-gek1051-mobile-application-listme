-- Store category name and color snapshot on preset items so that
-- when a preset is applied to a new list, categories can be recreated.
ALTER TABLE preset_items
    ADD COLUMN category_name  VARCHAR(100),
    ADD COLUMN category_color VARCHAR(7);
