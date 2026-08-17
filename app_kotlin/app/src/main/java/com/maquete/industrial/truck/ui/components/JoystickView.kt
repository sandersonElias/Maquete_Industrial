package com.maquete.industrial.truck.ui.components

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.util.AttributeSet
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.animation.DecelerateInterpolator
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Eixo do joystick — controla quais eixos são reportados.
 */
enum class JoystickAxis {
    /** Movimenta apenas no eixo Y (vertical) — para frente/ré. */
    VERTICAL,
    /** Movimenta apenas no eixo X (horizontal) — para esquerda/direita. */
    HORIZONTAL,
    /** Movimenta nos dois eixos — modo original (8 direções). */
    BOTH
}

/**
 * Joystick circular customizado com animação de spring-back.
 *
 * Port fiel do `JoystickView` do app_carro_rover (`com.rover.control.ui.drive.JoystickView`),
 * adaptado ao pacote do caminhão. Suporta modo 1D via [axis].
 *
 * Retorna valores normalizados em [-1, 1] para X e Y via [onMove]:
 *  - x: -1 (esquerda) .. +1 (direita)
 *  - y: -1 (cima)    .. +1 (baixo) — note que y é invertido vs. Compose Canvas
 *
 * No soltar (ACTION_UP), anima "mola" de volta ao centro e dispara [onMove]
 * a cada frame com valores interpolados, então o chamador recebe (0,0) no fim.
 */
