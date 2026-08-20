package com.maquete.industrial.truck.ui.components

import androidx.compose.ui.graphics.Color
import com.maquete.industrial.truck.ui.theme.DirectionBack
import com.maquete.industrial.truck.ui.theme.DirectionForward
import com.maquete.industrial.truck.ui.theme.DirectionLeft
import com.maquete.industrial.truck.ui.theme.DirectionRight
import com.maquete.industrial.truck.ui.theme.TextDim

/**
 * Direções possíveis do joystick 2D e do D-Pad.
 *
 * Usado pelo [TruckViewModel] para rastrear a zona atual do joystick e mapear
 * para o comando Bluetooth correspondente (F, B, L, R, FL, FR, BL, BR, S).
 *
 * [STOP] representa o centro (deadzone) — só para o motor, direção mantida.
 * Ao **soltar** o dedo do joystick, o VM envia `EMERGENCY` ("SC") que para o
 * motor E centraliza a direção.
 *
 * [CENTER] é mantido por compatibilidade mas não é usado pelo joystick 2D
 * (apenas por código legado que será removido).
 */
enum class DPadDirection(val label: String, val color: Color) {
    FORWARD("Frente", DirectionForward),
    BACK("Ré", DirectionBack),
    LEFT("Esquerda", DirectionLeft),
    RIGHT("Direita", DirectionRight),
    CENTER("Centro", TextDim),
    FORWARD_LEFT("Frente Esq.", DirectionForward),
    FORWARD_RIGHT("Frente Dir.", DirectionForward),
    BACK_LEFT("Ré Esq.", DirectionBack),
    BACK_RIGHT("Ré Dir.", DirectionBack),
    STOP("Parado", TextDim)
}
