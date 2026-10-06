package com.maquete.industrial.ferrorama.bluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.os.SystemClock
import android.util.Log
import com.maquete.industrial.ferrorama.data.FerroData
import com.maquete.industrial.ferrorama.data.SensorState
import com.maquete.industrial.ferrorama.data.SwitchState
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
 * Serviço Bluetooth do ferrorama.
 * Gerencia conexão RFCOMM com o HC-05 e o protocolo serial das agulhas:
 *
 *  App -> Arduino:
 *    CMD|SWITCH|<id>|SET|LEFT|RIGHT|CENTER
 *    CMD|SWITCH|<id>|ANGLE|<0-180>
 *    CMD|SWITCH|<id>|STATUS
 *    CMD|SWITCH|<id>|RESET
 *
 *  Arduino -> App:
 *    ACK|SWITCH|<id>|<estado>
 *    STATUS|SWITCH|<id>|<angulo>|<estado>|<ts>
 *    STATUS|SENSOR|<id>|<0|1>|<ts>
 *    EVENT|SENSOR|<id>|<DETECTED|CLEAR>|<ts>
 *    STATUS|GATE|<RED|YELLOW|GREEN>
 *    STATUS|SWITCH, STATUS|SENSOR a cada ~5s (heartbeat do firmware)
 *
 * Throttle de 80ms entre envios (igual ao caminhão).
 */
object FerroramaBluetoothService {

    private const val TAG = "FerrBT"
    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private const val THROTTLE_MS = 80L
    private const val CONNECT_TIMEOUT_MS = 10_000L

    enum class State { DISCONNECTED, CONNECTING, CONNECTED, ERROR }

    private val _state = MutableStateFlow(State.DISCONNECTED)
    val state: StateFlow<State> = _state

    private val _lastError = MutableStateFlow<String?>(null)
    val lastError: StateFlow<String?> = _lastError

    /** Linha crua recebida (monitor/ACK). */
    private val _incoming = MutableStateFlow<String?>(null)
    val incoming: StateFlow<String?> = _incoming

    /** Estado completo do ferrorama (agulhas + sensores + semáforo). */
    private val _data = MutableStateFlow(FerroData())
    val data: StateFlow<FerroData> = _data

    private var socket: BluetoothSocket? = null
    private var connectJob: Job? = null
    private var readJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val socketMutex = Mutex()
    private val commandChannel = Channel<String>(Channel.CONFLATED)

    init {
        scope.launch {
            for (cmd in commandChannel) {
                sendThrottled(cmd)
            }
        }
    }

    // ── Descoberta ───────────────────────────────────────────

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

