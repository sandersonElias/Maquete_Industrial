package com.maquete.industrial.ferrorama.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maquete.industrial.ferrorama.data.LocoState
import com.maquete.industrial.ferrorama.ui.components.SectionCard
import com.maquete.industrial.ferrorama.ui.theme.FeroBackground
import com.maquete.industrial.ferrorama.ui.theme.FeroCard
import com.maquete.industrial.ferrorama.ui.theme.FeroGlow
import com.maquete.industrial.ferrorama.ui.theme.FeroLoco
import com.maquete.industrial.ferrorama.ui.theme.FeroText
import com.maquete.industrial.ferrorama.ui.theme.FeroTextDim
import com.maquete.industrial.ferrorama.ui.theme.LocoBack
import com.maquete.industrial.ferrorama.ui.theme.LocoForward
import com.maquete.industrial.ferrorama.ui.theme.StatusOffline
import com.maquete.industrial.ferrorama.ui.theme.StatusOnline
import com.maquete.industrial.ferrorama.ui.viewmodel.FerroramaViewModel

/**
 * Aba Locomotivas: comando das 2 locomotivas Wi-Fi (ESP-12E) via backend.
 * Exige login (aba Conexão). Velocidade 60–255 (validada pelo backend).
 */
@Composable
fun LocomotivasScreen(
    viewModel: FerroramaViewModel,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(FeroBackground)
            .verticalScroll(rememberScrollState())
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (!viewModel.authenticated) {
            SectionCard(title = "AVISO") {
                Text(
                    text = "Faça login na aba Conexão para comandar as locomotivas.",
                    color = StatusOffline,
                    fontSize = 13.sp
                )
            }
        }

        viewModel.locos.forEach { loco ->
            LocoCard(
                loco = loco,
                enabled = viewModel.isConnected || viewModel.authenticated,
                onCommand = { cmd, speed -> viewModel.sendLocoCommand(loco.locoId, cmd, speed) }
            )
        }
    }
}

@Composable
private fun LocoCard(
    loco: LocoState,
    enabled: Boolean,
    onCommand: (command: String, speed: Int) -> Unit
) {
    var speed by remember(loco.locoId) { mutableFloatStateOf((if (loco.speed > 0) loco.speed else 200).toFloat()) }

    SectionCard(
        title = loco.name.uppercase()
    ) {
        // Status geral
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (loco.connected) Icons.Default.Wifi else Icons.Default.WifiOff,
                    contentDescription = null,
                    tint = if (loco.connected) StatusOnline else StatusOffline,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = loco.locoId.uppercase(),
                    color = FeroTextDim,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
            BatteryPill(battery = loco.battery)
        }

        // Direção e velocidade atuais
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = when (loco.direction) {
                    "forward" -> "Frente"
                    "backward" -> "Ré"
                    else -> "Parada"
                },
                color = when (loco.direction) {
                    "forward" -> LocoForward
                    "backward" -> LocoBack
                    else -> FeroTextDim
                },
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "${loco.speed}",
                color = FeroGlow,
                fontSize = 16.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Velocidade
        Text("Velocidade", color = FeroTextDim, fontSize = 11.sp)
        Slider(
            value = speed,
            onValueChange = { speed = it },
            valueRange = 60f..255f,
            enabled = enabled && loco.connected,
            modifier = Modifier.fillMaxWidth()
        )

        // Comandos
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            LocoButton(
                label = "RÉ",
                icon = Icons.AutoMirrored.Filled.ArrowBack,
                color = LocoBack,
                enabled = enabled && loco.connected,
                onClick = { onCommand("backward", speed.toInt()) }
            )
            LocoButton(
                label = "PARAR",
                icon = Icons.Default.Stop,
                color = StatusOffline,
                enabled = enabled && loco.connected,
                onClick = { onCommand("stop", 0) }
            )
            LocoButton(
                label = "FRENTE",
                icon = Icons.AutoMirrored.Filled.ArrowForward,
                color = LocoForward,
                enabled = enabled && loco.connected,
                onClick = { onCommand("forward", speed.toInt()) }
            )
        }

        if (!enabled) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Desconectado do HC-05? Comande pelas placas ou reconecte.",
                color = FeroTextDim,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
private fun RowScope.LocoButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = color,
            contentColor = FeroBackground,
            disabledContainerColor = FeroCard.copy(alpha = 0.5f),
            disabledContentColor = FeroTextDim.copy(alpha = 0.5f)
        ),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.weight(1f)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(4.dp))
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun BatteryPill(battery: Double) {
    val pct = battery.coerceIn(0.0, 100.0)
    val color = when {
        pct > 50 -> StatusOnline
        pct > 20 -> FeroLoco
        else -> StatusOffline
    }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Icon(
            Icons.Default.BatteryFull,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(14.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = if (battery > 0) "${pct.toInt()}%" else "--",
            color = color,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace
        )
    }
}