package com.oliwier.listmewear.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.*
import com.oliwier.listmewear.model.ShoppingList
import com.oliwier.listmewear.presentation.theme.ListMeColors
import com.oliwier.listmewear.sync.SyncViewModel

@Composable
fun ListsScreen(onListClick: (String) -> Unit) {
    val context = LocalContext.current
    val vm: SyncViewModel = viewModel(factory = SyncViewModel.Factory(context))
    val lists by vm.lists.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    val isOnline by vm.isOnline.collectAsState()

    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) }
    ) {
        when {
            isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(indicatorColor = ListMeColors.Accent)
            }
            lists.isEmpty() -> EmptyListsState()
            else -> ListsContent(lists, isOnline, onListClick) { vm.refreshOnline() }
        }
    }
}

@Composable
private fun EmptyListsState() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            text = "Noch keine Listen.\nHandy öffnen und\nSync-Link teilen.",
            textAlign = TextAlign.Center,
            fontSize = 13.sp,
            color = ListMeColors.TextSecondary,
            modifier = Modifier.padding(16.dp)
        )
    }
}

@Composable
private fun ListsContent(
    lists: List<ShoppingList>,
    isOnline: Boolean,
    onListClick: (String) -> Unit,
    onRefresh: () -> Unit
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(top = 28.dp, bottom = 16.dp, start = 8.dp, end = 8.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        item {
            ListHeader {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text("Listen", fontSize = 13.sp, color = ListMeColors.Accent)
                    if (!isOnline) Text("(offline)", fontSize = 11.sp, color = ListMeColors.TextSecondary)
                }
            }
        }
        items(lists.size) { index ->
            ListItem(list = lists[index], onClick = { onListClick(lists[index].id) })
        }
        item {
            CompactChip(
                onClick = onRefresh,
                colors = ChipDefaults.chipColors(backgroundColor = ListMeColors.SurfaceVariant),
                label = { Text("Aktualisieren", fontSize = 11.sp, color = ListMeColors.TextSecondary) }
            )
        }
    }
}

@Composable
private fun ListItem(list: ShoppingList, onClick: () -> Unit) {
    val unchecked = list.items.count { !it.checked }
    val total = list.items.size
    Chip(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        colors = ChipDefaults.chipColors(backgroundColor = ListMeColors.SurfaceVariant),
        label = {
            Text(
                text = "${list.emoji} ${list.name}",
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = ListMeColors.TextPrimary
            )
        },
        secondaryLabel = {
            Text(
                text = if (total == 0) "Leer" else "$unchecked von $total offen",
                fontSize = 11.sp,
                color = if (unchecked == 0) ListMeColors.Green else ListMeColors.TextSecondary
            )
        }
    )
}
