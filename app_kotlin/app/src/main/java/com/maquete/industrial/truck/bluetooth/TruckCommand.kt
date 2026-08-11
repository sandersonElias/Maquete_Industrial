package com.maquete.industrial.truck.bluetooth

/**
 * Centraliza todas as strings de comando enviadas via Bluetooth ao firmware do
 * caminhão basculante. Cada entrada casa 1:1 com um case no `executarComando()`
 * do sketch `caminhao_basculante_firmware.ino`.
 *
 * Manter este enum como única fonte da verdade evita strings literais espalhadas
 * (como era antes em TruckBluetoothService.kt e TruckViewModel.kt), facilitando
 * adicionar/remover comandos e casar com o firmware.
 *
 * O campo [cmd] é o que vai no fio (terminado por `\n` no service).
 * O campo [label] é amigável para UI (cards, gravação, monitor de comando).
 */
enum class TruckCommand(val cmd: String, val label: String) {
    // ── Movimento (motor DC) ────────────────────────────────────────────────
    FORWARD("F", "Frente"),
    BACKWARD("B", "Ré"),
    STOP("S", "Parar"),

    // ── Direção (servo 3 posições: 60/90/120°) ──────────────────────────────
    LEFT("L", "Esquerda"),
    RIGHT("R", "Direita"),
    CENTER("C", "Centro"),

    // ── D-Pad composto (1º char = motor, 2º char = direção) ─────────────────
    FORWARD_LEFT("FL", "Frente Esq."),
    FORWARD_RIGHT("FR", "Frente Dir."),
    BACK_LEFT("BL", "Ré Esq."),
    BACK_RIGHT("BR", "Ré Dir."),

    // ── Emergência (motor + direção ao centro) ──────────────────────────────
    EMERGENCY("SC", "Emergência"),

    // ── Caçamba basculante (servo: 0° = baixada, 90° = levantada) ───────────
    BUCKET_UP("U", "Subir"),
    BUCKET_DOWN("D", "Descer"),
    BUCKET_STOP("X", "Parar"),

    // ── Iluminação ─────────────────────────────────────────────────────────
    HEADLIGHT_TOGGLE("HH", "Faróis"),
    SIGNAL_LEFT("TI", "Seta Esquerda"),
    SIGNAL_RIGHT("TO", "Seta Direita"),
    SIGNAL_OFF("TX", "Setas Off"),
    HAZARD("HA", "Pisca-alerta");

    companion object {
        /**
         * Procura um comando pela string crua (`ACK|TRUCK|F|OK` → kind FORWARD).
         * Usado para interpretar o ACK recebido do Arduino.
         */
        fun fromCode(code: String): TruckCommand? =
            entries.firstOrNull { it.cmd == code }
    }
}
