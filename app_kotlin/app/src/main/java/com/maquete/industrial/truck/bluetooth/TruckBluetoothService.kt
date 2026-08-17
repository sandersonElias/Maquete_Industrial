package com.maquete.industrial.truck.bluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.os.SystemClock
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
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
 * As strings crûas vivem centralizadas em [TruckCommand].
 *
 * Throttle: 80ms minimo entre envios para evitar overflow do buffer serial.
 *
 * Correções aplicadas (vs. versão original):
 *  - [startReading] recebe o socket por parâmetro (evita race de leitura fora do mutex)
 *  - [shutdown] fecha o socket antes de cancelar o scope
 *  - Buffer do BufferedReader é fechado no finally da coroutine de leitura
 *  - Erro de envio fecha o socket (não deixa stream quebrado aberto)
 *  - Throttle via conflated channel (não serializa coroutines no mutex)
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

    private val _incoming = MutableStateFlow<String?>(null)
    val incoming: StateFlow<String?> = _incoming

    private var socket: BluetoothSocket? = null
    private var connectJob: Job? = null
    private var readJob: Job? = null
    private var sendJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val socketMutex = Mutex()

    // Channel conflated: mantém apenas o último comando. Um único consumidor
    // aplica o throttle de 80ms. Evita o lag cumulativo do delay-in-mutex.
    private val commandChannel = Channel<String>(Channel.CONFLATED)

    init {
        // Único consumidor do channel — aplica throttle entre comandos.
        scope.launch {
            for (cmd in commandChannel) {
                sendThrottled(cmd)
            }
        }
    }

    /**
     * Lista dispositivos pareados.
     */
    fun getPairedDevices(): List<BluetoothDevice> {
        @Suppress("DEPRECATION")
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
                    // Passa o socket por parâmetro para evitar race (item 1.5)
                    startReading(s)
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
     */
    fun connectByMac(mac: String?): Boolean {
        if (mac.isNullOrBlank()) return false
        @Suppress("DEPRECATION")
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
     * Recebe o socket por parâmetro para evitar race (item 1.5).
     * Fecha o BufferedReader no finally (item 1.10).
     */
    private fun startReading(s: BluetoothSocket) {
        readJob?.cancel()
        readJob = scope.launch {
            var reader: BufferedReader? = null
            try {
                reader = BufferedReader(InputStreamReader(s.inputStream))
                while (isActive) {
                    val line = reader.readLine() ?: break
                    _incoming.value = line
                    Log.d(TAG, "RX: $line")
                }
            } catch (e: IOException) {
                Log.w(TAG, "Leitura interrompida: ${e.message}")
            } finally {
                // Garante fechamento do reader (item 1.10)
                withContext(NonCancellable) {
                    try { reader?.close() } catch (_: IOException) {}
                }
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
     * Comando é terminado com \n automaticamente.
     * Vai pelo conflated channel — não bloqueia o chamador (item 1.11).
     */
    suspend fun send(command: String) {
        commandChannel.send(command)
    }

    /**
     * Envia comando sem esperar (wrapper para callbacks).
     */
    fun sendAsync(command: String) {
        // trySend (não-suspend) no conflated channel nunca falha com buffer cheio
        commandChannel.trySend(command)
    }

    /** Versão tipada que aceita um [TruckCommand]. */
    fun sendAsync(command: TruckCommand) = sendAsync(command.cmd)

    /**
     * Consumidor do channel — aplica throttle de 80ms entre envios.
     * Em caso de IOException, fecha o socket e seta ERROR (item 1.9).
     */
    private suspend fun sendThrottled(command: String) {
        socketMutex.withLock {
            val now = SystemClock.elapsedRealtime()
            val lastSent = lastSendTime
            val elapsed = now - lastSent
            if (elapsed < THROTTLE_MS) {
                delay(THROTTLE_MS - elapsed)
            }

            val s = socket ?: return@withLock
            try {
                s.outputStream.write("$command\n".toByteArray())
                s.outputStream.flush()
                lastSendTime = SystemClock.elapsedRealtime()
            } catch (e: IOException) {
                // Fecha socket inválido para próximas chamadas não falharem (1.9)
                try { socket?.close() } catch (_: IOException) {}
                socket = null
                _state.value = State.ERROR
                _lastError.value = "Erro ao enviar: ${e.message}"
                Log.w(TAG, "IOException enviando '$command': ${e.message}")
            }
        }
    }

    // Throttle tracking — só acessado dentro do socketMutex
    private var lastSendTime = 0L

    val isConnected: Boolean get() = _state.value == State.CONNECTED

    /**
     * Desliga o servico completamente (cancela o scope). Usado no onCleared do
     * ViewModel — a Activity NÃO deve chamar isto (ver item 1.7 do plano).
     *
     * Fecha o socket ANTES de cancelar o scope (item 1.6) para evitar
     * CancellationException dentro do withLock que pulasse o close.
     */
    fun shutdown() {
        Log.d(TAG, "shutdown()")
        readJob?.cancel()
        connectJob?.cancel()
        sendJob?.cancel()
        // Fecha o socket sincronamente antes de cancelar o scope
        try {
            socket?.close()
        } catch (_: IOException) {}
        socket = null
        _state.value = State.DISCONNECTED
        scope.cancel()
    }

    // -- Comandos do Caminhao --
    // Cada wrapper repassa a string crua do TruckCommand correspondente.

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