    // ── Conexão ──────────────────────────────────────────────

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
                    startReading(s)
                } catch (e: IOException) {
                    try { s?.close() } catch (_: IOException) {}
                    fail("Falha ao conectar: ${e.message}")
                } catch (e: TimeoutCancellationException) {
                    try { s?.close() } catch (_: IOException) {}
                    fail("Timeout na conexao (10s)")
                } catch (e: SecurityException) {
                    try { s?.close() } catch (_: IOException) {}
                    fail("Permissao Bluetooth negada")
                } catch (e: Exception) {
                    try { s?.close() } catch (_: IOException) {}
                    fail("Erro inesperado: ${e.message}")
                }
            }
        }
    }

    private suspend fun fail(message: String) {
        socket = null
        _state.value = State.ERROR
        _lastError.value = message
        Log.w(TAG, message)
    }

    fun connectByMac(mac: String?): Boolean {
        if (mac.isNullOrBlank()) return false
        @Suppress("DEPRECATION")
        val adapter = BluetoothAdapter.getDefaultAdapter() ?: run {
            Log.w(TAG, "connectByMac: adaptador null")
            return false
        }
        return try {
            adapter.getRemoteDevice(mac).let { device ->
                Log.d(TAG, "connectByMac: ${device.address}")
                connect(device)
                true
            }
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "MAC invalido: $mac")
            false
        } catch (e: SecurityException) {
            Log.w(TAG, "Sem permissao p/ getRemoteDevice: ${e.message}")
            false
        }
    }

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
                    parseLine(line)
                }
            } catch (e: IOException) {
                Log.w(TAG, "Leitura interrompida: ${e.message}")
            } finally {
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

    fun shutdown() {
        Log.d(TAG, "shutdown()")
        readJob?.cancel()
        connectJob?.cancel()
        try { socket?.close() } catch (_: IOException) {}
        socket = null
        _state.value = State.DISCONNECTED
        scope.cancel()
    }

    val isConnected: Boolean get() = _state.value == State.CONNECTED

    // ── Envio de comandos ────────────────────────────────────

    fun sendAsync(command: String) {
        commandChannel.trySend(command)
    }

    private suspend fun sendThrottled(command: String) {
        socketMutex.withLock {
            val now = SystemClock.elapsedRealtime()
            val elapsed = now - lastSendTime
            if (elapsed < THROTTLE_MS) {
                delay(THROTTLE_MS - elapsed)
            }
            val s = socket ?: return@withLock
            try {
                s.outputStream.write("$command\n".toByteArray())
                s.outputStream.flush()
                lastSendTime = SystemClock.elapsedRealtime()
            } catch (e: IOException) {
                try { socket?.close() } catch (_: IOException) {}
                socket = null
                _state.value = State.ERROR
                _lastError.value = "Erro ao enviar: ${e.message}"
                Log.w(TAG, "IOException enviando '$command': ${e.message}")
            }
        }
    }

    private var lastSendTime = 0L

    // ── Comandos do ferrorama ────────────────────────────────

    fun moveSwitch(switchId: Int, position: String) {
        sendAsync("CMD|SWITCH|$switchId|SET|$position")
    }

    fun requestSwitchStatus(switchId: Int) {
        sendAsync("CMD|SWITCH|$switchId|STATUS")
    }

    fun resetSwitch(switchId: Int) {
        sendAsync("CMD|SWITCH|$switchId|RESET")
    }

    // ── Parser do protocolo ──────────────────────────────────

    private fun parseLine(raw: String) {
        val parts = raw.split("|")
        val type = parts.getOrNull(0) ?: return
        val subject = parts.getOrNull(1)

        try {
            when {
                type == "ACK" && subject == "SWITCH" -> {
                    val id = parts.getOrNull(2)?.toIntOrNull() ?: return
                    updateSwitch(id, state = parts.getOrNull(3), moving = true)
                }
                type == "STATUS" && subject == "SWITCH" && parts.size >= 5 -> {
                    val id = parts[2].toIntOrNull() ?: return
                    val angle = parts[3].toIntOrNull() ?: 90
                    val state = parts[4]
                    updateSwitch(id, angle = angle, state = state, moving = false)
                }
                type == "STATUS" && subject == "SENSOR" && parts.size >= 4 -> {
                    val id = parts[2].toIntOrNull() ?: return
                    updateSensor(id, active = parts[3] == "1")
                }
                type == "EVENT" && subject == "SENSOR" && parts.size >= 4 -> {
                    val id = parts[2].toIntOrNull() ?: return
                    updateSensor(id, active = parts[3] == "DETECTED")
                }
                type == "STATUS" && subject == "GATE" -> {
                    val gate = parts.getOrNull(2) ?: "RED"
                    if (gate in listOf("RED", "YELLOW", "GREEN")) {
                        _data.value = _data.value.copy(gate = gate)
                        Log.d(TAG, "Gate: $gate")
                    }
                }
                type == "EVENT" && subject == "GATE" -> {
                    val gate = parts.getOrNull(2) ?: "RED"
                    if (gate in listOf("RED", "YELLOW", "GREEN")) {
                        _data.value = _data.value.copy(gate = gate)
                        Log.d(TAG, "Gate: $gate")
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro parseando: $raw — ${e.message}")
        }
    }

    private fun updateSwitch(
        id: Int,
        angle: Int = -1,
        state: String? = null,
        moving: Boolean = false
    ) {
        if (id < 1 || id > 3) return
        val current = _data.value
        val updated = current.switches.map { sw ->
            if (sw.id == id) {
                SwitchState(
                    id = sw.id,
                    angle = if (angle >= 0) angle else sw.angle,
                    state = state ?: sw.state,
                    moving = moving
                )
            } else sw
        }
        _data.value = current.copy(switches = updated)
    }

    private fun updateSensor(id: Int, active: Boolean) {
        if (id < 1 || id > 7) return
        val current = _data.value
        val updated = current.sensors.map { s ->
            if (s.id == id) SensorState(id = s.id, active = active) else s
        }
        _data.value = current.copy(sensors = updated)
    }
}