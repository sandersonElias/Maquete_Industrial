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
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * ViewModel central do app.
 *
 * Camadas integradas (vs. versão anterior — só wrapper do service):
 *  - [TruckPrefs]: persiste último MAC/nome + throttle + flag auto-reconexão.
 *  - [Recorder]: gravação local de movimentos para modo autônomo.
 *  - [lastAck]: último ACK lido do Arduino (firmware envia `ACK|TRUCK|<cmd>|OK`).
 *
 * Permissões Bluetooth: não chama `requestPermissions`/`startActivityForResult`
 * legados — o caller (MainActivity) usa `ActivityResultContracts` e devolve o
 * resultado via [onPermissionsResult] / [onBluetoothEnableResult].
 */
class TruckViewModel(application: Application) : AndroidViewModel(application) {

    private val context: Context get() = getApplication()
    private val prefs = TruckPrefs(context)
    // Lambda enviada ao Recorder durante playback: atualiza o lastCommand do
    // frame em reprodução e despacha pelo service. Usa .cmd (String) para
    // resolver sem ambiguidade a sobrecarga sendAsync(String | TruckCommand).
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
    var errorMessage by mutableStateOf<String?>(null)
        private set

    // Estado das setas (pisca). NONE = desligado, LEFT/RIGHT = piscando.
    // Usado para toggle: clicar de novo na mesma seta DESLIGA (envia SIGNAL_OFF).
    var turnSignal by mutableStateOf(TurnSignalState.NONE)
        private set

    // Estado de gravação de movimentos (record/playback autônomo)
    var isRecording by mutableStateOf(false)
        private set
    var isPlaying by mutableStateOf(false)
        private set
    var recordedCount by mutableStateOf(0)
        private set

    // Estado exposto a Settings (dados reais persistidos)
    var settingsDeviceName by mutableStateOf<String?>(null)
        private set
    var settingsThrottleMs by mutableStateOf(TruckPrefs.DEFAULT_THROTTLE_MS)
        private set
    var settingsAutoReconnect by mutableStateOf(true)
        private set

    // Indica se uma auto-reconexão está em andamento (p/ mostrar spinner/aviso).
    var autoReconnectInProgress by mutableStateOf(false)
        private set

