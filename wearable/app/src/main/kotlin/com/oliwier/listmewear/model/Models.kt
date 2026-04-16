package com.oliwier.listmewear.model

data class ShoppingList(
    val id: String,
    val name: String,
    val emoji: String = "🛒",
    val items: List<ShoppingItem> = emptyList()
)

data class ShoppingItem(
    val id: String,
    val name: String,
    val checked: Boolean = false,
    val quantity: String? = null,
    val unit: String? = null
)
