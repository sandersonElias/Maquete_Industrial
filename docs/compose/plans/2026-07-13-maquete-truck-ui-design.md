# Maquete Truck - Design das Telas (Jetpack Compose)

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as 4 telas do app de controle do caminhão basculante com Jetpack Compose, seguindo o design system do Rover Control (tema escuro, Material Components, cards arredondados).

**Architecture:** App Android Kotlin com Jetpack Compose, Navigation Compose para navegação entre telas, bottom navigation bar, e tema escuro baseado no Rover Control.

**Tech Stack:** Kotlin, Jetpack Compose, Material 3, Navigation Compose, Coroutines

## Global Constraints

- **Idioma:** Português (Brazilian) em todas as UI strings
- **Orientação:** Landscape (todas as activities)
- **Min SDK:** 23 (Android 6.0)
- **Target SDK:** 34 (Android 14)
- **Tema:** Escuro inspirado no Rover Control (#0D1117 fundo, #3FB950 verde principal)
- **Pacote:** `com.maquete.industrial.truck`

---

## File Structure

```
app/src/main/java/com/maquete/industrial/truck/
├── MainActivity.kt                    # Entry point + Navigation Host
├── ui/
│   ├── theme/
│   │   ├── Color.kt                   # Cores do tema
│   │   ├── Theme.kt                   # MaterialTheme escuro
│   │   └── Type.kt                    # Tipografia
│   ├── navigation/
│   │   └── AppNavigation.kt           # NavHost + BottomBar
│   ├── components/
│   │   ├── DPad.kt                    # D-Pad gestual (Canvas)
│   │   ├── Header.kt                  # Barra superior com status BT
│   │   ├── ControlCard.kt             # Card padrão para seções
│   │   └── DevicePickerDialog.kt      # Dialog de seleção BT
│   ├── screens/
│   │   ├── ControlScreen.kt           # Tela de controle (D-Pad, Caçamba, Luzes)
│   │   ├── DashboardScreen.kt         # Tela de dashboard (gráficos mockados)
│   │   ├── HistoryScreen.kt           # Tela de histórico (lista mockada)
│   │   └── SettingsScreen.kt          # Tela de configurações
│   └── viewmodel/
│       └── TruckViewModel.kt          # ViewModel com estado da UI
```

---

## Task 1: Scaffold do Projeto Android com Compose

**Covers:** Setup inicial

**Files:**
- Create: Projeto Android Studio com Kotlin + Compose

**Steps:**

- [ ] **Step 1:** Criar novo projeto Android Studio:
  - Name: `MaqueteTruck`
  - Package: `com.maquete.industrial.truck`
  - Language: Kotlin
  - Build system: Gradle (Kotlin DSL)
  - Minimum SDK: API 23
  - Use Jetpack Compose: YES

- [ ] **Step 2:** Adicionar dependências em `build.gradle.kts` (app):
```kotlin
dependencies {
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.7")
    
    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    
    // Activity Compose
    implementation("androidx.activity:activity-compose:1.8.2")
    
    // Core KTX
    implementation("androidx.core:core-ktx:1.12.0")
}
```

- [ ] **Step 3:** Configurar `AndroidManifest.xml`:
```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:screenOrientation="landscape"
    android:theme="@style/Theme.MaqueteTruck">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

- [ ] **Step 4:** Criar tema básico em `ui/theme/Theme.kt`:
```kotlin
@Composable
fun MaqueteTruckTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(),
        content = content
    )
}
```

- [ ] **Step 5:** Criar `MainActivity.kt` com setContent:
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaqueteTruckTheme {
                Text("Maquete Truck")
            }
        }
    }
}
```

- [ ] **Step 6:** Build e verificar que compila

---

## Task 2: Theme System (Cores, Tipografia, Tema)

**Covers:** Design system Rover Control

**Files:**
- Create: `ui/theme/Color.kt`
- Create: `ui/theme/Type.kt`
- Modify: `ui/theme/Theme.kt`

**Interfaces:**
- Produces: `MaqueteColors` (objeto com todas as cores), `MaqueteTypography`, `MaqueteTruckTheme`

**Steps:**

