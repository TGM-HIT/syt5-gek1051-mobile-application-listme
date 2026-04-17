ALTER TABLE sync_tokens
    ADD COLUMN display_name_snapshot VARCHAR(100),
    ADD COLUMN profile_picture_snapshot TEXT,
    ADD COLUMN theme_snapshot VARCHAR(20) NOT NULL DEFAULT 'dark';
