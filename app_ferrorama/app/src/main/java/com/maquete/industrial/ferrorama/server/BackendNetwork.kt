package com.maquete.industrial.ferrorama.server

import android.util.Log
import com.maquete.industrial.ferrorama.data.LocoState
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Comunicação com o backend (locomotivas Wi-Fi / ESP-12E).
 *
 *  - Login:    POST /api/auth/login          → JWT
 *  - Comando:  POST /api/locomotive/command  → envia p/ o ESP via Socket.IO
 *  - Estados:  GET  /api/locomotive/state    → lista das locomotivas
 *  - Escuta:   Socket.IO na sala "dashboard": loco:update
 *
 * O socket.io-client (io.socket) já traz OkHttp como dependência; mantemos a
 * referência explícita ao OkHttp só para as chamadas REST.
 */
class BackendNetwork(
    var baseUrl: String,
    private val onLocoUpdate: (JSONObject) -> Unit,
    private val onSocketConnected: (Boolean) -> Unit,
    private val onSocketAuthenticated: (Boolean) -> Unit
) {

    private val okhttp = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private var socket: Socket? = null
    private var token: String? = null

    // ── REST ─────────────────────────────────────────────────

    /** POST /api/auth/login → token JWT. */
    suspend fun login(username: String, password: String): String? = withContext(Dispatchers.IO) {
        val body = JSONObject()
            .put("username", username)
            .put("password", password)
            .toString()
            .toRequestBody(JSON_MEDIA)

        val req = Request.Builder()
            .url("$baseUrl/api/auth/login".trimEnd('/'))
            .post(body)
            .build()

        try {
            okhttp.newCall(req).execute().use { res ->
                val json = JSONObject(res.body?.string() ?: "{}")
                if (!res.isSuccessful) {
                    Log.w(TAG, "Login falhou (${res.code}): $json")
                    lastError = json.optString("error", "Falha no login")
                    null
                } else {
                    json.optString("token").takeIf { it.isNotBlank() }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro de rede no login: ${e.message}")
            lastError = e.message ?: "Erro de rede"
            null
        }
    }

    /** GET /api/locomotive/state → lista de estados. */
    suspend fun fetchLocomotives(): List<LocoState> = withContext(Dispatchers.IO) {
        val tk = token ?: return@withContext emptyList()
        val req = Request.Builder()
            .url("$baseUrl/api/locomotive/state".trimEnd('/'))
            .get()
            .header("Authorization", "Bearer $tk")
            .build()

        try {
            okhttp.newCall(req).execute().use { res ->
                if (!res.isSuccessful) {
                    Log.w(TAG, "fetchLocomotives falhou (${res.code})")
                    return@use emptyList()
                }
                val raw = res.body?.string() ?: "[]"
                val arr = JSONArray(raw)
                (0 until arr.length()).mapNotNull { i ->
                    arr.optJSONObject(i)?.toLocoState()
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro buscando locomotivas: ${e.message}")
            emptyList()
        }
    }

    /** POST /api/locomotive/command → enviar comando ao ESP. */
    suspend fun sendCommand(locoId: String, command: String, speed: Int): Boolean =
        withContext(Dispatchers.IO) {
            val tk = token ?: run {
                lastError = "Não autenticado no servidor"
                return@withContext false
            }
            val body = JSONObject()
                .put("locoId", locoId)
                .put("command", command)
                .put("speed", speed)
                .toString()
                .toRequestBody(JSON_MEDIA)

            val req = Request.Builder()
                .url("$baseUrl/api/locomotive/command".trimEnd('/'))
                .post(body)
                .header("Authorization", "Bearer $tk")
                .build()

            try {
                okhttp.newCall(req).execute().use { res ->
                    if (!res.isSuccessful) {
                        lastError = "Comando rejeitado (${res.code})"
                        Log.w(TAG, "Comando falhou (${res.code})")
                        false
                    } else {
                        Log.d(TAG, "Comando OK: $locoId $command")
                        true
                    }
                }
            } catch (e: Exception) {
                lastError = e.message ?: "Erro de rede"
                Log.w(TAG, "Erro enviando comando: ${e.message}")
                false
            }
        }

    // ── Socket.IO ────────────────────────────────────────────

    /**
     * Conecta o Socket.IO e autentica na sala "dashboard" para receber
     * `loco:update` (estado real enviado pelos ESPs).
     */
    fun connectSocket(jwt: String?) {
        token = jwt
        if (jwt.isNullOrBlank()) {
            // Sem token: conecta mas fica em modo leitura.
        }
        disconnectSocket()

        val options = IO.Options().apply {
            transports = arrayOf("websocket")
            reconnection = true
            reconnectionDelay = 1000
            timeout = 10_000
        }

        val s = try {
            IO.socket(baseUrl.trimEnd('/'), options)
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao criar socket: ${e.message}")
            lastError = e.message ?: "Erro no Socket.IO"
            return
        }
        socket = s

        s.on(Socket.EVENT_CONNECT) {
            Log.d(TAG, "Socket conectado: ${s.id()}")
            jwt?.takeIf { it.isNotBlank() }?.let { tk ->
                s.emit("authenticate", JSONObject().put("token", tk))
            }
            onSocketConnected(true)
        }

        s.on("authenticated") { args ->
            val ok = args.firstOrNull()?.let {
                (it as? JSONObject)?.optBoolean("success") ?: false
            } ?: false
            onSocketAuthenticated(ok)
        }

        s.on(Socket.EVENT_DISCONNECT) {
            onSocketConnected(false)
        }

        s.on(Socket.EVENT_CONNECT_ERROR) {
            Log.w(TAG, "connect_error (backend offline?)")
        }

        s.on("loco:update") { args ->
            val obj = args.firstOrNull() as? JSONObject
            if (obj != null) onLocoUpdate(obj)
        }

        s.connect()
    }

    fun disconnectSocket() {
        socket?.disconnect()
        socket = null
    }

    // ── Helpers ──────────────────────────────────────────────

    var lastError: String? = null
        private set

    private fun JSONObject.toLocoState(): LocoState? {
        val id = optString("loco_id").takeIf { it.isNotBlank() } ?: return null
        return LocoState(
            locoId = id,
            name = optString("name", id),
            speed = optInt("speed", 0),
            direction = optString("direction", "stop"),
            battery = optDouble("battery_voltage", 0.0),
            connected = optBoolean("connected", false)
        )
    }

    companion object {
        private const val TAG = "FerrNet"
        private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()
    }
}