- [ ] **Step 1:** Criar `ui/theme/Color.kt`:
```kotlin
package com.maquete.industrial.truck.ui.theme

import androidx.compose.ui.graphics.Color

// Rover Control inspired dark theme
val DarkBackground = Color(0xFF0D1117)
val DarkSurface = Color(0xFF161B22)
val DarkCard = Color(0xFF1C2333)
val DarkBorder = Color(0xFF252D40)

// Primary (Green)
val PrimaryGreen = Color(0xFF3FB950)
val PrimaryGreenVariant = Color(0xFF2EA043)
val OnPrimary = Color(0xFFFFFFFF)

// Secondary (Blue)
val SecondaryBlue = Color(0xFF58A6FF)
val SecondaryBlueVariant = Color(0xFF388BFD)
val OnSecondary = Color(0xFFFFFFFF)

// Status colors
val Connected = Color(0xFF3FB950)
val Disconnected = Color(0xFFFF4560)
val Warning = Color(0xFFD29922)
val Error = Color(0xFFFF4560)

// Control colors (from RN app)
val DirectionForward = Color(0xFF3FB950)
val DirectionBack = Color(0xFFFF4560)
val DirectionLeft = Color(0xFFFFB800)
val DirectionRight = Color(0xFF3D9EFF)
val StopRed = Color(0xFFFF2D55)

// Feature colors
val BucketPurple = Color(0xFFA855F7)
val HeadlightGold = Color(0xFFFFD700)
val TurnSignalOrange = Color(0xFFFF8C00)

// Text
val TextPrimary = Color(0xFFE8EEF8)
val TextDim = Color(0xFF4A5568)
```

- [ ] **Step 2:** Criar `ui/theme/Type.kt`:
```kotlin
package com.maquete.industrial.truck.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val MaqueteTypography = Typography(
    headlineLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        color = TextPrimary
    ),
    headlineMedium = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        color = TextPrimary
    ),
    titleMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        color = TextPrimary
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        color = TextPrimary
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        color = TextDim
    )
)
```

- [ ] **Step 3:** Atualizar `ui/theme/Theme.kt`:
```kotlin
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
```

- [ ] **Step 4:** Verificar que o tema compila

---

## Task 3: Navegação + Bottom Navigation Bar

**Covers:** Estrutura de navegação

**Files:**
- Create: `ui/navigation/AppNavigation.kt`
- Modify: `MainActivity.kt`

**Interfaces:**
- Produces: `MaqueteNavHost`, `BottomNavItem`

**Steps:**

- [ ] **Step 1:** Criar `ui/navigation/AppNavigation.kt`:
```kotlin
package com.maquete.industrial.truck.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Gamepad
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Control : BottomNavItem("control", "Controle", Icons.Default.Gamepad)
    object Dashboard : BottomNavItem("dashboard", "Dashboard", Icons.Default.Dashboard)
    object History : BottomNavItem("history", "Histórico", Icons.Default.History)
    object Settings : BottomNavItem("settings", "Config", Icons.Default.Settings)
}

val bottomNavItems = listOf(
    BottomNavItem.Control,
    BottomNavItem.Dashboard,
    BottomNavItem.History,
    BottomNavItem.Settings
)
```

- [ ] **Step 2:** Atualizar `MainActivity.kt` com Navigation:
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaqueteTruckTheme {
                val navController = rememberNavController()
                
                Scaffold(
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface
                        ) {
                            val navBackStackEntry by navController.currentBackStackEntryAsState()
                            val currentRoute = navBackStackEntry?.destination?.route
                            
                            bottomNavItems.forEach { item ->
                                NavigationBarItem(
                                    icon = { Icon(item.icon, contentDescription = item.title) },
                                    label = { Text(item.title) },
                                    selected = currentRoute == item.route,
                                    onClick = {
                                        navController.navigate(item.route) {
                                            popUpTo(navController.graph.findStartDestination().id) {
                                                saveState = true
                                            }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                )
                            }
                        }
                    }
                ) { paddingValues ->
                    MaqueteNavHost(
                        navController = navController,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
            }
        }
    }
}

@Composable
fun MaqueteNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = BottomNavItem.Control.route,
        modifier = modifier
    ) {
        composable(BottomNavItem.Control.route) { ControlScreen() }
        composable(BottomNavItem.Dashboard.route) { DashboardScreen() }
        composable(BottomNavItem.History.route) { HistoryScreen() }
        composable(BottomNavItem.Settings.route) { SettingsScreen() }
    }
}
```

- [ ] **Step 3:** Criar telas placeholder:
```kotlin
// ControlScreen.kt
@Composable
fun ControlScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Controle")
    }
}

