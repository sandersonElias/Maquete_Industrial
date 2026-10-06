package com.maquete.industrial.ferrorama.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maquete.industrial.ferrorama.data.SwitchState
import com.maquete.industrial.ferrorama.ui.components.SectionCard
import com.maquete.industrial.ferrorama.ui.theme.FeroBackground
import com.maquete.industrial.ferrorama.ui.theme.FeroCard
import com.maquete.industrial.ferrorama.ui.theme.FeroGlow
import com.maquete.industrial.ferrorama.ui.theme.FeroLoco
import com.maquete.industrial.ferrorama.ui.theme.FeroText
import com.maquete.industrial.ferrorama.ui.theme.FeroTextDim
import com.maquete.industrial.ferrorama.ui.theme.StatusOffline
import com.maquete.industrial.ferrorama.ui.viewmodel.FerroramaViewModel

/**
 * Aba Agulhas: controle das 3 agulhas (via Bluetooth → HC-05 → Arduino).
 * 1 = esquerda (72°), 2 = centro (90°), 3 = direita (108°).
 */
@Composable
fun AgulhasScreen(
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
        if (!viewModel.isConnected) {
            SectionCard(title = "AVISO") {
                Text(
                    text = "Sem conexão Bluetooth. Conecte o HC-05 na aba Conexão.",
                    color = StatusOffline,
                    fontSize = 13.sp
                )
            }
        }

        viewModel.ferData.switches.forEach { sw ->
            SwitchCard(
                sw = sw,
                enabled = viewModel.isConnected,
                onMove = { pos -> viewModel.moveSwitch(sw.id, pos) },
                onStatus = { viewModel.requestSwitchStatus(sw.id) }
            )
        }
    }
}

@Composable
private fun SwitchCard(
    sw: SwitchState,
    enabled: Boolean,
    onMove: (String) -> Unit,
    onStatus: () -> Unit
) {
    SectionCard(
        title = "AGULHA ${sw.id}"
    ) {
        // Visual: radiante + posição
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                SwitchRail(sw.isLeft, sw.isRight, sw.moving)
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "${sw.angle}°",
                    color = FeroGlow,
                    fontSize = 20.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (sw.moving) "MOVENDO..." else stateLabel(sw.state),
                    color = if (sw.moving) FeroLoco else FeroTextDim,
                    fontSize = 12.sp
                )
            }
            Icon(
                Icons.Default.Refresh,
                contentDescription = "Solicitar status",
                tint = if (enabled) FeroTextDim else FeroTextDim.copy(alpha = 0.4f),
                modifier = Modifier
                    .size(22.dp)
                    .background(
                        if (enabled) FeroCard else FeroBackground,
                        RoundedCornerShape(6.dp)
                    )
                    .clickable(enabled = enabled, onClick = onStatus)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))

        // Botões de comando
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            SwitchButton(
                label = "ESQUERDA",
                color = FeroCard,
                textColor = FeroText,
                active = sw.isLeft,
                enabled = enabled && !sw.moving,
                onClick = { onMove("LEFT") }
            )
            SwitchButton(
                label = "CENTRO",
                color = FeroCard,
                textColor = FeroText,
                active = !sw.isLeft && !sw.isRight,
                enabled = enabled && !sw.moving,
                onClick = { onMove("CENTER") }
            )
            SwitchButton(
                label = "DIREITA",
                color = FeroCard,
                textColor = FeroText,
                active = sw.isRight,
                enabled = enabled && !sw.moving,
                onClick = { onMove("RIGHT") }
            )
        }
    }
}

@Composable
private fun RowScope.SwitchButton(
    label: String,
    color: Color,
    textColor: Color,
    active: Boolean,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = if (active) FeroGlow else color,
            contentColor = if (active) FeroBackground else textColor,
            disabledContainerColor = FeroCard.copy(alpha = 0.5f),
            disabledContentColor = FeroTextDim.copy(alpha = 0.5f)
        ),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.weight(1f)
    ) {
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SwitchRail(isLeft: Boolean, isRight: Boolean, moving: Boolean) {
    val railColor = when {
        moving -> FeroLoco
        isLeft -> FeroGlow
        isRight -> FeroGlow
        else -> FeroCard
    }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(width = 18.dp, height = 6.dp)
                .background(railColor.copy(alpha = if (isLeft || moving) 1f else 0.3f), RoundedCornerShape(3.dp))
        )
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(railColor, RoundedCornerShape(50))
        )
        Box(
            modifier = Modifier
                .size(width = 18.dp, height = 6.dp)
                .background(railColor.copy(alpha = if (isRight || moving) 1f else 0.3f), RoundedCornerShape(3.dp))
        )
    }
}

private fun stateLabel(state: String) = when (state) {
    "LEFT" -> "Esquerda"
    "RIGHT" -> "Direita"
    "CENTER" -> "Centro"
    else -> "Centro"
}