    init {
        // Carrega prefs para Settings ficar sincronizado desde o boot.
        settingsDeviceName = prefs.lastDeviceName
        settingsThrottleMs = prefs.throttleMs
        settingsAutoReconnect = prefs.autoReconnect

        // Observa mudancas de estado do Bluetooth
        viewModelScope.launch {
            TruckBluetoothService.state.collectLatest { state ->
                isConnected = state == TruckBluetoothService.State.CONNECTED
                if (state == TruckBluetoothService.State.CONNECTED) {
                    // Persiste dispositivo pareado ao conectar com sucesso.
                    // (deviceName é setado em connectTo abaixo; se veio de
                    // auto-reconexão, usamos o prefs.lastDeviceName.)
                    val name = deviceName ?: prefs.lastDeviceName
                    if (name != null) {
                        prefs.lastDeviceName = name
                        settingsDeviceName = name
                    }
                    autoReconnectInProgress = false
                }
                if (state == TruckBluetoothService.State.ERROR) {
                    autoReconnectInProgress = false
                    errorMessage = TruckBluetoothService.lastError.value
                }
                if (state == TruckBluetoothService.State.DISCONNECTED) {
                    autoReconnectInProgress = false
                }
            }
        }

        // Observa ACKs recebidos do Arduino.
        viewModelScope.launch {
            TruckBluetoothService.incoming.collectLatest { line ->
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
    //
    // Retorna o array de permissões que a Activity deve pedir — ramificado por
    // API como no app_carro_rover. A Activity registra o
    // `ActivityResultContracts.RequestMultiplePermissions()` e devolve o
    // resultado via [onPermissionsResult].

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
     * Devolve se todas as permissões foram concedidas. Diálogo de picker só
     * deve ser aberto se `granted == true` (a Activity decide o fluxo).
     */
    fun onPermissionsResult(granted: Boolean) {
        if (!granted) {
            errorMessage = "Permissão Bluetooth necessária"
        }
    }

    /**
     * Resultado de `ACTION_REQUEST_ENABLE`. Se o usuário negou, limpa o spinner
     * e mostra erro; do contrário o fluxo de conexão continua normalmente.
     */
    fun onBluetoothEnableResult(enabled: Boolean) {
        if (!enabled) {
            autoReconnectInProgress = false
            errorMessage = "Bluetooth está desligado"
        }
    }

    /**
     * Janela de permissões: este método agora só monta a intent — a própria
     * Activity lança via `ActivityResultContracts.StartActivityForResult` e
     * chama [onBluetoothEnableResult]. Mantido aqui para legibilidade do fluxo
     * em quem lê o VM; o disparo real da Intent é feito na Activity verificando
     * `adapter.isEnabled` antes.
     */
    fun shouldRequestBluetoothEnable(): Boolean {
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
        val name = device.name ?: "HC-05"
        deviceName = name
        prefs.lastMac = device.address
        prefs.lastDeviceName = name
        settingsDeviceName = name
        TruckBluetoothService.connect(device)
    }

    fun disconnect() {
        recorder.clear()
        isRecording = false
        isPlaying = false
        recordedCount = 0
        turnSignal = TurnSignalState.NONE
        TruckBluetoothService.emergencyStop()
        TruckBluetoothService.disconnect()
        deviceName = null
        isConnected = false
    }

    /**
     * Esquece o dispositivo pareado — usado por Settings. Mantém a conexão
     * atual ativa (se houver) e limpa apenas o registro persistido.
     */
    fun clearPairedDevice() {
        prefs.clearPairedDevice()
        settingsDeviceName = null
    }

    fun setAutoReconnect(value: Boolean) {
        prefs.autoReconnect = value
        settingsAutoReconnect = value
    }

    // ── Direção (D-Pad ou Joystick) ───────────────────────────────────────────

    fun sendDirection(direction: DPadDirection) {
        val cmd: TruckCommand = when (direction) {
            DPadDirection.FORWARD       -> TruckCommand.FORWARD
            DPadDirection.BACK          -> TruckCommand.BACKWARD
            DPadDirection.LEFT          -> TruckCommand.LEFT
            DPadDirection.RIGHT         -> TruckCommand.RIGHT
            DPadDirection.FORWARD_LEFT  -> TruckCommand.FORWARD_LEFT
            DPadDirection.FORWARD_RIGHT -> TruckCommand.FORWARD_RIGHT
            DPadDirection.BACK_LEFT     -> TruckCommand.BACK_LEFT
            DPadDirection.BACK_RIGHT    -> TruckCommand.BACK_RIGHT
            DPadDirection.STOP         -> TruckCommand.STOP
        }
        dispatch(cmd)
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
     * (SIGNAL_OFF); senão liga (SIGNAL_LEFT) e desliga a direita se ativa.
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
     * (SIGNAL_OFF); senão liga (SIGNAL_RIGHT) e desliga a esquerda se ativa.
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

    /** Desliga as setas incondicionalmente (usado por emergência/disconnect). */
    fun turnOff() {
        turnSignal = TurnSignalState.NONE
        dispatch(TruckCommand.SIGNAL_OFF)
    }

    // ── Emergência ─────────────────────────────────────────────────────────────

    /**
     * Emergência: para tudo imediato. NÃO participa da gravação do Recorder
     * (sempre age, nunca é gravada como frame) — decisao consciente do plano.
     * Se estiver em playback, cancela o playback para a sequência não continuar
     * comandando o caminhão enquanto o usuário pediu para parar tudo.
     * Também desliga as setas (pisca) e o farol — tudo volta ao estado neutro.
     */
    fun emergencyStop() {
        if (isPlaying) recorder.stopPlayback().also { isPlaying = false }
        bucketState = "PARADO"
        turnSignal = TurnSignalState.NONE
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
            // O Recorder já envia cada frame via callback do construtor (que
            // também atualiza lastCommand); aqui só orquestramos o ciclo.
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
     * Use este método para QUALQUER comando que precise aparacer na fita de
     * gravação (movimento, cacamba, iluminação). Emergência pula este caminho.
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
        TruckBluetoothService.disconnect()
    }

    companion object {
        private const val TAG = "TruckVM"
    }
}

/**
 * Estado das setas (pisca) — usado por [TruckViewModel.turnSignal].
 * NONE = desligado, LEFT/RIGHT = piscando. Toggle: clicar de novo na mesma
 * seta envia SIGNAL_OFF (TX) ao firmware.
 */
enum class TurnSignalState { NONE, LEFT, RIGHT }
