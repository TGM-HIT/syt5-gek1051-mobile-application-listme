package com.oliwier.listmewear.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.*
import com.oliwier.listmewear.model.ShoppingItem
import com.oliwier.listmewear.presentation.theme.ListMeColors
import com.oliwier.listmewear.sync.SyncViewModel

@Composable
fun ListDetailScreen(listId: String, onBack: () -> Unit) {
    val context = LocalContext.current
    val vm: SyncViewModel = viewModel(factory = SyncViewModel.Factory(context))
    val list by remember(listId) { derivedStateOf { vm.getList(listId) } }

    if (list == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Liste nicht gefunden", color = ListMeColors.TextSecondary, fontSize = 13.sp)
        }
        return
    }

    val currentList = list!!
    val unchecked = currentList.items.count { !it.checked }
    // Unchecked items first
    val sortedItems = remember(currentList.items) { currentList.items.sortedBy { it.checked } }

    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(top = 28.dp, bottom = 16.dp, start = 8.dp, end = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            item {
                ListHeader {
                    Column {
                        Text(
                            "${currentList.emoji} ${currentList.name}",
                            fontSize = 13.sp,
                            color = ListMeColors.Accent,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            if (unchecked == 0) "Alles erledigt ✓" else "$unchecked übrig",
                            fontSize = 11.sp,
                            color = if (unchecked == 0) ListMeColors.Green else ListMeColors.TextSecondary
                        )
                    }
                }
            }
            if (sortedItems.isEmpty()) {
                item {
                    Box(
                        Modifier.fillMaxWidth().padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Keine Artikel", color = ListMeColors.TextSecondary, fontSize = 13.sp)
                    }
                }
            } else {
                items(sortedItems.size) { index ->
                    val item = sortedItems[index]
                    ItemRow(
                        item = item,
                        onToggle = { vm.checkItem(currentList.id, item.id, !item.checked) }
                    )
                }
            }
        }
    }
}

@Composable
private fun ItemRow(item: ShoppingItem, onToggle: () -> Unit) {
    ToggleChip(
        modifier = Modifier.fillMaxWidth(),
        checked = item.checked,
        onCheckedChange = { onToggle() },
        colors = ToggleChipDefaults.toggleChipColors(
            checkedStartBackgroundColor = ListMeColors.SurfaceVariant,
            checkedEndBackgroundColor = ListMeColors.SurfaceVariant,
            uncheckedStartBackgroundColor = ListMeColors.SurfaceVariant,
            uncheckedEndBackgroundColor = ListMeColors.SurfaceVariant
        ),
        toggleControl = {
            Icon(
                imageVector = ToggleChipDefaults.checkboxIcon(checked = item.checked),
                contentDescription = if (item.checked) "Erledigt" else "Offen",
                tint = if (item.checked) ListMeColors.Green else ListMeColors.TextSecondary
            )
        },
        label = {
            Text(
                text = item.name,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = if (item.checked) ListMeColors.CheckedText else ListMeColors.TextPrimary,
                textDecoration = if (item.checked) TextDecoration.LineThrough else TextDecoration.None
            )
        },
        secondaryLabel = if (item.quantity != null) {
            {
                Text(
                    text = "${item.quantity}${item.unit?.let { " $it" } ?: ""}",
                    fontSize = 11.sp,
                    color = ListMeColors.TextSecondary
                )
            }
        } else null
    )
}
