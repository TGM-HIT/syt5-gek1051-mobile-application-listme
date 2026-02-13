-- Categories (per list)
CREATE TABLE categories (
    id       UUID         PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    color    VARCHAR(7),
    list_id  UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    position INTEGER      NOT NULL DEFAULT 0
);

-- Labels (per list)
CREATE TABLE labels (
    id      UUID         PRIMARY KEY,
    name    VARCHAR(100) NOT NULL,
    color   VARCHAR(7),
    list_id UUID         NOT NULL REFERENCES lists(id) ON DELETE CASCADE
);

-- Item ↔ Label join table
CREATE TABLE item_labels (
    item_id  UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, label_id)
);

-- Add category FK to items
ALTER TABLE items ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
