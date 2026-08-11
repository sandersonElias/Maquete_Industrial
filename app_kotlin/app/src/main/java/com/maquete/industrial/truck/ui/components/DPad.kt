package com.maquete.industrial.truck.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.maquete.industrial.truck.ui.theme.*
import kotlin.math.sqrt

enum class DPadDirection(val label: String, val color: Color) {
    FORWARD("Frente", DirectionForward),
    BACK("Ré", DirectionBack),
    LEFT("Esquerda", DirectionLeft),
    RIGHT("Direita", DirectionRight),
    FORWARD_LEFT("Frente Esq.", DirectionForward),
    FORWARD_RIGHT("Frente Dir.", DirectionForward),
    BACK_LEFT("Ré Esq.", DirectionBack),
    BACK_RIGHT("Ré Dir.", DirectionBack),
    STOP("Parado", TextDim)
}

@Composable
fun DPad(
    onDirectionChange: (DPadDirection) -> Unit,
    modifier: Modifier = Modifier,
    size: Int = 180
) {
    var currentDirection by remember { mutableStateOf(DPadDirection.STOP) }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        Canvas(
            modifier = Modifier
                .size(size.dp)
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            val direction = calculateDirection(offset, size.dp.toPx() / 2)
                            currentDirection = direction
                            onDirectionChange(direction)
                        },
                        onDrag = { change, _ ->
                            change.consume()
                            val direction = calculateDirection(change.position, size.dp.toPx() / 2)
                            if (direction != currentDirection) {
                                currentDirection = direction
                                onDirectionChange(direction)
                            }
                        },
                        onDragEnd = {
                            currentDirection = DPadDirection.STOP
                            onDirectionChange(DPadDirection.STOP)
                        }
                    )
                }
        ) {
            val centerX = size.dp.toPx() / 2
            val centerY = size.dp.toPx() / 2
            val radius = size.dp.toPx() / 2

            // Base circle
            drawCircle(
                color = DarkCard,
                radius = radius,
                center = Offset(centerX, centerY)
            )

            // Border
            drawCircle(
                color = DarkBorder,
                radius = radius,
                center = Offset(centerX, centerY),
                style = Stroke(width = 2.dp.toPx())
            )

            // Direction zones (arrows)
            val arrowLength = radius * 0.6f
            val arrowWidth = 4.dp.toPx()

            // Forward arrow
            drawLine(
                color = if (currentDirection == DPadDirection.FORWARD) DirectionForward else DarkBorder,
                start = Offset(centerX, centerY - radius * 0.2f),
                end = Offset(centerX, centerY - arrowLength),
                strokeWidth = arrowWidth
            )

            // Back arrow
            drawLine(
                color = if (currentDirection == DPadDirection.BACK) DirectionBack else DarkBorder,
                start = Offset(centerX, centerY + radius * 0.2f),
                end = Offset(centerX, centerY + arrowLength),
                strokeWidth = arrowWidth
            )

            // Left arrow
            drawLine(
                color = if (currentDirection == DPadDirection.LEFT) DirectionLeft else DarkBorder,
                start = Offset(centerX - radius * 0.2f, centerY),
                end = Offset(centerX - arrowLength, centerY),
                strokeWidth = arrowWidth
            )

            // Right arrow
            drawLine(
                color = if (currentDirection == DPadDirection.RIGHT) DirectionRight else DarkBorder,
                start = Offset(centerX + radius * 0.2f, centerY),
                end = Offset(centerX + arrowLength, centerY),
                strokeWidth = arrowWidth
            )

            // Center dot
            drawCircle(
                color = currentDirection.color,
                radius = 8.dp.toPx(),
                center = Offset(centerX, centerY)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = currentDirection.label,
            style = MaterialTheme.typography.bodyMedium,
            color = currentDirection.color,
            textAlign = TextAlign.Center
        )
    }
}

private fun calculateDirection(offset: Offset, centerRadius: Float): DPadDirection {
    val centerX = centerRadius
    val centerY = centerRadius
    val dx = offset.x - centerX
    val dy = offset.y - centerY
    val distance = sqrt(dx * dx + dy * dy)
    val threshold = centerRadius * 0.2f

    if (distance < threshold) return DPadDirection.STOP

    val normalizedX = dx / distance
    val normalizedY = dy / distance

    val isForward = normalizedY < -0.3f
    val isBack = normalizedY > 0.3f
    val isLeft = normalizedX < -0.3f
    val isRight = normalizedX > 0.3f

    return when {
        isForward && isLeft -> DPadDirection.FORWARD_LEFT
        isForward && isRight -> DPadDirection.FORWARD_RIGHT
        isBack && isLeft -> DPadDirection.BACK_LEFT
        isBack && isRight -> DPadDirection.BACK_RIGHT
        isForward -> DPadDirection.FORWARD
        isBack -> DPadDirection.BACK
        isLeft -> DPadDirection.LEFT
        isRight -> DPadDirection.RIGHT
        else -> DPadDirection.STOP
    }
}
