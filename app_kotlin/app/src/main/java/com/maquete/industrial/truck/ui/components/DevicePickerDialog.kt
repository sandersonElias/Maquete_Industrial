package com.maquete.industrial.truck.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.maquete.industrial.truck.ui.theme.*

@Composable
fun DevicePickerDialog(
    devices: List<Pair<String, String>>,
    onSelect: (name: String, address: String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        title = {
            Text(
                text = "Bluetooth",
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "Selecione o HC-05 pareado",
                    color = TextDim,
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(12.dp))

                if (devices.isEmpty()) {
                    Text(
                        text = "Nenhum dispositivo pareado encontrado",
                        color = Warning,
                        style = MaterialTheme.typography.bodyMedium
                    )
                } else {
                    LazyColumn {
                        items(devices) { (name, address) ->
                            ListItem(
                                headlineContent = { Text(name, color = TextPrimary) },
                                supportingContent = { Text(address, color = TextDim) },
                                leadingContent = {
                                    Icon(
                                        Icons.Default.Bluetooth,
                                        contentDescription = null,
                                        tint = PrimaryGreen
                                    )
                                },
                                modifier = Modifier
                                    .clickable { onSelect(name, address) }
                                    .padding(vertical = 4.dp)
                            )
                            HorizontalDivider(color = DarkBorder)
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Error)
            }
        }
    )
}
