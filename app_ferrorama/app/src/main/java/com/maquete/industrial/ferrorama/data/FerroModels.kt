package com.maquete.industrial.ferrorama.data

/**
 * Estados do ferrorama vistos pelo app.
 *
 * O serial (Bluetooth) alimenta [FerroData] (agulhas + sensores + semáforo).
 * O backend (Socket.IO) alimenta as locomotivas Wi-Fi ([LocoState]).
 */
data class SwitchState(
    val id: Int,
    val angle: Int = 90,
    val state: String = "CENTER",
    val moving: Boolean = false
) {
    // LEFT = 72°, CENTER = 90°, RIGHT = 108° (igual ao firmware)
    val isLeft: Boolean get() = angle < 90
    val isRight: Boolean get() = angle > 90
}

data class SensorState(val id: Int, val active: Boolean = false)

data class FerroData(
    val switches: List<SwitchState> = (1..3).map { SwitchState(it) },
    val sensors: List<SensorState> = (1..7).map { SensorState(it) },
    val gate: String = "RED"
) {
    val activeSensorCount: Int get() = sensors.count { it.active }
}

data class LocoState(
    val locoId: String = "",
    val name: String = "",
    val speed: Int = 0,
    val direction: String = "stop",
    val battery: Double = 0.0,
    val connected: Boolean = false
) {
    val isForward: Boolean get() = direction == "forward"
    val isBackward: Boolean get() = direction == "backward"

    fun copyWith(
        speed: Int? = null,
        direction: String? = null,
        battery: Double? = null,
        connected: Boolean? = null
    ) = LocoState(
        locoId = locoId,
        name = name,
        speed = speed ?: this.speed,
        direction = direction ?: this.direction,
        battery = battery ?: this.battery,
        connected = connected ?: this.connected
    )
}

/** Credenciais de login no backend (para os comandos das locomotivas). */
data class Credentials(val username: String, val password: String)