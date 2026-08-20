package com.maquete.industrial.truck.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryGreen,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryGreenVariant,
    secondary = SecondaryBlue,
    onSecondary = OnSecondary,
    secondaryContainer = SecondaryBlueVariant,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkCard,
    onSurfaceVariant = TextDim,
    error = Error,
    onError = OnPrimary,
    outline = DarkBorder
)

@Composable
fun MaqueteTruckTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = MaqueteTypography,
        content = content
    )
}
