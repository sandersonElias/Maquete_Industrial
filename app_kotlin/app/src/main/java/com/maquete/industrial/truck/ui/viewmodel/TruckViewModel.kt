package com.maquete.industrial.truck.ui.viewmodel

import android.app.Application
import android.bluetooth.BluetoothDevice
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.maquete.industrial.truck.bluetooth.TruckBluetoothService
import com.maquete.industrial.truck.bluetooth.TruckCommand
import com.maquete.industrial.truck.data.TruckPrefs
import com.maquete.industrial.truck.ui.components.DPadDirection
import com.maquete.industrial.truck.ui.record.Recorder
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

/**
 * ViewModel central do app.
 *
 * Usa um **joystick 2D único** (X + Y) que mapeia para 9 zonas discretas:
 *  - 8 direções (F, B, L, R, FL, FR, BL, BR)
 *  - Centro (STOP — só para o motor, direção mantida)
 *
 * Ao **soltar** o joystick, o VM envia `EMERGENCY` ("SC") — parada total +
 * centralização da direção. Isto bate com o firmware (linha 178-185 do .ino).
 *
 * Camadas integradas:
 *  - [TruckPrefs]: persiste último MAC/nome + flag auto-reconexão.
 *  - [Recorder]: gravação local de movimentos para modo autônomo.
 *  - [lastAck]: último ACK lido do Arduino (`ACK|TRUCK|<cmd>|OK`).
 */
class TruckViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = TruckPrefs(application)
    // Lambda enviado ao Recorder durante playback: atualiza lastCommand do
    // frame em reprodução e despacha pelo service.
    private val recorder = Recorder { cmd ->
        lastCommand = cmd.cmd
        TruckBluetoothService.sendAsync(cmd.cmd)
    }

    // ── Estado exposto à Compose UI ────────────────────────────────────────────
    var isConnected by mutableStateOf(false)
        private set
    var deviceName by mutableStateOf<String?>(null)
        private set
    var lastCommand by mutableStateOf("--")
        private set
    var lastAck by mutableStateOf<String?>(null)
        private set
    var bucketState by mutableStateOf("PARADO")
        private set
    var headlightsOn by mutableStateOf(false)
        private set
    var hazardOn by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set

    // Estado único do joystick 2D (substitui currentMovement + currentSteering)
    var currentDirection by mutableStateOf(DPadDirection.STOP)
        private set

    // Estado das setas (pisca). NONE = desligado, LEFT/RIGHT = piscando.
    var turnSignal by mutableStateOf(TurnSignalState.NONE)
        private set

    // Estado de gravação de movimentos
    var isRecording by mutableStateOf(false)
        private set
    var isPlaying by mutableStateOf(false)
        private set
    var recordedCount by mutableStateOf(0)
        private set

    // Indica se uma auto-reconexão está em andamento (p/ mostrar spinner/aviso).
    var autoReconnectInProgress by mutableStateOf(false)
        private set

    // Última zona enviada pelo joystick (para dedupe — não reenvia o mesmo cmd)
    private var lastZone: DPadDirection = DPadDirection.STOP

    init {
        // Observa mudanças de estado do Bluetooth (collect, não collectLatest —
        // ver item 1.4 do plano: collectLatest pode cancelar transições rápidas).
        viewModelScope.launch {
            TruckBluetoothService.state.collect { state ->
                isConnected = state == TruckBluetoothService.State.CONNECTED
                when (state) {
                    TruckBluetoothService.State.CONNECTED -> {
                        val name = deviceName ?: prefs.lastDeviceName
                        if (name != null) {
                            prefs.lastDeviceName = name
                        }
                        autoReconnectInProgress = false
                    }
                    TruckBluetoothService.State.ERROR -> {
                        autoReconnectInProgress = false
                        errorMessage = TruckBluetoothService.lastError.value
                    }
                    TruckBluetoothService.State.DISCONNECTED -> {
                        autoReconnectInProgress = false
                    }
                    else -> {}
                }
            }
        }

        // Observa ACKs recebidos do Arduino.
        viewModelScope.launch {
            TruckBluetoothService.incoming.collect { line ->
                if (line != null) lastAck = line
            }
        }

        // Auto-reconexão ao abrir: tenta conectar no último MAC se habilitado.
        if (prefs.autoReconnect && !prefs.lastMac.isNullOrBlank()) {
            autoReconnectInProgress = true
            Log.d(TAG, "Auto-reconectando a ${prefs.lastMac}")
            deviceName = prefs.lastDeviceName
            val ok = TruckBluetoothService.connectByMac(prefs.lastMac)
            if (!ok) {
                autoReconnectInProgress = false
                Log.w(TAG, "Auto-reconexão falhou no init (permissão/adapter?)")
            }
        }
    }

    // ── Permissões (chamadas pela Activity com contracts modernos) ─────────────

    fun permissionsToRequest(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            arrayOf(
                android.Manifest.permission.BLUETOOTH_CONNECT,
                android.Manifest.permission.BLUETOOTH_SCAN
            )
        } else {
            arrayOf(
                android.Manifest.permission.BLUETOOTH,
                android.Manifest.permission.BLUETOOTH_ADMIN,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            )
        }
    }

    /**
     * Devolve se todas as permissões foram concedidas. Se sim e há MAC pareado
     * com auto-reconexão habilitada, re-tenta a auto-reconexão (item 5.6).
     */
    fun onPermissionsResult(granted: Boolean) {
        if (!granted) {
            errorMessage = "Permissão Bluetooth necessária"
            return
        }
        // Re-tenta auto-reconexão se permissões concedidas após o init
        if (prefs.autoReconnect && !prefs.lastMac.isNullOrBlank() && !isConnected) {
            autoReconnectInProgress = true
            deviceName = prefs.lastDeviceName
            val ok = TruckBluetoothService.connectByMac(prefs.lastMac)
            if (!ok) autoReconnectInProgress = false
        }
    }

    fun onBluetoothEnableResult(enabled: Boolean) {
        if (!enabled) {
            autoReconnectInProgress = false
            errorMessage = "Bluetooth está desligado"
        }
    }

    fun shouldRequestBluetoothEnable(): Boolean {
        @Suppress("DEPRECATION")
        val adapter = android.bluetooth.BluetoothAdapter.getDefaultAdapter()
            ?: run {
                errorMessage = "Bluetooth não disponível neste dispositivo"
                return false
            }
        return !adapter.isEnabled
    }

    // ── Conexão ────────────────────────────────────────────────────────────────

    fun getPairedDevices(): List<BluetoothDevice> =
        TruckBluetoothService.getPairedDevices()

    fun connectTo(device: BluetoothDevice) {
        // device.name pode lançar SecurityException em API 31+ sem permissão
        val name = try { device.name ?: "HC-05" } catch (_: SecurityException) { "HC-05" }
        deviceName = name
        prefs.lastMac = device.address
        prefs.lastDeviceName = name
        TruckBluetoothService.connect(device)
    }

    fun disconnect() {
        recorder.clear()
        isRecording = false
        isPlaying = false
        recordedCount = 0
        turnSignal = TurnSignalState.NONE
        headlightsOn = false
        hazardOn = false
        currentDirection = DPadDirection.STOP
        lastZone = DPadDirection.STOP
        TruckBluetoothService.emergencyStop()
        TruckBluetoothService.disconnect()
        deviceName = null
        isConnected = false
    }

    // ── Joystick 2D Único ──────────────────────────────────────────────────────

    /**
     * Processa movimento do joystick 2D. Mapeia (x, y) para 9 zonas discretas
     * e envia apenas quando a zona muda (dedupe via [lastZone]).
     *
     * @param x Eixo horizontal: -1 (esquerda) .. +1 (direita)
     * @param y Eixo vertical: -1 (cima/frente) .. +1 (baixo/ré)
     *           Note: o JoystickView usa y invertido vs. Compose Canvas.
     */
    fun onJoystickMove(x: Float, y: Float) {
        val deadZone = 0.35f
        val isForward = y < -deadZone
        val isBack = y > deadZone
        val isLeft = x < -deadZone
        val isRight = x > deadZone

        val newZone = when {
            isForward && isLeft  -> DPadDirection.FORWARD_LEFT
            isForward && isRight -> DPadDirection.FORWARD_RIGHT
            isBack && isLeft     -> DPadDirection.BACK_LEFT
            isBack && isRight    -> DPadDirection.BACK_RIGHT
            isForward            -> DPadDirection.FORWARD
            isBack               -> DPadDirection.BACK
            isLeft               -> DPadDirection.LEFT
            isRight              -> DPadDirection.RIGHT
            else                 -> DPadDirection.STOP  // centro — só para motor
        }

        if (newZone != lastZone) {
            lastZone = newZone
            currentDirection = newZone
            val cmd = zoneToCommand(newZone)
            dispatch(cmd)
        }
    }

    /**
     * Chamado quando o usuário SOLTA o joystick (ACTION_UP).
     * Envia SEMPRE `EMERGENCY` ("SC") — parada total + centralização da direção.
     * Isto resolve o bug original onde soltar não parava o motor.
     */
    fun onJoystickRelease() {
        lastZone = DPadDirection.STOP
        currentDirection = DPadDirection.STOP
        dispatch(TruckCommand.EMERGENCY)
    }

    /**
     * Mapeia uma zona do joystick 2D para o [TruckCommand] correspondente.
     *
     * Convenção (confirmada com o usuário):
     *  - Cima puro   → FC (frente + direção centralizada)
     *  - Baixo puro  → BC (ré + direção centralizada)
     *  - Esquerda    → C  (só centraliza direção, motor parado)
     *  - Direita     → C  (só centraliza direção, motor parado)
     *  - Diagonais   → FL/FR/BL/BR (mantém)
     *  - Centro      → S  (só para motor, direção mantida)
     *  - Soltar       → SC (parada total + centraliza — ver onJoystickRelease)
     */
    private fun zoneToCommand(zone: DPadDirection): TruckCommand = when (zone) {
        DPadDirection.FORWARD       -> TruckCommand.FORWARD_CENTER
        DPadDirection.BACK          -> TruckCommand.BACK_CENTER
        DPadDirection.LEFT          -> TruckCommand.CENTER
        DPadDirection.RIGHT         -> TruckCommand.CENTER
        DPadDirection.FORWARD_LEFT  -> TruckCommand.FORWARD_LEFT
        DPadDirection.FORWARD_RIGHT -> TruckCommand.FORWARD_RIGHT
        DPadDirection.BACK_LEFT     -> TruckCommand.BACK_LEFT
        DPadDirection.BACK_RIGHT    -> TruckCommand.BACK_RIGHT
        DPadDirection.STOP          -> TruckCommand.STOP
        DPadDirection.CENTER        -> TruckCommand.STOP
    }

    // ── Caçamba ──────────────────────────────────────────────────────────────

    fun bucketUp() {
        bucketState = "SUBINDO"
        dispatch(TruckCommand.BUCKET_UP)
    }

    fun bucketDown() {
        bucketState = "DESCENDO"
        dispatch(TruckCommand.BUCKET_DOWN)
    }

    fun bucketStop() {
        bucketState = "PARADO"
        dispatch(TruckCommand.BUCKET_STOP)
    }

    // ── Iluminação ────────────────────────────────────────────────────────────

    fun toggleHeadlights() {
        headlightsOn = !headlightsOn
        dispatch(TruckCommand.HEADLIGHT_TOGGLE)
    }

    /**
     * Toggle da seta esquerda: se já está piscando esquerda → DESLIGA
     * (SIGNAL_OFF); senão liga (SIGNAL_LEFT).
     */
    fun turnLeft() {
        if (turnSignal == TurnSignalState.LEFT) {
            turnSignal = TurnSignalState.NONE
            dispatch(TruckCommand.SIGNAL_OFF)
        } else {
            turnSignal = TurnSignalState.LEFT
            dispatch(TruckCommand.SIGNAL_LEFT)
        }
    }

    /**
     * Toggle da seta direita: se já está piscando direita → DESLIGA
     * (SIGNAL_OFF); senão liga (SIGNAL_RIGHT).
     */
    fun turnRight() {
        if (turnSignal == TurnSignalState.RIGHT) {
            turnSignal = TurnSignalState.NONE
            dispatch(TruckCommand.SIGNAL_OFF)
        } else {
            turnSignal = TurnSignalState.RIGHT
            dispatch(TruckCommand.SIGNAL_RIGHT)
        }
    }

    /** Toggle do pisca-alerta (HA). */
    fun toggleHazard() {
        hazardOn = !hazardOn
        dispatch(TruckCommand.HAZARD)
    }

    // ── Emergência ─────────────────────────────────────────────────────────────

    /**
     * Emergência: para tudo imediato. NÃO participa da gravação do Recorder
     * (sempre age, nunca é gravada como frame).
     * Se estiver em playback, cancela o playback. Desliga setas, faróis,
     * pisca-alerta — tudo volta ao estado neutro. Reseta o joystick ao centro.
     * Envia "SC" ao firmware (parar motor + centralizar direção).
     */
    fun emergencyStop() {
        if (isPlaying) recorder.stopPlayback().also { isPlaying = false }
        bucketState = "PARADO"
        turnSignal = TurnSignalState.NONE
        headlightsOn = false
        hazardOn = false
        currentDirection = DPadDirection.STOP
        lastZone = DPadDirection.STOP
        lastCommand = "SC"
        TruckBluetoothService.emergencyStop()
        // não grava no recorder — emergência é out-of-band
    }

    // ── Gravação de movimentos ───────────────────────────────────────────────

    fun toggleRecording() {
        if (isPlaying) return
        if (isRecording) {
            recorder.stopRecording()
            isRecording = false
            recordedCount = recorder.recordedCount
        } else {
            recorder.startRecording()
            isRecording = true
            recordedCount = 0
        }
    }

    fun togglePlayback() {
        if (isRecording) return
        if (isPlaying) {
            recorder.stopPlayback()
            isPlaying = false
        } else {
            recorder.playback(viewModelScope)
            isPlaying = true
        }
    }

    fun clearRecording() {
        recorder.clear()
        isRecording = false
        isPlaying = false
        recordedCount = 0
    }

    /**
     * Despacha um [TruckCommand]: envia via service, atualiza lastCommand e
     * grava no Recorder se estiver em sessão de gravação.
     */
    private fun dispatch(cmd: TruckCommand) {
        lastCommand = cmd.cmd
        TruckBluetoothService.sendAsync(cmd)
        if (isRecording) {
            recorder.record(cmd)
            recordedCount = recorder.recordedCount
        }
    }

    fun clearError() {
        errorMessage = null
    }

    override fun onCleared() {
        super.onCleared()
        recorder.clear()
        // Chama shutdown() (não só disconnect) para garantir fechamento total
        // do scope e socket — a Activity não deve chamar shutdown() (ver 1.7).
        TruckBluetoothService.shutdown()
    }

    companion object {
        private const val TAG = "TruckVM"
    }
}

/**
 * Estado das setas (pisca) — usado por [TruckViewModel.turnSignal].
 * NONE = desligado, LEFT/RIGHT = piscando.
 */
enum class TurnSignalState { NONE, LEFT, RIGHT }
