package com.maquete.industrial.truck.data

import android.content.Context
import android.content.SharedPreferences

/**
 * Persistência leve via SharedPreferences.
 *
 * Guarda:
 *  - `lastMac` / `lastDeviceName`: para auto-reconexão ao abrir o app.
 *  - `autoReconnect`: toggle do usuário (default true).
 *
 * SharedPreferences foi escolhido sobre DataStore pela simplicidade síncrona —
 * o volume de dados é trivial e a API clássica evita suspends em locais onde só
 * precisamos ler uma vez no init do ViewModel.
 */
class TruckPrefs(context: Context) {

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

    /**
     * Chamado quando o usuário pede para esquecer o dispositivo pareado.
     */
    fun clearPairedDevice() {
        prefs.edit()
            .remove(KEY_LAST_MAC)
            .remove(KEY_LAST_DEVICE_NAME)
            .apply()
    }

    companion object {
        private const val PREFS_NAME = "truck_prefs"
        private const val KEY_LAST_MAC = "last_mac"
        private const val KEY_LAST_DEVICE_NAME = "last_device_name"
        private const val KEY_AUTO_RECONNECT = "auto_reconnect"
    }
}