// DashboardScreen.kt
@Composable
fun DashboardScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Dashboard")
    }
}

// HistoryScreen.kt
@Composable
fun HistoryScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Histórico")
    }
}

// SettingsScreen.kt
@Composable
fun SettingsScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Configurações")
    }
}
```

- [ ] **Step 4:** Build e verificar navegação funciona

---

## Task 4: Componentes Reutilizáveis (Header, ControlCard, DevicePickerDialog)

**Covers:** Design system components

**Files:**
- Create: `ui/components/Header.kt`
- Create: `ui/components/ControlCard.kt`
- Create: `ui/components/DevicePickerDialog.kt`

**Interfaces:**
- Produces: `Header`, `ControlCard`, `DevicePickerDialog`

**Steps:**

- [ ] **Step 1:** Criar `ui/components/Header.kt`:
```kotlin
package com.maquete.industrial.truck.ui.components

@Composable
fun Header(
    isConnected: Boolean,
    deviceName: String?,
    onConnectClick: () -> Unit,
    onDisconnectClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // App title
        Text(
            text = buildAnnotatedString {
                append("MAQUETE ")
                withStyle(SpanStyle(color = MaterialTheme.colorScheme.primary)) {
                    append("RC")
                }
            },
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.weight(1f)
        )
        
        // Connection button
        if (isConnected) {
            OutlinedButton(
                onClick = onDisconnectClick,
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = Connected.copy(alpha = 0.1f),
                    contentColor = Connected
                ),
                border = BorderStroke(1.dp, Connected)
            ) {
                Icon(
                    Icons.Default.BluetoothConnected,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(deviceName ?: "HC-05")
            }
        } else {
            Button(
                onClick = onConnectClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(
                    Icons.Default.Bluetooth,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("CONECTAR")
            }
        }
    }
}
```

- [ ] **Step 2:** Criar `ui/components/ControlCard.kt`:
```kotlin
package com.maquete.industrial.truck.ui.components

@Composable
fun ControlCard(
    title: String,
    modifier: Modifier = Modifier,
    accentColor: Color = MaterialTheme.colorScheme.primary,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        border = BorderStroke(1.dp, DarkBorder),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = accentColor,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            content()
        }
    }
}
```

- [ ] **Step 3:** Criar `ui/components/DevicePickerDialog.kt`:
```kotlin
package com.maquete.industrial.truck.ui.components

data class BluetoothDevice(
    val name: String,
    val address: String
)

