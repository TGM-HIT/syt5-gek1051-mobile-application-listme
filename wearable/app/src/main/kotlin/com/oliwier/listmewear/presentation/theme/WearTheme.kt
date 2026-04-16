package com.oliwier.listmewear.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.MaterialTheme

// Catppuccin Frappe — matches the ListMe frontend theme
object ListMeColors {
    val Surface        = Color(0xFF303446)  // Frappe base
    val SurfaceVariant = Color(0xFF414559)  // Frappe surface0
    val Accent         = Color(0xFF8CAAEE)  // Frappe blue
    val Green          = Color(0xFFA6D189)  // Frappe green
    val TextPrimary    = Color(0xFFC6D0F5)  // Frappe text
    val TextSecondary  = Color(0xFFA5ADCE)  // Frappe subtext1
    val CheckedText    = Color(0xFF626880)  // Frappe overlay0
}

@Composable
fun ListMeWearTheme(content: @Composable () -> Unit) {
    MaterialTheme(content = content)
}
