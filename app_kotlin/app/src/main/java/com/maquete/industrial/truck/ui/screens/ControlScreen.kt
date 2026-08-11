package com.maquete.industrial.truck.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maquete.industrial.truck.ui.components.DevicePickerDialog
import com.maquete.industrial.truck.ui.components.DPadDirection
import com.maquete.industrial.truck.ui.components.JoystickComposable
import com.maquete.industrial.truck.ui.viewmodel.TruckViewModel
import kotlin.math.abs

/**
 * Tela única do app — painel de controle do caminhão basculante.
 *
 * Layout (alinhado ao mockup, mas com joystick no lugar das setas):
 *  - Esquerda:  joystick azul (movimento + direção combinados → 8 direções)
 *  - Centro:    caçamba (▲/▼ verdes) + iluminação (◄ laranja / Farol cinza / ► laranja)
 *  - Linha inferior: PARAR + EMERGÊNCIA
 *
 * Sem navegação inferior. Sem scroll. Joystick mapeia para [DPadDirection]
 * por zona (dead-zone 0.3, y invertido, 8-way) e despacha via
 * [TruckViewModel.sendDirection] — mesmo caminho do D-Pad antigo.
 */
@Composable
@Suppress("UNUSED_PARAMETER")
fun ControlScreen(
    viewModel: TruckViewModel,
    onRequestBluetoothPermissions: () -> Unit,
    onEnableBluetooth: () -> Unit
) {
    var showDevicePicker by remember { mutableStateOf(false) }
    var pairedDevices by remember {
        mutableStateOf<List<android.bluetooth.BluetoothDevice>>(emptyList())
    }

    val bucketGreen   = Color(0xFF3FB950)        // verde  (caçamba)
    val signalOrange   = Color(0xFFFF8C00)        // laranja (pisca)
    val farolGray      = Color(0xFF3A4A5A)         // cinza   (toggle Farol)
    val farolBlueText  = Color(0xFF58A6FF)        // azul    (texto "Farol")
    val stopGray       = Color(0xFF21262D)        // cinza escuro (PARAR)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D1117))
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ── Linha de conexão no topo (compacta) ──────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = if (viewModel.isConnected) "Conectado: ${viewModel.deviceName ?: "?"}"
                           else "Desconectado",
                    color = if (viewModel.isConnected) Color(0xFF3FB950) else Color(0xFFC9D1D9),
                    fontSize = 14.sp
                )
                Button(
                    onClick = {
                        onRequestBluetoothPermissions()
                        onEnableBluetooth()
                        pairedDevices = viewModel.getPairedDevices()
                        showDevicePicker = true
                    },
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
            if (viewModel.autoReconnectInProgress) {
                Text("Reconectando...", color = Color(0xFFC9D1D9), fontSize = 12.sp)
            }
            viewModel.errorMessage?.let { msg ->
                Text(msg, color = Color(0xFFF85149), fontSize = 12.sp)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // ── Comando/ACK ───────────────────────────────────────────────────────
            Text(
                text = "CMD: ${viewModel.lastCommand}    ACK: ${viewModel.lastAck ?: "--"}",
                color = Color(0xFF3FB950),
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            )

            Spacer(modifier = Modifier.height(16.dp))

            // ── Painel principal: joystick à esquerda, centro à direita ───────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // ── ESQUERDA: Joystick (azul) — movimento + direção combinados ────
                JoystickMovement(
                    onDirection = { dir -> viewModel.sendDirection(dir) }
                )

                // ── CENTRO/RIGHT: caçamba + iluminação (moldura única) ─────────────
                Column(
                    modifier = Modifier
                        .padding(start = 16.dp)
                        .background(Color(0xFF161B22), shape = RoundedCornerShape(16.dp))
                        .padding(14.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Caçamba
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("caçamba", color = Color.White, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            BucketButton(
                                icon = Icons.Default.ArrowUpward,
                                color = bucketGreen,
                                onClick = { viewModel.bucketUp() }
                            )
                            BucketButton(
                                icon = Icons.Default.ArrowDownward,
                                color = bucketGreen,
                                onClick = { viewModel.bucketDown() }
                            )
                        }
                    }
                    // Iluminação
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("iluminação", color = Color.White, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            SignalButton(
                                icon = Icons.AutoMirrored.Filled.ArrowBack,
                                color = signalOrange,
                                onClick = { viewModel.turnLeft() }
                            )
                            FarolButton(
                                color = farolGray,
                                textColor = farolBlueText,
                                isOn = viewModel.headlightsOn,
                                onClick = { viewModel.toggleHeadlights() }
                            )
                            SignalButton(
                                icon = Icons.AutoMirrored.Filled.ArrowForward,
                                color = signalOrange,
                                onClick = { viewModel.turnRight() }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ── Parar / Emergência (linha inferior) ────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { viewModel.sendDirection(DPadDirection.STOP) },
                    colors = ButtonDefaults.buttonColors(containerColor = stopGray),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).height(48.dp)
                ) {
                    Text("PARAR", color = Color.White)
                }
                Button(
                    onClick = { viewModel.emergencyStop() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE63946)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).height(48.dp)
                ) {
                    Text("EMERGÊNCIA", color = Color.White, fontWeight = FontWeight.Bold)
                }
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

// ── Componentes ────────────────────────────────────────────────────────────────

/**
 * Joystick azul (port do app_carro_rover, via [JoystickComposable]).
 * Mapeia X/Y normalizados [-1..1] do [JoystickView] para uma [DPadDirection]
 * por zona e despacha via [onDirection].
 *
 *  - Centro morto (|x|<0.3 && |y|<0.3) → STOP.
 *  - y é INVERTIDO (View y = +para baixo, mas "cima" no joystick = forward).
 *  - 8-way → FORWARD/BACK/LEFT/RIGHT + diagonais.
 */
@Composable
fun JoystickMovement(
    onDirection: (DPadDirection) -> Unit
) {
    var lastDir by remember { mutableStateOf(DPadDirection.STOP) }

    JoystickComposable(
        modifier = Modifier
            .size(220.dp)
            .aspectRatio(1f),
        onMove = { x, y ->
            val dir = mapJoystickToDirection(x, y)
            if (dir != lastDir) {
                lastDir = dir
                onDirection(dir)
            }
        },
        // Ao soltar o stick, força STOP incondicionalmente — a animação de
        // spring-back pode pular frames da dead-zone e deixar o último comando
        // travado (ex.: FORWARD sem nunca enviar STOP ao chegar ao centro).
        onRelease = {
            if (lastDir != DPadDirection.STOP) {
                lastDir = DPadDirection.STOP
                onDirection(DPadDirection.STOP)
            }
        }
    )
}

/**
 * Conversão de coordenadas raw do joystick para direção discreta.
 */
private fun mapJoystickToDirection(x: Float, y: Float): DPadDirection {
    val nx = x
    val ny = -y                    // inverte y (View +down → humano +up)
    val dead = 0.3f
    if (abs(nx) < dead && abs(ny) < dead) return DPadDirection.STOP

    val isLeft  = nx < -dead
    val isRight = nx > dead
    val isFwd   = ny > dead
    val isBack  = ny < -dead

    return when {
        isFwd && isLeft   -> DPadDirection.FORWARD_LEFT
        isFwd && isRight  -> DPadDirection.FORWARD_RIGHT
        isBack && isLeft  -> DPadDirection.BACK_LEFT
        isBack && isRight -> DPadDirection.BACK_RIGHT
        isFwd  -> DPadDirection.FORWARD
        isBack -> DPadDirection.BACK
        isLeft -> DPadDirection.LEFT
        isRight -> DPadDirection.RIGHT
        else -> DPadDirection.STOP
    }
}

/** Botão quadrado médio (caçamba), verde. */
@Composable
private fun BucketButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = color),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.size(58.dp)
    ) {
        Icon(icon, contentDescription = null, tint = Color.White,
             modifier = Modifier.size(32.dp))
    }
}

/** Botão quadrado pequeno (pisca), laranja. */
@Composable
private fun SignalButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = color),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.size(48.dp)
    ) {
        Icon(icon, contentDescription = null, tint = Color.White,
             modifier = Modifier.size(26.dp))
    }
}

/** Botão "Farol" (toggle central, cinza com texto azul). */
@Composable
private fun FarolButton(
    color: Color,
    textColor: Color,
    isOn: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = color),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.size(56.dp)
    ) {
        Text("Farol", color = textColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
    // isOn reflete o estado do VM; a aparência cinza é fixa no mockup (sem LED).
    @Suppress("UNUSED_EXPRESSION") isOn
}
