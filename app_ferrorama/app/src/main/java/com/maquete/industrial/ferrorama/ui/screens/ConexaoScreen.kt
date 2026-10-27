package com.maquete.industrial.ferrorama.ui.screens

import android.bluetooth.BluetoothDevice
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maquete.industrial.ferrorama.ui.components.DevicePickerDialog
import com.maquete.industrial.ferrorama.ui.components.SectionCard
import com.maquete.industrial.ferrorama.ui.theme.FeroBackground
import com.maquete.industrial.ferrorama.ui.theme.FeroBorder
import com.maquete.industrial.ferrorama.ui.theme.FeroCard
import com.maquete.industrial.ferrorama.ui.theme.FeroGlow
import com.maquete.industrial.ferrorama.ui.theme.FeroText
import com.maquete.industrial.ferrorama.ui.theme.FeroTextDim
import com.maquete.industrial.ferrorama.ui.theme.StatusOffline
import com.maquete.industrial.ferrorama.ui.theme.StatusOnline
import com.maquete.industrial.ferrorama.ui.theme.StatusWarn
import com.maquete.industrial.ferrorama.ui.viewmodel.FerroramaViewModel

/**
 * Aba Conexão: Bluetooth (HC-05, agulhas) + servidor (locomotivas Wi-Fi).
 */
@Composable
fun ConexaoScreen(
    viewModel: FerroramaViewModel,
    modifier: Modifier = Modifier,
    onRequestBluetoothPermissions: () -> Unit,
    onEnableBluetooth: () -> Unit
) {
    var showDevicePicker by remember { mutableStateOf(false) }
    var pairedDevices by remember { mutableStateOf<List<BluetoothDevice>>(emptyList()) }
    var serverUrl by remember { mutableStateOf(viewModel.savedServerUrl()) }
    var username by remember { mutableStateOf(viewModel.savedUsername()) }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .background(FeroBackground)
            .verticalScroll(rememberScrollState())
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // ── Bluetooth ──────────────────────────────────────────────
        SectionCard(title = "BLUETOOTH — AGULHAS (HC-05)") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = if (viewModel.isConnected)
                            "Conectado: ${viewModel.btDeviceName ?: "HC-05"}"
                        else
                            "Desconectado",
                        color = if (viewModel.isConnected) StatusOnline else FeroTextDim,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "Agulhas 1–3 · Sensores 1–7 · Semáforo",
                        color = FeroTextDim,
                        fontSize = 11.sp
                    )
                }
                Button(
                    onClick = {
                        onRequestBluetoothPermissions()
                        onEnableBluetooth()
                        pairedDevices = viewModel.getPairedDevices()
                        showDevicePicker = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = FeroGlow)
                ) {
                    Icon(
                        Icons.Default.Bluetooth, contentDescription = null,
                        modifier = Modifier.size(18.dp), tint = FeroBackground
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (viewModel.isConnected) "Trocar" else "Conectar", color = FeroBackground)
                }
            }
            if (viewModel.isConnected) {
                TextButtonDisconnect(
                    onClick = { viewModel.disconnectBluetooth() }
                )
            }
        }

        // ── Servidor (locomotivas Wi-Fi) ──────────────────────────
        SectionCard(title = "SERVIDOR — LOCOMOTIVAS (Wi-Fi)") {
            OutlinedTextField(
                value = serverUrl,
                onValueChange = { serverUrl = it },
                label = { Text("URL do backend", color = FeroTextDim) },
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.fillMaxWidth()
            )
            Button(
                onClick = {
                    viewModel.setServerUrl(serverUrl.trim())
                    viewModel.connectServer()
                },
                colors = ButtonDefaults.buttonColors(containerColor = FeroCard),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    if (viewModel.serverConnected) Icons.Default.CloudDone
                    else Icons.Default.CloudOff,
                    contentDescription = null,
                    tint = if (viewModel.serverConnected) StatusOnline else FeroTextDim,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    if (viewModel.serverConnected) "Conectado ao servidor"
                    else "Conectar ao servidor",
                    color = FeroText
                )
            }
            ServerStatusRow(viewModel)
            Spacer(modifier = Modifier.height(4.dp))

            // ── Login ─────────────────────────────────────────────
            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Usuário", color = FeroTextDim) },
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Senha", color = FeroTextDim) },
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.fillMaxWidth()
            )
            Button(
                onClick = { viewModel.login(username, password) },
                enabled = !viewModel.serverLoading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (viewModel.authenticated) StatusOnline else FeroGlow
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (viewModel.serverLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = FeroBackground
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Entrando...", color = FeroBackground)
                } else {
                    Icon(
                        Icons.Default.Login, contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = if (viewModel.authenticated) FeroBackground else FeroBackground
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        if (viewModel.authenticated) "Logado — pode comandar"
                        else "Entrar / autenticar",
                        color = FeroBackground
                    )
                }
            }
            if (viewModel.authenticated) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = { viewModel.fetchLocomotives() },
                        colors = ButtonDefaults.buttonColors(containerColor = FeroCard),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            Icons.Default.Refresh, contentDescription = null,
                            tint = FeroTextDim, modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Atualizar estados", color = FeroText)
                    }
                }
            }
        }

        // ── Monitor serial ───────────────────────────────────────
        SectionCard(title = "MONITOR SERIAL") {
            Text(
                text = viewModel.lastRawLine ?: "— aguardando dados do HC-05 —",
                color = FeroGlow,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }

    if (showDevicePicker) {
        DevicePickerDialog(
            devices = pairedDevices.map { (it.name ?: "?") to it.address },
            onSelect = { _, address ->
                val device = pairedDevices.find { it.address == address }
                if (device != null) viewModel.connectTo(device)
                showDevicePicker = false
            },
            onDismiss = { showDevicePicker = false }
        )
    }
}

@Composable
private fun ServerStatusRow(viewModel: FerroramaViewModel) {
    val dotColor = when {
        viewModel.authenticated -> StatusOnline
        viewModel.serverConnected -> StatusWarn
        else -> StatusOffline
    }
    val label = when {
        viewModel.authenticated -> "Autenticado · aguardando ESPs"
        viewModel.serverConnected -> "Socket conectado · sem login"
        else -> "Servidor offline / não conectado"
    }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(dotColor, RoundedCornerShape(50))
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(label, color = FeroTextDim, fontSize = 12.sp)
    }
}

@Composable
private fun TextButtonDisconnect(onClick: () -> Unit) {
    androidx.compose.material3.TextButton(onClick = onClick) {
        Text("Desconectar", color = FeroTextDim, fontSize = 12.sp)
    }
}