@Composable
fun DevicePickerDialog(
    devices: List<BluetoothDevice>,
    onSelect: (BluetoothDevice) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        title = {
            Text(
                text = "Bluetooth",
                color = TextPrimary
            )
        },
        text = {
            Column {
                Text(
                    text = "Selecione o HC-05 pareado",
                    color = TextDim,
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(12.dp))
                
                LazyColumn {
                    items(devices) { device ->
                        ListItem(
                            headlineContent = { Text(device.name) },
                            supportingContent = { Text(device.address) },
                            leadingContent = {
                                Icon(
                                    Icons.Default.Bluetooth,
                                    contentDescription = null,
                                    tint = PrimaryGreen
                                )
                            },
                            modifier = Modifier
                                .clickable { onSelect(device) }
                                .padding(vertical = 4.dp)
                        )
                        HorizontalDivider(color = DarkBorder)
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Error)
            }
        }
    )
}
```

- [ ] **Step 4:** Verificar que os componentes compilam

---

## Task 5: D-Pad Component (Canvas Customizado)

**Covers:** Componente principal de controle

**Files:**
- Create: `ui/components/DPad.kt`

**Interfaces:**
- Produces: `DPad` com callback `onDirectionChange(direction: String)`

**Steps:**

- [ ] **Step 1:** Criar `ui/components/DPad.kt`:
```kotlin
package com.maquete.industrial.truck.ui.components

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
    size: Dp = 180.dp
) {
    var currentDirection by remember { mutableStateOf(DPadDirection.STOP) }
    
    Canvas(
        modifier = modifier
            .size(size)
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { offset ->
                        // Calculate direction from center
                    },
                    onDrag = { change, dragAmount ->
                        // Update direction based on drag
                    },
                    onDragEnd = {
                        currentDirection = DPadDirection.STOP
                        onDirectionChange(DPadDirection.STOP)
                    }
                )
            }
    ) {
        val centerX = size.width / 2
        val centerY = size.height / 2
        val radius = size.width / 2
        
        // Draw base circle
        drawCircle(
            color = DarkCard,
            radius = radius,
            center = Offset(centerX, centerY)
        )
        
        // Draw border
        drawCircle(
            color = DarkBorder,
            radius = radius,
            center = Offset(centerX, centerY),
            style = Stroke(width = 2.dp.toPx())
        )
        
        // Draw direction zones
        // ... (forward, back, left, right zones with colors)
        
        // Draw center dot
        drawCircle(
            color = currentDirection.color,
            radius = 8.dp.toPx(),
            center = Offset(centerX, centerY)
        )
        
        // Draw direction label
        // ...
    }
    
    // Direction label below DPad
    Text(
        text = currentDirection.label,
        style = MaterialTheme.typography.bodyMedium,
        color = currentDirection.color
    )
}
```

- [ ] **Step 2:** Implementar lógica de gesto completa com threshold

- [ ] **Step 3:** Testar DPad visualmente

---

## Task 6: Tela de Controle (ControlScreen)

**Covers:** Tela principal

**Files:**
- Modify: `ui/screens/ControlScreen.kt`

**Interfaces:**
- Consumes: `Header`, `ControlCard`, `DPad`, `DevicePickerDialog`
- Produces: `ControlScreen` completa

**Steps:**

- [ ] **Step 1:** Implementar `ControlScreen.kt`:
```kotlin
@Composable
fun ControlScreen(
    viewModel: TruckViewModel = viewModel()
) {
    var showDevicePicker by remember { mutableStateOf(false) }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Header
        Header(
            isConnected = viewModel.isConnected,
            deviceName = viewModel.deviceName,
            onConnectClick = { viewModel.listPairedDevices() },
            onDisconnectClick = { viewModel.disconnect() }
        )
        
        // Main content
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Left: DPad
            ControlCard(
                title = "MOVIMENTO",
                modifier = Modifier.weight(1f)
            ) {
                DPad(
                    onDirectionChange = { dir ->
                        viewModel.sendDirection(dir)
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
            
            // Center: Bucket + Lighting
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Bucket controls
                ControlCard(
                    title = "CAÇAMBA",
                    accentColor = BucketPurple
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { viewModel.bucketUp() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BucketPurple
                            )
                        ) {
                            Text("▲ SUBIR")
                        }
                        Button(
                            onClick = { viewModel.bucketDown() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BucketPurple
                            )
                        ) {
                            Text("▼ DESCER")
                        }
                    }
                    Text(
                        text = viewModel.bucketState,
                        color = TextDim
                    )
                }
                
                // Lighting controls
                ControlCard(
                    title = "ILUMINAÇÃO",
                    accentColor = HeadlightGold
                ) {
                    // Headlights toggle
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = viewModel.headlightsOn,
                            onClick = { viewModel.toggleHeadlights() },
                            label = { Text("💡 FARÓIS") },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = HeadlightGold.copy(alpha = 0.2f),
                                selectedLabelColor = HeadlightGold
                            )
                        )
                    }
                    
                    // Turn signals
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        IconButton(onClick = { viewModel.turnLeft() }) {
                            Icon(Icons.Default.ChevronLeft, "Seta Esquerda")
                        }
                        IconButton(onClick = { viewModel.turnOff() }) {
                            Icon(Icons.Default.Stop, "Parar Setas")
                        }
                        IconButton(onClick = { viewModel.turnRight() }) {
                            Icon(Icons.Default.ChevronRight, "Seta Direita")
                        }
                    }
                }
            }
            
            // Right: Command monitor + Emergency stop
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ControlCard(title = "COMANDO") {
                    Text(
                        text = "CMD: ${viewModel.lastCommand}",
                        color = PrimaryGreen,
                        fontFamily = FontFamily.Monospace
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                Button(
                    onClick = { viewModel.emergencyStop() },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Error
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                ) {
                    Text(
                        text = "⏹ PARADA DE EMERGÊNCIA",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
    
    // Device picker dialog
    if (showDevicePicker) {
        DevicePickerDialog(
            devices = viewModel.pairedDevices,
            onSelect = { device ->
                viewModel.connectTo(device)
                showDevicePicker = false
            },
            onDismiss = { showDevicePicker = false }
        )
    }
}
```

- [ ] **Step 2:** Verificar que a tela renderiza corretamente

---

## Task 7: Tela de Dashboard (DashboardScreen)

**Covers:** Dashboard com dados mockados

**Files:**
- Modify: `ui/screens/DashboardScreen.kt`

**Steps:**

- [ ] **Step 1:** Implementar `DashboardScreen.kt` com dados mockados:
```kotlin
@Composable
fun DashboardScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "DASHBOARD",
            style = MaterialTheme.typography.headlineMedium
        )
        
        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Status cards
            Column(modifier = Modifier.weight(1f)) {
                StatusCard("Status", "Conectado", Connected)
                StatusCard("Bateria", "85%", PrimaryGreen)
                StatusCard("Sinal", "Forte", SecondaryBlue)
            }
            
            // Chart area
            ControlCard(
                title = "VELOCIDADE",
                modifier = Modifier.weight(2f)
            ) {
                // Placeholder chart
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .background(DarkCard)
                ) {
                    Text(
                        text = "Gráfico de Velocidade",
                        modifier = Modifier.align(Alignment.Center),
                        color = TextDim
                    )
                }
            }
        }
    }
}

