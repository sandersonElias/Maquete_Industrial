package com.maquete.industrial.truck.bluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.os.SystemClock
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.util.UUID

/**
 * Servico Bluetooth para o caminhao basculante.
 * Gerencia conexao RFCOMM com HC-05 e envio de comandos com throttle.
 *
 * Protocolo: comandos simples (F, B, S, L, R, etc.) terminados em \n.
 *   As strings crûas vivem centralizadas em [TruckCommand]; este service só
 *   expõe wrappers tipados que repassam o `.cmd`.
 *
 * Throttle: 80ms minimo entre envios para evitar overflow do buffer serial.
 *
 * Estado exposto:
 *  - [state] (StateFlow): ciclo de vida da conexao
 *  - [lastError] (StateFlow): ultima mensagem de erro amigavel p/ Snackbar
 *  - [incoming] (StateFlow): ultima linha lida do Arduino — tipicamente o ACK
 *    `ACK|TRUCK|<cmd>|OK`. Hoje o firmware não envia telemetria, mas deixar
 *    exposto permite à UI confirmar comandos e detectar conexao silenciosa.
 */
object TruckBluetoothService {

    private const val TAG = "TruckBT"
    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private const val THROTTLE_MS = 80L
    private const val CONNECT_TIMEOUT_MS = 10_000L

    enum class State { DISCONNECTED, CONNECTING, CONNECTED, ERROR }

    private val _state = MutableStateFlow(State.DISCONNECTED)
    val state: StateFlow<State> = _state

    private val _lastError = MutableStateFlow<String?>(null)
    val lastError: StateFlow<String?> = _lastError

    // Linha mais recente vinda do Arduino (ACK|TRUCK|...|OK em firmware atual).
    // StateFlow (em vez de SharedFlow como no rover) retém o último ACK para a
    // UI exibir persistente — útil p/ confirmar comandos.
    private val _incoming = MutableStateFlow<String?>(null)
    val incoming: StateFlow<String?> = _incoming

    private var socket: BluetoothSocket? = null
    private var connectJob: Job? = null
    private var readJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val socketMutex = Mutex()

    // Throttle tracking - atualizado dentro do mutex
    private var lastSendTime = 0L

    /**
     * Lista dispositivos pareados.
     */
    fun getPairedDevices(): List<BluetoothDevice> {
        val adapter = BluetoothAdapter.getDefaultAdapter() ?: run {
            Log.w(TAG, "getDefaultAdapter() null — device sem Bluetooth")
            return emptyList()
        }
        return try {
            adapter.bondedDevices?.toList() ?: emptyList()
        } catch (e: SecurityException) {
            Log.w(TAG, "Sem permissao para bondedDevices: ${e.message}")
            emptyList()
        }
    }

    /**
     * Conecta a um dispositivo Bluetooth.
     * Fecha socket anterior e trata timeout/erros corretamente.
     */
    fun connect(device: BluetoothDevice) {
        Log.d(TAG, "connect(device=${device.address})")
        connectJob?.cancel()
        connectJob = scope.launch {
            _state.value = State.CONNECTING
            _lastError.value = null
            socketMutex.withLock {
                var s: BluetoothSocket? = null
                try {
                    socket?.close()
                    socket = null

                    s = device.createRfcommSocketToServiceRecord(SPP_UUID)
                    withTimeout(CONNECT_TIMEOUT_MS) { s.connect() }
                    socket = s
                    _state.value = State.CONNECTED
                    Log.d(TAG, "Conectado a ${device.address}")
                    startReading()
                } catch (e: IOException) {
                    try { s?.close() } catch (_: IOException) {}
                    _state.value = State.ERROR
                    _lastError.value = "Falha ao conectar: ${e.message}"
                    Log.w(TAG, "IOException conectando: ${e.message}")
                    socket = null
                } catch (e: TimeoutCancellationException) {
                    try { s?.close() } catch (_: IOException) {}
                    _state.value = State.ERROR
                    _lastError.value = "Timeout na conexao (10s)"
                    Log.w(TAG, "Timeout conectando")
                    socket = null
                } catch (e: SecurityException) {
                    try { s?.close() } catch (_: IOException) {}
                    _state.value = State.ERROR
                    _lastError.value = "Permissao Bluetooth negada"
                    Log.w(TAG, "SecurityException conectando: ${e.message}")
                    socket = null
                } catch (e: Exception) {
                    try { s?.close() } catch (_: IOException) {}
                    _state.value = State.ERROR
                    _lastError.value = "Erro inesperado: ${e.message}"
                    Log.e(TAG, "Erro inesperado conectando", e)
                    socket = null
                }
            }
        }
    }

