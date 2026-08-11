package com.maquete.industrial.truck.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.BluetoothConnected
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.maquete.industrial.truck.ui.theme.*

@Composable
fun Header(
    isConnected: Boolean,
    deviceName: String?,
    onConnectClick: () -> Unit,
    onDisconnectClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(DarkSurface)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = buildAnnotatedString {
                append("MAQUETE ")
                withStyle(SpanStyle(color = PrimaryGreen)) {
                    append("RC")
                }
            },
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.weight(1f)
        )

        if (isConnected) {
            OutlinedButton(
                onClick = onDisconnectClick,
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = Connected.copy(alpha = 0.1f),
                    contentColor = Connected
                )
            ) {
                Icon(
                    Icons.Default.BluetoothConnected,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(deviceName ?: "HC-05")
            }
        } else {
            Button(
                onClick = onConnectClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = PrimaryGreen
                )
            ) {
                Icon(
                    Icons.Default.Bluetooth,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("CONECTAR")
            }
        }
    }
}
