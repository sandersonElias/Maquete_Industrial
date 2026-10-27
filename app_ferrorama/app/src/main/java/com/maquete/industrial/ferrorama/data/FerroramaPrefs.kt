package com.maquete.industrial.ferrorama.data

import android.content.Context
import android.content.SharedPreferences

/**
 * Persistência leve via SharedPreferences (mesmo padrão do app do caminhão).
 *
 * Guarda:
 *  - `lastMac` / `lastDeviceName`: auto-reconexão do HC-05 ao abrir.
 *  - `autoReconnect`: toggle (default true).
 *  - `serverUrl`: endereço do backend (locomotivas Wi-Fi).
 *  - `token` / `username`: última sessão autenticada no backend.
 */
class FerroramaPrefs(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var lastMac: String?
        get() = prefs.getString(KEY_LAST_MAC, null)
        set(value) = prefs.edit().putString(KEY_LAST_MAC, value).apply()

    var lastDeviceName: String?
        get() = prefs.getString(KEY_LAST_DEVICE_NAME, null)
        set(value) = prefs.edit().putString(KEY_LAST_DEVICE_NAME, value).apply()

    var autoReconnect: Boolean
        get() = prefs.getBoolean(KEY_AUTO_RECONNECT, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_RECONNECT, value).apply()

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value).apply()

    var token: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    var username: String?
        get() = prefs.getString(KEY_USERNAME, null)
        set(value) = prefs.edit().putString(KEY_USERNAME, value).apply()

    fun clearPairedDevice() {
        prefs.edit()
            .remove(KEY_LAST_MAC)
            .remove(KEY_LAST_DEVICE_NAME)
            .apply()
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_USERNAME)
            .apply()
    }

    companion object {
        private const val PREFS_NAME = "ferrorama_prefs"
        private const val KEY_LAST_MAC = "last_mac"
        private const val KEY_LAST_DEVICE_NAME = "last_device_name"
        private const val KEY_AUTO_RECONNECT = "auto_reconnect"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_TOKEN = "token"
        private const val KEY_USERNAME = "username"

        // Troque pelo IP do servidor na feira.
        private const val DEFAULT_SERVER_URL = "http://172.20.10.3:4000"
    }
}