class JoystickView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    /**
     * Controla quais eixos são reportados no callback [onMove].
     * - [JoystickAxis.VERTICAL]: só reporta Y (X sempre = 0)
     * - [JoystickAxis.HORIZONTAL]: só reporta X (Y sempre = 0)
     * - [JoystickAxis.BOTH]: reporta X e Y (modo original)
     */
    var axis: JoystickAxis = JoystickAxis.BOTH

    var onMove: ((x: Float, y: Float) -> Unit)? = null

    /**
     * Disparado no ACTION_UP / ACTION_CANCEL — sinaliza "soltei o stick" para
     * o chamador poder forçar um STOP (a animação de spring-back pode pular a
     * dead-zone e deixar o último comando travado sem este callback).
     */
    var onRelease: (() -> Unit)? = null

    // Base circle paint with gradient
    private val paintBase = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val paintBaseBorder = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        // Azul (paleta SecondaryBlue do tema) — antes era verde do rover.
        color = Color.parseColor("#58A6FF")
        style = Paint.Style.STROKE
        strokeWidth = 3f
    }

    // Stick paint with gradient
    private val paintStick = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val paintStickBorder = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#58A6FF")
        style = Paint.Style.STROKE
        strokeWidth = 2f
    }

    // Glow effect paint — azul com 25% alfa.
    private val paintGlow = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#4058A6FF")
        style = Paint.Style.FILL
    }

    private var centerX = 0f
    private var centerY = 0f
    private var baseRadius = 0f
    private var stickRadius = 0f

    private var stickX = 0f
    private var stickY = 0f

    // Animation
    private var springAnimator: ValueAnimator? = null

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        centerX = w / 2f
        centerY = h / 2f
        baseRadius  = min(w, h) / 2f * 0.9f
        stickRadius = baseRadius * 0.38f
        stickX = centerX
        stickY = centerY

        // Create gradients
        paintBase.shader = RadialGradient(
            centerX, centerY, baseRadius,
            intArrayOf(Color.parseColor("#1C2333"), Color.parseColor("#161B22")),
            floatArrayOf(0f, 1f),
            Shader.TileMode.CLAMP
        )

        paintStick.shader = RadialGradient(
            centerX, centerY, stickRadius,
            // Stick em azul — deixa um azul mais claro no centro para um "glow soft".
            intArrayOf(Color.parseColor("#7DB7FF"), Color.parseColor("#58A6FF")),
            floatArrayOf(0f, 1f),
            Shader.TileMode.CLAMP
        )
    }

    override fun onDraw(canvas: Canvas) {
        // Draw base with glow effect
        canvas.drawCircle(centerX, centerY, baseRadius + 4f, paintGlow)
        canvas.drawCircle(centerX, centerY, baseRadius, paintBase)
        canvas.drawCircle(centerX, centerY, baseRadius, paintBaseBorder)

        // Draw crosshair lines (subtle) — conforme o eixo
        val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#21262D")
            strokeWidth = 1f
        }
        when (axis) {
            JoystickAxis.VERTICAL -> {
                // Só linha vertical
                canvas.drawLine(centerX, centerY - baseRadius, centerX, centerY + baseRadius, linePaint)
            }
            JoystickAxis.HORIZONTAL -> {
                // Só linha horizontal
                canvas.drawLine(centerX - baseRadius, centerY, centerX + baseRadius, centerY, linePaint)
            }
            JoystickAxis.BOTH -> {
                // Ambas as linhas (crosshair)
                canvas.drawLine(centerX - baseRadius, centerY, centerX + baseRadius, centerY, linePaint)
                canvas.drawLine(centerX, centerY - baseRadius, centerX, centerY + baseRadius, linePaint)
            }
        }

        // Posição visual do stick conforme o eixo
        val visualX = when (axis) {
            JoystickAxis.VERTICAL -> centerX
            else -> stickX
        }
        val visualY = when (axis) {
            JoystickAxis.HORIZONTAL -> centerY
            else -> stickY
        }

        // Draw stick with border
        canvas.drawCircle(visualX, visualY, stickRadius + 2f, paintStickBorder)
        canvas.drawCircle(visualX, visualY, stickRadius, paintStick)

        // Draw center dot on stick
        val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.FILL
        }
        canvas.drawCircle(visualX, visualY, stickRadius * 0.2f, dotPaint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE -> {
                // Cancel any running spring animation
                springAnimator?.cancel()

                val dx = event.x - centerX
                val dy = event.y - centerY
                val dist = sqrt(dx * dx + dy * dy)
                val maxDist = baseRadius - stickRadius

                // Calcula posição do stick conforme o eixo
                when (axis) {
                    JoystickAxis.VERTICAL -> {
                        // Só permite movimento vertical
                        stickX = centerX
                        stickY = if (dist <= maxDist) event.y else {
                            val ratio = maxDist / dist
                            centerY + dy * ratio
                        }
                        stickY = stickY.coerceIn(centerY - maxDist, centerY + maxDist)
                    }
                    JoystickAxis.HORIZONTAL -> {
                        // Só permite movimento horizontal
                        stickY = centerY
                        stickX = if (dist <= maxDist) event.x else {
                            val ratio = maxDist / dist
                            centerX + dx * ratio
                        }
                        stickX = stickX.coerceIn(centerX - maxDist, centerX + maxDist)
                    }
                    JoystickAxis.BOTH -> {
                        // Movimento livre em ambos os eixos
                        if (dist <= maxDist) {
                            stickX = event.x
                            stickY = event.y
                        } else {
                            val ratio = maxDist / dist
                            stickX = centerX + dx * ratio
                            stickY = centerY + dy * ratio
                        }
                    }
                }
                if (maxDist > 0f) {
                    val rawX = (stickX - centerX) / maxDist
                    val rawY = (stickY - centerY) / maxDist
                    val reportX = when (axis) {
                        JoystickAxis.HORIZONTAL -> rawX
                        JoystickAxis.BOTH -> rawX
                        else -> 0f
                    }
                    val reportY = when (axis) {
                        JoystickAxis.VERTICAL -> rawY
                        JoystickAxis.BOTH -> rawY
                        else -> 0f
                    }
                    onMove?.invoke(reportX, reportY)
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                // Notifica release ANTES da animação para garantir que o chamador
                // force STOP mesmo que o spring-back pule frames da dead-zone.
                onRelease?.invoke()
                // Spring-back animation
                animateSpringBack()
            }
        }
        invalidate()
        return true
    }

    private fun animateSpringBack() {
        val startX = stickX
        val startY = stickY
        val duration = 350L

        // Destino final conforme o eixo
        val targetX = when (axis) {
            JoystickAxis.VERTICAL -> centerX   // mantém X centralizado
            else -> centerX                    // sempre volta ao centro
        }
        val targetY = when (axis) {
            JoystickAxis.HORIZONTAL -> centerY // mantém Y centralizado
            else -> centerY                    // sempre volta ao centro
        }

        springAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            this.duration = duration
            interpolator = DecelerateInterpolator(2f)
            addUpdateListener { animation ->
                val progress = animation.animatedValue as Float
                stickX = startX + (targetX - startX) * progress
                stickY = startY + (targetY - startY) * progress
                invalidate()

                // Invoke callback with interpolated values
                val maxDist = baseRadius - stickRadius
                if (maxDist > 0f) {
                    val rawX = (stickX - centerX) / maxDist
                    val rawY = (stickY - centerY) / maxDist
                    val reportX = when (axis) {
                        JoystickAxis.HORIZONTAL -> rawX
                        JoystickAxis.BOTH -> rawX
                        else -> 0f
                    }
                    val reportY = when (axis) {
                        JoystickAxis.VERTICAL -> rawY
                        JoystickAxis.BOTH -> rawY
                        else -> 0f
                    }
                    onMove?.invoke(reportX, reportY)
                }
            }
            start()
        }
    }

    companion object {
        private const val TAG = "JoystickView"
    }
}
