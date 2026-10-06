package com.maquete.industrial.ferrorama.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.maquete.industrial.ferrorama.ui.theme.FeroBorder
import com.maquete.industrial.ferrorama.ui.theme.FeroGlow
import com.maquete.industrial.ferrorama.ui.theme.FeroSurface
import com.maquete.industrial.ferrorama.ui.theme.FeroText
import com.maquete.industrial.ferrorama.ui.theme.FeroTextDim

/** Seletor de dispositivo HC-05 pareado (mesmo padrão do app do caminhão). */
@Composable
fun DevicePickerDialog(
    devices: List<Pair<String, String>>,
    onSelect: (name: String, address: String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = FeroSurface,
        title = { Text(text = "Bluetooth", color = FeroText) },
        text = {
            Column {
                Text(
                    text = "Selecione o HC-05 pareado (agulhas do ferrorama)",
                    color = FeroTextDim,
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.padding(top = 12.dp))

                if (devices.isEmpty()) {
                    Text(
                        text = "Nenhum dispositivo Bluetooth pareado. Pareie um HC-05 nas configurações do aparelho.",
                        color = FeroGlow,
                        style = MaterialTheme.typography.bodyMedium
                    )
                } else {
                    LazyColumn {
                        items(devices) { (name, address) ->
                            ListItem(
                                headlineContent = { Text(name, color = FeroText) },
                                supportingContent = { Text(address, color = FeroTextDim) },
                                leadingContent = {
                                    Icon(
                                        Icons.Default.Bluetooth,
                                        contentDescription = null,
                                        tint = FeroGlow,
                                        modifier = Modifier.size(24.dp)
                                    )
                                },
                                modifier = Modifier
                                    .clickable { onSelect(name, address) }
                                    .padding(vertical = 4.dp)
                            )
                            HorizontalDivider(color = FeroBorder)
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = FeroTextDim)
            }
        }
    )
}