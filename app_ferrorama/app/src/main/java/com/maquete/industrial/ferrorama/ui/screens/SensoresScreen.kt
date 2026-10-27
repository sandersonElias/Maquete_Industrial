package com.maquete.industrial.ferrorama.ui.screens

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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maquete.industrial.ferrorama.data.FerroData
import com.maquete.industrial.ferrorama.data.SensorState
import com.maquete.industrial.ferrorama.ui.components.SectionCard
import com.maquete.industrial.ferrorama.ui.theme.FeroBackground
import com.maquete.industrial.ferrorama.ui.theme.FeroBorder
import com.maquete.industrial.ferrorama.ui.theme.FeroCard
import com.maquete.industrial.ferrorama.ui.theme.FeroGlow
import com.maquete.industrial.ferrorama.ui.theme.FeroText
import com.maquete.industrial.ferrorama.ui.theme.FeroTextDim
import com.maquete.industrial.ferrorama.ui.theme.GateGreen
import com.maquete.industrial.ferrorama.ui.theme.GateRed
import com.maquete.industrial.ferrorama.ui.theme.GateYellow
import com.maquete.industrial.ferrorama.ui.theme.StatusOffline
import com.maquete.industrial.ferrorama.ui.theme.StatusOnline
import com.maquete.industrial.ferrorama.ui.viewmodel.FerroramaViewModel

/**
 * Aba Sensores: sensores de obstáculo (S1–S7) e o semáforo da ferrovia.
 * Tudo vem do Bluetooth (firmware_at: heartbeat de 5s).
 */
@Composable
fun SensoresScreen(
    viewModel: FerroramaViewModel,
    modifier: Modifier = Modifier
) {
    // Usa LazyVerticalGrid, então não precisamos do verticalScroll externo.
    Column(
        modifier = modifier
            .background(FeroBackground)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Semáforo
        SectionCard(title = "SEMÁFORO") {
            GateLights(gate = viewModel.ferData.gate)
        }

        // Sensores
        SectionCard(title = "SENSORES DE OBSTÁCULO") {
            Text(
                text = "${viewModel.ferData.activeSensorCount}/7 acionados",
                color = FeroGlow,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fixedHeightForGrid(7)
            ) {
                items(viewModel.ferData.sensors) { sensor ->
                    SensorTile(sensor = sensor)
                }
            }
        }

        if (!viewModel.isConnected) {
            SectionCard(title = "AVISO") {
                Text(
                    text = "Sensores e semáforo exigem o HC-05 conectado (aba Conexão).",
                    color = StatusOffline,
                    fontSize = 13.sp
                )
            }
        }
    }
}

/**
 * Dá uma altura fixa à grade para o LazyVerticalGrid poder medir sem constraints
 * infinitas dentro do Column.
 */
private fun Modifier.fixedHeightForGrid(itemCount: Int): Modifier {
    val rows = (itemCount + 2) / 3
    return this.height(96.dp * rows)
}

@Composable
private fun GateLights(gate: String) {
    val red = gate == "RED"
    val yellow = gate == "YELLOW"
    val green = gate == "GREEN"

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        GateLight(color = GateRed, on = red)
        Spacer(modifier = Modifier.width(16.dp))
        GateLight(color = GateYellow, on = yellow)
        Spacer(modifier = Modifier.width(16.dp))
        GateLight(color = GateGreen, on = green)

        Spacer(modifier = Modifier.width(24.dp))
        GateStatusText(gate)
    }
}

@Composable
private fun GateLight(color: androidx.compose.ui.graphics.Color, on: Boolean) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .background(
                if (on) color else color.copy(alpha = 0.12f),
                RoundedCornerShape(50)
            )
    )
}

@Composable
private fun GateStatusText(gate: String) {
    val (label, color) = when (gate) {
        "GREEN" -> "LIBERADO" to GateGreen
        "YELLOW" -> "ATENÇÃO" to GateYellow
        else -> "PARADO" to GateRed
    }
    Column {
        Text(
            text = label,
            color = color,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Agulhas travadas",
            color = FeroTextDim,
            fontSize = 10.sp
        )
    }
}

@Composable
private fun SensorTile(sensor: SensorState) {
    val active = sensor.active
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (active) GateYellow.copy(alpha = 0.18f) else FeroCard,
                RoundedCornerShape(10.dp)
            )
            .padding(vertical = 12.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(14.dp)
                .background(
                    if (active) GateYellow else FeroBorder,
                    RoundedCornerShape(50)
                )
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "S${sensor.id}",
            color = FeroText,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            fontFamily = FontFamily.Monospace
        )
        Text(
            text = if (active) "ACIONADO" else "livre",
            color = if (active) GateYellow else FeroTextDim,
            fontSize = 10.sp
        )
    }
}