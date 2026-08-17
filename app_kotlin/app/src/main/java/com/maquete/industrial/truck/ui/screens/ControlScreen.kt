package com.maquete.industrial.truck.ui.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maquete.industrial.truck.ui.components.DevicePickerDialog
import com.maquete.industrial.truck.ui.components.JoystickAxis
import com.maquete.industrial.truck.ui.components.JoystickComposable
import com.maquete.industrial.truck.ui.viewmodel.TurnSignalState
import com.maquete.industrial.truck.ui.viewmodel.TruckViewModel

// ── Cores do tema ──────────────────────────────────────────────────────────────
private val DarkBackground = Color(0xFF0D1117)
private val DarkCard = Color(0xFF161B22)
private val DarkButton = Color(0xFF21262D)
private val PrimaryGreen = Color(0xFF3FB950)
private val SecondaryBlue = Color(0xFF58A6FF)
private val ErrorRed = Color(0xFFF85149)
private val SignalOrange = Color(0xFFFF8C00)
private val RecordRed = Color(0xFFE63946)
private val TextDim = Color(0xFFC9D1D9)

/**
 * Tela única do app — painel de controle do caminhão basculante.
 *
 * Layout (joystick 2D à direita):
 *  - Topo (full width):    Barra de conexão + status
 *  - Corpo (Row):
 *      Esquerda (weight 1):  Caçamba + Iluminação + Gravação (em coluna)
 *      Direita  (weight 2):  Joystick 2D (maior)
 *  - Inferior (full width): Monitor CMD/ACK
 *
 * Mapeamento do joystick:
 *  - Cima = FC, Baixo = BC, Esquerda = C, Direita = C
 *  - Diagonais = FL/FR/BL/BR
 *  - Centro = S (parar motor, direção mantém)
 *  - Soltar = SC (parada total + centraliza)
 */
@Composable
fun ControlScreen(
    viewModel: TruckViewModel,
    onRequestBluetoothPermissions: () -> Unit,
    onEnableBluetooth: () -> Unit
) {
    var showDevicePicker by remember { mutableStateOf(false) }
    var pairedDevices by remember {
        mutableStateOf<List<android.bluetooth.BluetoothDevice>>(emptyList())
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // ── Barra de conexão no topo ────────────────────────────────────────
            ConnectionBar(
                isConnected = viewModel.isConnected,
                deviceName = viewModel.deviceName,
                autoReconnectInProgress = viewModel.autoReconnectInProgress,
                errorMessage = viewModel.errorMessage,
                onConnectClick = {
                    onRequestBluetoothPermissions()
                    onEnableBluetooth()
                    pairedDevices = viewModel.getPairedDevices()
                    showDevicePicker = true
                }
            )

            // ── Corpo: esquerda (controles) + direita (joystick) ───────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // ── Coluna esquerda: controles ──────────────────────────────────
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Caçamba + Iluminação
                    ControlPanel(
                        bucketState = viewModel.bucketState,
                        headlightsOn = viewModel.headlightsOn,
                        hazardOn = viewModel.hazardOn,
                        turnSignal = viewModel.turnSignal,
                        onBucketUp = { viewModel.bucketUp() },
                        onBucketDown = { viewModel.bucketDown() },
                        onToggleHeadlights = { viewModel.toggleHeadlights() },
                        onTurnLeft = { viewModel.turnLeft() },
                        onTurnRight = { viewModel.turnRight() },
                        onToggleHazard = { viewModel.toggleHazard() }
                    )

                    // Gravação
                    RecordingBar(
                        isRecording = viewModel.isRecording,
                        isPlaying = viewModel.isPlaying,
                        recordedCount = viewModel.recordedCount,
                        onToggleRecording = { viewModel.toggleRecording() },
                        onTogglePlayback = { viewModel.togglePlayback() },
                        onClear = { viewModel.clearRecording() }
                    )

                    // Monitor CMD/ACK
                    Text(
                        text = "CMD: ${viewModel.lastCommand}    ACK: ${viewModel.lastAck ?: "--"}",
                        color = PrimaryGreen,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                // ── Coluna direita: joystick 2D (maior) ────────────────────────
                JoystickComposable(
                    modifier = Modifier
                        .weight(2f)
                        .fillMaxHeight(),
                    axis = JoystickAxis.BOTH,
                    onMove = { x, y -> viewModel.onJoystickMove(x, y) },
                    onRelease = { viewModel.onJoystickRelease() }
                )
            }
        }
    }

    // Dialog de dispositivos pareados.
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

// ── Componentes auxiliares ──────────────────────────────────────────────────────

/**
 * Barra de conexão no topo da tela.
 */