@Composable
fun StatusCard(label: String, value: String, color: Color) {
    ControlCard(title = label, accentColor = color) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineMedium,
            color = color
        )
    }
}
```

- [ ] **Step 2:** Verificar que a tela renderiza

---

## Task 8: Tela de Histórico (HistoryScreen)

**Covers:** Lista de viagens mockada

**Files:**
- Modify: `ui/screens/HistoryScreen.kt`

**Steps:**

- [ ] **Step 1:** Implementar `HistoryScreen.kt`:
```kotlin
data class Trip(
    val id: Int,
    val date: String,
    val duration: String,
    val distance: String
)

@Composable
fun HistoryScreen() {
    val trips = listOf(
        Trip(1, "12/07/2026 14:30", "15 min", "2.3 km"),
        Trip(2, "12/07/2026 10:15", "22 min", "3.1 km"),
        Trip(3, "11/07/2026 16:45", "18 min", "2.8 km"),
    )
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "HISTÓRICO DE VIAGENS",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(trips) { trip ->
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = DarkCard
                    ),
                    border = BorderStroke(1.dp, DarkBorder),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = trip.date,
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                text = "Duração: ${trip.duration}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextDim
                            )
                        }
                        Text(
                            text = trip.distance,
                            style = MaterialTheme.typography.headlineSmall,
                            color = PrimaryGreen
                        )
                    }
                }
            }
        }
    }
}
```

- [ ] **Step 2:** Verificar que a tela renderiza

---

## Task 9: Tela de Configurações (SettingsScreen)

**Covers:** Configurações do app

**Files:**
- Modify: `ui/screens/SettingsScreen.kt`

**Steps:**

- [ ] **Step 1:** Implementar `SettingsScreen.kt`:
```kotlin
@Composable
fun SettingsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "CONFIGURAÇÕES",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        LazyColumn {
            item {
                SettingsSection("Bluetooth") {
                    SettingsItem(
                        title = "Dispositivo Pareado",
                        subtitle = "HC-05",
                        icon = Icons.Default.Bluetooth
                    )
                    SettingsItem(
                        title = "Velocidade de Conexão",
                        subtitle = "9600 baud",
                        icon = Icons.Default.Speed
                    )
                }
            }
            
            item {
                SettingsSection("Controle") {
                    SettingsItem(
                        title = "Sensibilidade do D-Pad",
                        subtitle = "Média",
                        icon = Icons.Default.Tune
                    )
                    SettingsItem(
                        title = "Throttle (ms)",
                        subtitle = "80",
                        icon = Icons.Default.Timer
                    )
                }
            }
            
            item {
                SettingsSection("Sobre") {
                    SettingsItem(
                        title = "Versão",
                        subtitle = "1.0.0",
                        icon = Icons.Default.Info
                    )
                    SettingsItem(
                        title = "Desenvolvido por",
                        subtitle = "Maquete Industrial",
                        icon = Icons.Default.Person
                    )
                }
            }
        }
    }
}

