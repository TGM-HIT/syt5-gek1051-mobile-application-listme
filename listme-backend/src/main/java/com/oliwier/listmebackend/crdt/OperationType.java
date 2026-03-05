package com.oliwier.listmebackend.crdt;

public enum OperationType {
    ITEM_CREATE,
    ITEM_UPDATE,   // name, category change
    ITEM_CHECK,    // checked toggled
    ITEM_DELETE,
    LIST_UPDATE    // name, emoji change
}
