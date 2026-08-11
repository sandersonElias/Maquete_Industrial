package com.maquete.industrial.truck.ui.record

import android.os.SystemClock
import android.util.Log
import com.maquete.industrial.truck.bluetooth.TruckCommand
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Gravação local de movimentos para o caminhão funcionar de forma autônoma.
 *
 * Inspiração: pattern de record/playback do `ExcavatorActivity` do app_carro_rover,
 * adaptado de ângulos de servo para [TruckCommand]s discretos (F/B/L/U/HH/...).
 *
 * Fluxo:
 *  1. [startRecording] — limpa frames e começa a contar tempo a partir de 0.
 *  2. A cada chamada de comando do usuário ([record]), se `isRecording`, anexa
 *     um `Frame(command, ts)` com timestamp relativo ao início.
 *  3. [playback] reenvia cada frame com os mesmos delays originais, via callback
 *     [send] (tipicamente `TruckBluetoothService.sendAsync(cmd)`).
 *  4. [clear] zera tudo.
 *
 * Notas:
 *  - Não persiste entre sessões (decisão do usuário — só lifecycle em memória).
 *  - O throttle de 80ms no service pode atrasar frames gravados abaixo disso;
 *    aceitamos o atraso no playback em vez de descartar frames (decisão do plano).
 *  - Comando de Emergência (SC) NÃO deve ser gravado — sempre enviado imediato
 *    fora do fluxo de gravação (filtrar no chamador ou usar [recordEmergency]).
 *  - O Job de playback é cancelável pelo chamador (ex.: onPause) via [stopPlayback].
 */
class Recorder(
    private val send: (TruckCommand) -> Unit
) {

    private data class Frame(val command: TruckCommand, val timestamp: Long)

    private val frames = mutableListOf<Frame>()
    private var startTime = 0L

    var isRecording: Boolean = false
        private set
    var isPlaying: Boolean = false
        private set

    val recordedCount: Int get() = frames.size

    private var playbackJob: Job? = null

    /**
     * Inicia gravação: limpa frames anteriores e marca o t0.
     */
    fun startRecording() {
        frames.clear()
        startTime = SystemClock.elapsedRealtime()
        isRecording = true
        Log.d(TAG, "Gravação iniciada")
    }

    /**
     * Para a gravação. Frames ficam retidos para playback.
     */
    fun stopRecording() {
        isRecording = false
        Log.d(TAG, "Gravação parada: ${frames.size} frames")
    }

    /**
     * Anexa um comando à sequência, se `isRecording`. Inerte caso contrário.
     * Dica: ignorant — chame de qualquer ponto do VM que já despacha o comando
     * real; se não estiver gravando, é no-op.
     */
    fun record(command: TruckCommand) {
        if (!isRecording) return
        val ts = SystemClock.elapsedRealtime() - startTime
        frames.add(Frame(command, ts))
    }

    /**
     * Reproduz a sequência de frames usando o mesmo timing de gravação.
     * [scope] deve ser cancelável pelo dono (ex.: viewModelScope do VM).
     * Usa o callback [send] recebido no construtor, tipicamente
     * `{ cmd -> TruckBluetoothService.sendAsync(cmd) }`.
     */
    fun playback(scope: CoroutineScope) {
        if (isRecording || frames.isEmpty()) return
        playbackJob?.cancel()
        isPlaying = true
        Log.d(TAG, "Playback iniciado: ${frames.size} frames")
        playbackJob = scope.launch {
            val snapshot = frames.toList()
            for (i in snapshot.indices) {
                if (!isPlaying) break
                val frame = snapshot[i]
                if (i > 0) {
                    val dt = frame.timestamp - snapshot[i - 1].timestamp
                    if (dt > 0) delay(dt)
                }
                if (!isPlaying) break
                send(frame.command)
            }
            isPlaying = false
            Log.d(TAG, "Playback concluído")
        }
    }

    /**
     * Pausa/cancela o playback em andamento. Mantém os frames (`isPlaying=false`).
     */
    fun stopPlayback() {
        isPlaying = false
        playbackJob?.cancel()
    }

    /**
     * Zera tudo — usado no botão "Limpar".
     */
    fun clear() {
        stopPlayback()
        isRecording = false
        frames.clear()
        Log.d(TAG, "Recorder limpo")
    }

    companion object {
        private const val TAG = "TruckRecorder"
    }
}