@Composable
fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = PrimaryGreen,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Card(
            colors = CardDefaults.cardColors(
                containerColor = DarkCard
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column {
                content()
            }
        }
    }
}

@Composable
fun SettingsItem(
    title: String,
    subtitle: String,
    icon: ImageVector
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = TextDim,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = TextDim
            )
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = TextDim
        )
    }
    HorizontalDivider(color = DarkBorder)
}
```

- [ ] **Step 2:** Verificar que a tela renderiza

---

## Task 10: ViewModel Mockado para UI

**Covers:** Estado da UI para teste visual

**Files:**
- Create: `ui/viewmodel/TruckViewModel.kt`

**Steps:**

- [ ] **Step 1:** Criar `TruckViewModel.kt` com dados mockados:
```kotlin
package com.maquete.industrial.truck.ui.viewmodel

import androidx.lifecycle.ViewModel
import com.maquete.industrial.truck.ui.components.BluetoothDevice
import com.maquete.industrial.truck.ui.components.DPadDirection
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class TruckViewModel : ViewModel() {
    // Connection state
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected
    
    private val _deviceName = MutableStateFlow<String?>(null)
    val deviceName: StateFlow<String?> = _deviceName
    
    private val _pairedDevices = MutableStateFlow<List<BluetoothDevice>>(emptyList())
    val pairedDevices: StateFlow<List<BluetoothDevice>> = _pairedDevices
    
    // Command state
    private val _lastCommand = MutableStateFlow("--")
    val lastCommand: StateFlow<String> = _lastCommand
    
    // Control state
    private val _bucketState = MutableStateFlow("PARADO")
    val bucketState: StateFlow<String> = _bucketState
    
    private val _headlightsOn = MutableStateFlow(false)
    val headlightsOn: StateFlow<Boolean> = _headlightsOn
    
    // Mock functions (replace with real BT implementation)
    fun listPairedDevices() {
        // Mock
        _pairedDevices.value = listOf(
            BluetoothDevice("HC-05", "00:11:22:33:44:55")
        )
    }
    
    fun connectTo(device: BluetoothDevice) {
        _deviceName.value = device.name
        _isConnected.value = true
    }
    
    fun disconnect() {
        _isConnected.value = false
        _deviceName.value = null
    }
    
    fun sendDirection(direction: DPadDirection) {
        val cmd = when (direction) {
            DPadDirection.FORWARD -> "F"
            DPadDirection.BACK -> "B"
            DPadDirection.LEFT -> "L"
            DPadDirection.RIGHT -> "R"
            DPadDirection.FORWARD_LEFT -> "FL"
            DPadDirection.FORWARD_RIGHT -> "FR"
            DPadDirection.BACK_LEFT -> "BL"
            DPadDirection.BACK_RIGHT -> "BR"
            DPadDirection.STOP -> "SC"
        }
        _lastCommand.value = cmd
    }
    
    fun bucketUp() {
        _bucketState.value = "SUBINDO"
        _lastCommand.value = "U"
    }
    
    fun bucketDown() {
        _bucketState.value = "DESCENDO"
        _lastCommand.value = "D"
    }
    
    fun toggleHeadlights() {
        _headlightsOn.value = !_headlightsOn.value
        _lastCommand.value = "HH"
    }
    
    fun turnLeft() {
        _lastCommand.value = "TI"
    }
    
    fun turnRight() {
        _lastCommand.value = "TO"
    }
    
    fun turnOff() {
        _lastCommand.value = "TX"
    }
    
    fun emergencyStop() {
        _lastCommand.value = "SC"
        _bucketState.value = "PARADO"
    }
}
```

- [ ] **Step 2:** Atualizar `ControlScreen.kt` para usar o ViewModel com StateFlow

- [ ] **Step 3:** Build final e verificação visual

---

## Verification

Após implementar todas as tasks:

1. Build do projeto deve compilar sem erros
2. Todas as 4 telas devem ser acessíveis pela bottom navigation
3. Tema escuro deve ser consistente em todas as telas
4. D-Pad deve responder a gestos (mesmo sem BT real)
5. Botões devem atualizar o estado visual
6. Layout deve funcionar em landscape
