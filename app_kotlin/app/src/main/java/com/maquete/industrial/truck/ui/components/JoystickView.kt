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
 * Joystick circular customizado com animação de spring-back.
 *
 * Port fiel do `JoystickView` do app_carro_rover (`com.rover.control.ui.drive.JoystickView`),
 * adaptado ao pacote do caminhão. Apenas mudanças cosméticas (TAG de log + docs).
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

        // Draw crosshair lines (subtle)
        val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#21262D")
            strokeWidth = 1f
        }
        canvas.drawLine(centerX - baseRadius, centerY, centerX + baseRadius, centerY, linePaint)
        canvas.drawLine(centerX, centerY - baseRadius, centerX, centerY + baseRadius, linePaint)

        // Draw stick with border
        canvas.drawCircle(stickX, stickY, stickRadius + 2f, paintStickBorder)
        canvas.drawCircle(stickX, stickY, stickRadius, paintStick)

        // Draw center dot on stick
        val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.FILL
        }
        canvas.drawCircle(stickX, stickY, stickRadius * 0.2f, dotPaint)
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

                if (dist <= maxDist) {
                    stickX = event.x
                    stickY = event.y
                } else {
                    val ratio = maxDist / dist
                    stickX = centerX + dx * ratio
                    stickY = centerY + dy * ratio
                }
                if (maxDist > 0f) {
                    onMove?.invoke(
                        (stickX - centerX) / maxDist,
                        (stickY - centerY) / maxDist
                    )
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

        springAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            this.duration = duration
            interpolator = DecelerateInterpolator(2f)
            addUpdateListener { animation ->
                val progress = animation.animatedValue as Float
                stickX = startX + (centerX - startX) * progress
                stickY = startY + (centerY - startY) * progress
                invalidate()

                // Invoke callback with interpolated values
                val maxDist = baseRadius - stickRadius
                if (maxDist > 0f) {
                    onMove?.invoke(
                        (stickX - centerX) / maxDist,
                        (stickY - centerY) / maxDist
                    )
                }
            }
            start()
        }
    }

    companion object {
        private const val TAG = "JoystickView"
    }
}
