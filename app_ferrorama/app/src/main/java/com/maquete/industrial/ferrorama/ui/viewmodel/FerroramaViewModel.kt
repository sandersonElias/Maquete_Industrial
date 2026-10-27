package com.maquete.industrial.ferrorama.ui.viewmodel

import android.app.Application
import android.bluetooth.BluetoothDevice
import android.os.Build
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.maquete.industrial.ferrorama.bluetooth.FerroramaBluetoothService
import com.maquete.industrial.ferrorama.data.FerroData
import com.maquete.industrial.ferrorama.data.LocoState
import com.maquete.industrial.ferrorama.data.FerroramaPrefs
import com.maquete.industrial.ferrorama.server.BackendNetwork
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * ViewModel central do ferrorama.
 *
 * Duas fontes independentes:
 *  - Bluetooth (HC-05): agulhas, sensores e semáforo — via [FerroramaBluetoothService].
 *  - Backend (Wi-Fi):   as 2 locomotivas (ESP-12E) — via [BackendNetwork].
 *
 * Decisão de arquitetura (com o usuário): o app fala DIRETO com o HC-05 para
 * as agulhas (Bluetooth clássico SPP, Android) e com o backend via Wi-Fi para
 * as locomotivas. Não usa o gateway Bluetooth do Raspberry Pi.
 */
class FerroramaViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = FerroramaPrefs(application)

    // ── Estado exposto à Compose UI ──────────────────────────
    var isConnected by mutableStateOf(false)
        private set
    var btDeviceName by mutableStateOf<String?>(null)
        private set
    var btError by mutableStateOf<String?>(null)
        private set

    // Estado do ferrorama (agulhas + sensores + semáforo)
    var ferData by mutableStateOf(FerroData())
        private set

    // Servidor / locomotivas
    var serverConnected by mutableStateOf(false)
        private set
    var authenticated by mutableStateOf(false)
        private set
    var serverError by mutableStateOf<String?>(null)
        private set
    var serverLoading by mutableStateOf(false)
        private set
    var locos by mutableStateOf(defaultLocos())
        private set

    // Última linha crua do serial (monitor/ACK)
    var lastRawLine by mutableStateOf<String?>(null)
        private set

    private lateinit var network: BackendNetwork

    init {
        network = BackendNetwork(
            baseUrl = prefs.serverUrl,
            onLocoUpdate = { obj -> mergeLoco(obj) },
            onSocketConnected = { c -> serverConnected = c },
            onSocketAuthenticated = { ok -> authenticated = ok }
        )

        // Observa o estado do Bluetooth
        viewModelScope.launch {
            FerroramaBluetoothService.state.collect { state ->
                isConnected = state == FerroramaBluetoothService.State.CONNECTED
                when (state) {
                    FerroramaBluetoothService.State.ERROR ->
                        btError = FerroramaBluetoothService.lastError.value
                    FerroramaBluetoothService.State.CONNECTED -> {
                        btError = null
                        // Pedir status dos 3 switches ao reconectar
                        FerroramaBluetoothService.requestSwitchStatus(1)
                        FerroramaBluetoothService.requestSwitchStatus(2)
                        FerroramaBluetoothService.requestSwitchStatus(3)
                    }
                    else -> {}
                }
            }
        }

        // Observa os dados do ferrorama (agulhas/sensores/semáforo)
        viewModelScope.launch {
            FerroramaBluetoothService.data.collect { d -> ferData = d }
        }

        // Observa as linhas cruas (ACKs de status)
        viewModelScope.launch {
            FerroramaBluetoothService.incoming.collect { line ->
                if (line != null) lastRawLine = line
            }
        }

        // Auto-reconexão do HC-05 ao abrir
        if (prefs.autoReconnect && !prefs.lastMac.isNullOrBlank()) {
            Log.d(TAG, "Auto-reconectando a ${prefs.lastMac}")
            btDeviceName = prefs.lastDeviceName
            FerroramaBluetoothService.connectByMac(prefs.lastMac)
        }
    }

    // ── Permissões (via Activity com contracts modernos) ────

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

    fun onPermissionsResult(granted: Boolean) {
        if (!granted) {
            btError = "Permissão Bluetooth necessária"
            return
        }
        if (isConnected) return
        if (!prefs.lastMac.isNullOrBlank()) {
            btDeviceName = prefs.lastDeviceName
            FerroramaBluetoothService.connectByMac(prefs.lastMac)
        }
    }

    fun onBluetoothEnableResult(enabled: Boolean) {
        if (!enabled) btError = "Bluetooth está desligado"
    }

    fun shouldRequestBluetoothEnable(): Boolean {
        @Suppress("DEPRECATION")
        val adapter = android.bluetooth.BluetoothAdapter.getDefaultAdapter()
            ?: run {
                btError = "Bluetooth não disponível neste dispositivo"
                return false
            }
        return !adapter.isEnabled
    }

    // ── Bluetooth ────────────────────────────────────────────

    fun getPairedDevices(): List<BluetoothDevice> =
        FerroramaBluetoothService.getPairedDevices()

    fun connectTo(device: BluetoothDevice) {
        val name = try { device.name ?: "HC-05" } catch (_: SecurityException) { "HC-05" }
        btDeviceName = name
        prefs.lastMac = device.address
        prefs.lastDeviceName = name
        FerroramaBluetoothService.connect(device)
    }

    fun disconnectBluetooth() {
        FerroramaBluetoothService.disconnect()
        isConnected = false
        btDeviceName = null
    }

    // ── Agulhas ──────────────────────────────────────────────

    fun moveSwitch(switchId: Int, position: String) {
        FerroramaBluetoothService.moveSwitch(switchId, position)
    }

    fun requestSwitchStatus(switchId: Int) {
        FerroramaBluetoothService.requestSwitchStatus(switchId)
    }

    // ── Servidor / locomotivas ───────────────────────────────

    fun setServerUrl(url: String) {
        prefs.serverUrl = url
        network.baseUrl = url
    }

    fun savedServerUrl(): String = prefs.serverUrl
    fun savedUsername(): String = prefs.username ?: ""

    /** Login no backend: guarda token, conecta o socket autenticado e busca estados. */
    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            serverError = "Usuário e senha obrigatórios"
            return
        }
        serverLoading = true
        serverError = null
        viewModelScope.launch {
            val token = network.login(username.trim(), password)
            serverLoading = false
            if (token.isNullOrBlank()) {
                serverError = network.lastError ?: "Falha no login"
                return@launch
            }
            prefs.token = token
            prefs.username = username.trim()
            authenticated = true
            network.connectSocket(token)
            fetchLocomotives()
        }
    }

    /** Conecta o socket sem login (leitura apenas). */
    fun connectServer() {
        val token = prefs.token
        network.baseUrl = prefs.serverUrl
        authenticated = !token.isNullOrBlank()
        network.connectSocket(token)
    }

    /** GET /api/locomotive/state */
    fun fetchLocomotives() {
        viewModelScope.launch {
            val list = network.fetchLocomotives()
            if (list.isNotEmpty()) locos = list
        }
    }

    /** POST /api/locomotive/command */
    fun sendLocoCommand(locoId: String, command: String, speed: Int) {
        if (!authenticated) {
            serverError = "Faça login para comandar as locomotivas"
            return
        }
        viewModelScope.launch {
            val ok = network.sendCommand(locoId, command, speed)
            if (ok) {
                // Atualização otimista; o ack real chega via socket (loco:update)
                locos = locos.map { l ->
                    if (l.locoId == locoId) l.copyWith(
                        speed = if (command == "stop") 0 else speed,
                        direction = command,
                        connected = true
                    ) else l
                }
            } else {
                serverError = network.lastError ?: "Falha ao enviar comando"
            }
        }
    }

    fun clearErrors() {
        btError = null
        serverError = null
    }

    // ── Merge via Socket.IO ──────────────────────────────────

    /**
     * Aplica um `loco:update` recebido do backend (estado real do ESP).
     * Payload: { locoId, speed, direction, battery, connected, timestamp }
     */
    private fun mergeLoco(obj: JSONObject) {
        val id = obj.optString("locoId") ?: return
        val conn = obj.optBoolean("connected", true)
        val speed = obj.optInt("speed", -1)
        val direction = obj.optString("direction", "")
        val battery = obj.optDouble("battery", -1.0)

        locos = locos.map { l ->
            if (l.locoId != id) return@map l
            l.copyWith(
                speed = speed.takeIf { it >= 0 }?.let { speed },
                direction = direction.takeIf { it.isNotEmpty() },
                battery = battery.takeIf { it >= 0 },
                connected = conn
            )
        }
        // Se a locomotiva veio conectada mas não existia, insere.
        if (locos.none { it.locoId == id }) {
            locos = locos + LocoState(
                locoId = id,
                name = id,
                speed = speed.takeIf { it >= 0 } ?: 0,
                direction = direction,
                battery = battery.takeIf { it >= 0 } ?: 0.0,
                connected = conn
            )
        }
    }

    override fun onCleared() {
        super.onCleared()
        network.disconnectSocket()
        FerroramaBluetoothService.shutdown()
    }

    companion object {
        private const val TAG = "FerroramaVM"

        private fun defaultLocos() = listOf(
            LocoState(locoId = "loco-01", name = "Locomotiva 01"),
            LocoState(locoId = "loco-02", name = "Locomotiva 02")
        )
    }
}