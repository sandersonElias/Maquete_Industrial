package com.maquete.industrial.truck.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

/**
 * Wrapper Compose do [JoystickView] (View de Canvas tradicional).
 *
 * Suporta modo 1D via [axis]:
 * - [JoystickAxis.VERTICAL]: só reporta eixo Y (frente/ré)
 * - [JoystickAxis.HORIZONTAL]: só reporta eixo X (esquerda/direita)
 * - [JoystickAxis.BOTH]: reporta ambos os eixos (8 direções)
 *
 * Uso:
 * ```
 * JoystickComposable(
 *     modifier = Modifier.size(240.dp),
 *     axis = JoystickAxis.VERTICAL,
 *     onMove = { x, y -> /* y em [-1,1]; y > 0 = baixo */ }
 * )
 * ```
 */
@Composable
fun JoystickComposable(
    modifier: Modifier = Modifier,
    axis: JoystickAxis = JoystickAxis.BOTH,
    onMove: (x: Float, y: Float) -> Unit,
    onRelease: () -> Unit = {}
) {
    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            JoystickView(ctx)
        },
        update = { view ->
            view.axis = axis
            view.onMove = onMove
            view.onRelease = onRelease
        }
    )
}
