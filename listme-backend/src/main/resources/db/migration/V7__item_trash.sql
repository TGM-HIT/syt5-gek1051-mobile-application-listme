-- US23: Soft-delete (trash) for items
ALTER TABLE items ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_items_deleted_at_list ON items(list_id, deleted_at)
    WHERE deleted_at IS NOT NULL;