    /**
     * Reconecta por endereço MAC (usado pela auto-reconexão no init do VM).
     * Retorna false se o adaptador estiver indisponível, MAC for nulo/vazio
     * ou não houver permissão — o chamador decide como tratar (ex.: Snackbar).
     */
    fun connectByMac(mac: String?): Boolean {
        if (mac.isNullOrBlank()) return false
        val adapter = BluetoothAdapter.getDefaultAdapter() ?: run {
            Log.w(TAG, "connectByMac: adaptador null")
            return false
        }
        return try {
            val device = adapter.getRemoteDevice(mac)
            Log.d(TAG, "connectByMac: device encontrado, conectando…")
            connect(device)
            true
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "MAC invalido: $mac")
            false
        } catch (e: SecurityException) {
            Log.w(TAG, "Sem permissao p/ getRemoteDevice: ${e.message}")
            false
        }
    }

    /**
     * Le dados recebidos do Arduino continuamente.
     * Publica cada linha em [_incoming] para a UI acompanhar ACKs.
     */
    private fun startReading() {
        readJob?.cancel()
        readJob = scope.launch {
            try {
                val s = socket ?: return@launch
                val reader = BufferedReader(InputStreamReader(s.inputStream))
                while (isActive) {
                    val line = reader.readLine() ?: break
                    // Resposta do Arduino: ACK|TRUCK|<cmd>|OK
                    _incoming.value = line
                    Log.d(TAG, "RX: $line")
                }
            } catch (e: IOException) {
                Log.w(TAG, "Leitura interrompida: ${e.message}")
            } finally {
                if (_state.value == State.CONNECTED) {
                    _state.value = State.DISCONNECTED
                    Log.d(TAG, "Conexao perdida → DISCONNECTED")
                }
            }
        }
    }

    /**
     * Desconecta do dispositivo.
     */
    fun disconnect() {
        Log.d(TAG, "disconnect()")
        connectJob?.cancel()
        readJob?.cancel()
        scope.launch {
            socketMutex.withLock {
                try { socket?.close() } catch (_: IOException) {}
                socket = null
            }
            _state.value = State.DISCONNECTED
        }
    }

    /**
     * Envia comando com throttle (80ms minimo entre envios).
     * Comando e terminado com \n automaticamente.
     * Throttle e verificado DENTRO do mutex para evitar race condition.
     */
    suspend fun send(command: String) {
        socketMutex.withLock {
            val now = SystemClock.elapsedRealtime()
            val timeSinceLastSend = now - lastSendTime

            if (timeSinceLastSend < THROTTLE_MS) {
                delay(THROTTLE_MS - timeSinceLastSend)
            }

            val s = socket ?: return
            try {
                s.outputStream.write("$command\n".toByteArray())
                lastSendTime = SystemClock.elapsedRealtime()
            } catch (e: IOException) {
                _state.value = State.ERROR
                _lastError.value = "Erro ao enviar: ${e.message}"
                Log.w(TAG, "IOException enviando '$command': ${e.message}")
            }
        }
    }

    /**
     * Envia comando sem esperar (wrapper para callbacks).
     */
    fun sendAsync(command: String) {
        scope.launch { send(command) }
    }

    /** Versão tipada de [sendAsync] que aceita um [TruckCommand]. */
    fun sendAsync(command: TruckCommand) = sendAsync(command.cmd)

    val isConnected: Boolean get() = _state.value == State.CONNECTED

    /**
     * Desliga o servico completamente (cancela o scope). Usar no onDestroy da
     * Activity quando o usuario realmente sai — nunca em recompositions.
     */
    fun shutdown() {
        Log.d(TAG, "shutdown()")
        readJob?.cancel()
        connectJob?.cancel()
        scope.launch {
            socketMutex.withLock {
                try { socket?.close() } catch (_: IOException) {}
                socket = null
            }
            _state.value = State.DISCONNECTED
            scope.cancel()
        }
    }

    // -- Comandos do Caminhao --
    // Cada wrapper repassa a string crua do TruckCommand correspondente, mantendo
    // a API tipada e centralizando as literais no enum.

    // Movimento
    fun moveForward() = sendAsync(TruckCommand.FORWARD)
    fun moveBackward() = sendAsync(TruckCommand.BACKWARD)
    fun stop() = sendAsync(TruckCommand.STOP)
    fun steerLeft() = sendAsync(TruckCommand.LEFT)
    fun steerRight() = sendAsync(TruckCommand.RIGHT)
    fun emergencyStop() = sendAsync(TruckCommand.EMERGENCY)

    // Movimento composto (D-Pad)
    fun forwardLeft() = sendAsync(TruckCommand.FORWARD_LEFT)
    fun forwardRight() = sendAsync(TruckCommand.FORWARD_RIGHT)
    fun backLeft() = sendAsync(TruckCommand.BACK_LEFT)
    fun backRight() = sendAsync(TruckCommand.BACK_RIGHT)

    // Cacamba
    fun bucketUp() = sendAsync(TruckCommand.BUCKET_UP)
    fun bucketDown() = sendAsync(TruckCommand.BUCKET_DOWN)
    fun bucketStop() = sendAsync(TruckCommand.BUCKET_STOP)

    // Iluminacao
    fun toggleHeadlights() = sendAsync(TruckCommand.HEADLIGHT_TOGGLE)
    fun turnSignalLeft() = sendAsync(TruckCommand.SIGNAL_LEFT)
    fun turnSignalRight() = sendAsync(TruckCommand.SIGNAL_RIGHT)
    fun turnSignalOff() = sendAsync(TruckCommand.SIGNAL_OFF)
    fun hazardLights() = sendAsync(TruckCommand.HAZARD)
}