@Composable
private fun ConnectionBar(
    isConnected: Boolean,
    deviceName: String?,
    autoReconnectInProgress: Boolean,
    errorMessage: String?,
    onConnectClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(
                text = if (isConnected) "Conectado: $deviceName" else "Desconectado",
                color = if (isConnected) PrimaryGreen else TextDim,
                fontSize = 14.sp
            )
            if (autoReconnectInProgress) {
                Text("Reconectando...", color = TextDim, fontSize = 12.sp)
            }
            errorMessage?.let { msg ->
                Text(msg, color = ErrorRed, fontSize = 12.sp)
            }
        }
        Button(
            onClick = onConnectClick,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0E7C86))
        ) {
            Icon(
                Icons.Default.Bluetooth, contentDescription = null,
                modifier = Modifier.size(18.dp), tint = Color.White
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text("Conectar", color = Color.White)
        }
    }
}

/**
 * Painel com caçamba e iluminação.
 */
@Composable
private fun ControlPanel(
    bucketState: String,
    headlightsOn: Boolean,
    hazardOn: Boolean,
    turnSignal: TurnSignalState,
    onBucketUp: () -> Unit,
    onBucketDown: () -> Unit,
    onToggleHeadlights: () -> Unit,
    onTurnLeft: () -> Unit,
    onTurnRight: () -> Unit,
    onToggleHazard: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkCard, shape = RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Caçamba
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Text("CAÇAMBA", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SmallButton(
                    icon = Icons.Default.ArrowUpward,
                    isActive = bucketState == "SUBINDO",
                    activeColor = PrimaryGreen,
                    onClick = onBucketUp
                )
                SmallButton(
                    icon = Icons.Default.ArrowDownward,
                    isActive = bucketState == "DESCENDO",
                    activeColor = PrimaryGreen,
                    onClick = onBucketDown
                )
            }
        }

        // Iluminação
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Text("ILUMINAÇÃO", color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                SmallButton(
                    icon = Icons.AutoMirrored.Filled.ArrowBack,
                    isActive = turnSignal == TurnSignalState.LEFT,
                    activeColor = SignalOrange,
                    onClick = onTurnLeft
                )
                FarolButton(
                    isActive = headlightsOn,
                    onClick = onToggleHeadlights
                )
                SmallButton(
                    icon = Icons.AutoMirrored.Filled.ArrowForward,
                    isActive = turnSignal == TurnSignalState.RIGHT,
                    activeColor = SignalOrange,
                    onClick = onTurnRight
                )
                SmallButton(
                    icon = Icons.Default.Warning,
                    isActive = hazardOn,
                    activeColor = SignalOrange,
                    onClick = onToggleHazard
                )
            }
        }
    }
}

/**
 * Barra de gravação de movimentos: REC / PLAY / CLR + contador.
 */
@Composable
private fun RecordingBar(
    isRecording: Boolean,
    isPlaying: Boolean,
    recordedCount: Int,
    onToggleRecording: () -> Unit,
    onTogglePlayback: () -> Unit,
    onClear: () -> Unit
) {
    // Animação de piscar quando gravando
    val infiniteTransition = rememberInfiniteTransition(label = "rec")
    val blinkAlpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(500),
            repeatMode = RepeatMode.Reverse
        ),
        label = "blink"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkCard, shape = RoundedCornerShape(12.dp))
            .padding(vertical = 8.dp, horizontal = 12.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Botão REC
        Button(
            onClick = onToggleRecording,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isRecording) RecordRed else DarkButton
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.size(40.dp)
        ) {
            Icon(
                Icons.Default.FiberManualRecord,
                contentDescription = "Gravar",
                tint = if (isRecording) Color.White else RecordRed,
                modifier = Modifier
                    .size(22.dp)
                    .alpha(if (isRecording) blinkAlpha else 1f)
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        // Botão PLAY
        Button(
            onClick = onTogglePlayback,
            enabled = recordedCount > 0 || isPlaying,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isPlaying) PrimaryGreen else DarkButton,
                disabledContainerColor = DarkButton
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.size(40.dp)
        ) {
            Icon(
                if (isPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
                contentDescription = "Play",
                tint = if (isPlaying) Color.White else PrimaryGreen,
                modifier = Modifier.size(22.dp)
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        // Botão CLR
        Button(
            onClick = onClear,
            colors = ButtonDefaults.buttonColors(containerColor = DarkButton),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.size(40.dp)
        ) {
            Text("CLR", color = TextDim, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.width(10.dp))

        // Contador de frames
        Text(
            text = "$recordedCount frames",
            color = TextDim,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace
        )
    }
}

/**
 * Botão pequeno genérico.
 */
@Composable
private fun SmallButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isActive: Boolean,
    activeColor: Color,
    onClick: () -> Unit
) {
    val backgroundColor = if (isActive) activeColor else DarkButton

    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = backgroundColor),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.size(44.dp)
    ) {
        Icon(
            icon, contentDescription = null,
            tint = if (isActive) Color.White else activeColor,
            modifier = Modifier.size(24.dp)
        )
    }
}

/**
 * Botão de farol (toggle).
 */
@Composable
private fun FarolButton(
    isActive: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (isActive) SecondaryBlue else DarkButton

    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = backgroundColor),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.size(50.dp)
    ) {
        Text(
            "Farol",
            color = if (isActive) Color.White else SecondaryBlue,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
