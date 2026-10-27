package com.maquete.industrial.ferrorama.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val FerroramaColorScheme = darkColorScheme(
    primary = FeroGlow,
    onPrimary = FeroOnPrimary,
    primaryContainer = FeroGlow,
    onPrimaryContainer = FeroOnPrimary,
    secondary = FeroLoco,
    onSecondary = FeroOnPrimary,
    secondaryContainer = FeroLoco,
    onSecondaryContainer = FeroOnPrimary,
    background = FeroBackground,
    onBackground = FeroText,
    surface = FeroSurface,
    onSurface = FeroText,
    surfaceVariant = FeroCard,
    onSurfaceVariant = FeroTextDim,
    error = StatusOffline,
    onError = FeroOnPrimary,
    outline = FeroBorder
)

@Composable
fun FerroramaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = FerroramaColorScheme,
        typography = FerroramaTypography,
        content = content
    )
}