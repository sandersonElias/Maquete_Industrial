package com.maquete.industrial.truck.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

/**
 * Wrapper Compose do [JoystickView] (View de Canvas tradicional).
 *
 * O `JoystickView` foi portado do app_carro_rover como `View` clássica (não
 * vale reescrever em Compose Canvas só por cosmética — a versão View já está
 * testada e tem a animação de spring-back "de brinde"). O wrapper adapta para
 * Compose via `AndroidView`.
 *
 * Uso:
 * ```
 * JoystickComposable(
 *     modifier = Modifier.size(240.dp),
 *     onMove = { x, y -> /* x,y em [-1,1]; y > 0 = baixo */ }
 * )
 * ```
 *
 * Nota sobre o callback: como `JoystickView` é uma View, o `onMove` que setamos
 * no `update` precisa ser **capturado imediatamente** em cada recomposição
 * (não basta `factory` — lambda instável reaparece). Por isso usamos `remember`
 * para reter a view e reatribuir o callback no `update`. O `onMove` do chamador
 * deve ser estável (use `remember` no site de uso se precisar).
 */
@Composable
fun JoystickComposable(
    modifier: Modifier = Modifier,
    onMove: (x: Float, y: Float) -> Unit,
    onRelease: () -> Unit = {}
) {
    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            JoystickView(ctx).apply {
                // Log para depuração inicial; pode remover depois
                android.util.Log.d("JoystickComposable", "factory: view criada")
            }
        },
        update = { view ->
            // Reatribui os callbacks a cada recomposição — garante que mudanças
            // nos lambdas do chamador (ex.: closures que capturam estado) surtam.
            view.onMove = onMove
            view.onRelease = onRelease
        }
    )
}
