# Maquete Truck - App Android Kotlin

Aplicativo Android nativo para controle remoto de um caminhão basculante 3D impresso via Bluetooth Classic (HC-05).

## Funcionalidades

- **Controle Remoto via Bluetooth** — Joystick 2D único com 8 direções + centro
- **Controle da Caçamba** — Botões para subir/descer a bascula
- **Iluminação** — Faróis (toggle) + Setas (esquerda/direita) + Pisca-alerta
- **Gravação de Movimentos** — REC/Play/Limpar para modo autônomo
- **Tema Escuro** — Design inspirado no Rover Control (Material 3)

## Arquitetura

```
┌─────────────────┐      Bluetooth RFCOMM      ┌──────────────┐
│  App Android    │◄──────────────────────────►│    HC-05     │
│  (Kotlin)       │      9600 baud              │  (Bluetooth) │
│                 │      Comandos \n            │              │
│  Joystick 2D ──►│  F, B, S, L, R, FL, FR...  │              │
│  Caçamba ──────►│  U, D, X                    │  Arduino     │
│  Luzes ────────►│  HH, TI, TO, TX, HA        │  (Firmware)  │
└─────────────────┘                             └──────────────┘
```

## Protocolo de Comandos

| Comando | Função | Descrição |
|---------|--------|-----------|
| `F` | Motor frente | Move o caminhão para frente |
| `B` | Motor ré | Move o caminhão para trás |
| `S` | Parar motor | Para o movimento (direção mantida) |
| `L` | Virar esquerda | Gira o volante para esquerda |
| `R` | Virar direita | Gira o volante para direita |
| `C` | Centro | Centraliza o volante |
| `SC` | Parada total | Para motor + centraliza direção (enviado ao soltar o joystick) |
| `FL` | Frente + Esq. | Movimento diagonal |
| `FR` | Frente + Dir. | Movimento diagonal |
| `BL` | Ré + Esq. | Movimento diagonal |
| `BR` | Ré + Dir. | Movimento diagonal |
| `U` | Caçamba subir | Levanta a bascula |
| `D` | Caçamba descer | Abaixa a bascula |
| `X` | Caçamba parar | Para o movimento da bascula |
| `HH` | Faróis | Liga/desliga faróis |
| `TI` | Seta esquerda | Acende seta esquerda |
| `TO` | Seta direita | Acende seta direita |
| `TX` | Parar setas | Desliga todas as setas |
| `HA` | Pisca-alerta | Liga/desliga pisca-alerta |

## Joystick 2D Único

O app usa um único joystick 2D (modo `JoystickAxis.BOTH`) que mapeia para **9 zonas discretas**:

| Zona | Comando | Descrição |
|------|---------|-----------|
| Centro | `S` | Para motor (direção mantida) |
| Cima | `F` | Frente |
| Baixo | `B` | Ré |
| Esquerda | `L` | Virar esquerda |
| Direita | `R` | Virar direita |
| Cima+Esq | `FL` | Frente + Esquerda |
| Cima+Dir | `FR` | Frente + Direita |
| Baixo+Esq | `BL` | Ré + Esquerda |
| Baixo+Dir | `BR` | Ré + Direita |

**Ao soltar o joystick** (ACTION_UP), o app envia sempre `SC` — parada total + centralização da direção. Deadzone de 0.35 em cada eixo.

## Estrutura do Projeto

```
app_kotlin/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        └── java/com/maquete/industrial/truck/
            ├── MainActivity.kt                    # Entry point (single-screen)
            ├── bluetooth/
            │   ├── TruckBluetoothService.kt       # Serviço BT RFCOMM + throttle (conflated channel)
            │   └── TruckCommand.kt                 # Enum com todas as strings de comando
            ├── data/
            │   └── TruckPrefs.kt                   # SharedPreferences (MAC, auto-reconnect)
            └── ui/
                ├── theme/
                │   ├── Color.kt                    # Paleta de cores
                │   ├── Type.kt                     # Tipografia
                │   └── Theme.kt                    # MaterialTheme escuro
                ├── components/
                │   ├── JoystickView.kt             # View de joystick 2D customizada (Canvas)
                │   ├── JoystickComposable.kt      # Wrapper Compose do JoystickView
                │   ├── DPadDirection.kt            # Enum de direções (9 zonas)
                │   └── DevicePickerDialog.kt       # Dialog seleção BT
                ├── screens/
                │   └── ControlScreen.kt           # Tela única (joystick + controles)
                ├── viewmodel/
                │   └── TruckViewModel.kt          # Estado da UI + lógica de comandos
                └── record/
                    └── Recorder.kt                # Gravação/playback de movimentos
```

## Stack Técnica

| Componente | Tecnologia |
|---|---|
| Linguagem | Kotlin 1.9.22 |
| UI | Jetpack Compose + Material 3 |
| ViewModel | ViewModel + mutableStateOf |
| Bluetooth | RFCOMM (BluetoothAdapter + BluetoothSocket) |
| Build | Gradle 8.4 + AGP 8.2.0 |
| Min SDK | 23 (Android 6.0) |
| Target SDK | 34 (Android 14) |

## Como Buildar

1. Abrir o Android Studio
2. File → Open → selecionar pasta `app_kotlin`
3. Aguardar Gradle sync
4. Build → Make Project
5. Conectar celular via USB
6. Run → Run 'app'

## Como Usar

1. **Parear o HC-05** nas configurações do Android (código PIN: 1234 ou 0000)
2. Abrir o app **Maquete Truck**
3. Tocar em **CONECTAR**
4. Selecionar o dispositivo **HC-05** na lista
5. Usar o **joystick 2D** para controlar direção e movimento
6. Usar os botões de **Caçamba** e **Iluminação**
7. **Soltar o joystick** = parada total + centralização (comando `SC`)
8. Botão **EMERGÊNCIA** = para tudo (motor, setas, faróis, pisca-alerta)

## Throttle

O app implementa throttle de **80ms** entre comandos via um `Channel.CONFLATED` com um único consumidor. O joystick view reporta valores a cada ~30ms, mas o VM só despacha quando a zona discreta muda (dedupe). Isto limita a taxa máxima a ~12 comandos/segundo no fio serial.

## Permissões

| Permissão | Motivo | API |
|---|---|---|
| `BLUETOOTH` | Conexão BT (≤ 30) | ≤ 30 |
| `BLUETOOTH_ADMIN` | Gerenciamento BT (≤ 30) | ≤ 30 |
| `ACCESS_FINE_LOCATION` | Discovery BT (≤ 30) | ≤ 30 |
| `BLUETOOTH_CONNECT` | Conexão BT runtime | 31+ |
| `BLUETOOTH_SCAN` | Scan de dispositivos (neverForLocation) | 31+ |

## Arquitetura do Projeto Maquete Industrial

```
┌─────────────┐     Socket.IO      ┌──────────────┐    Serial    ┌───────────┐
│  Dashboard  │◄──────────────────►│   Backend    │◄────────────►│  Gateway  │
│  (React)    │     REST API       │  (Node.js)   │              │  (RPI)    │
└─────────────┘                    └──────────────┘              └─────┬─────┘
                                                                        │ Serial
┌─────────────┐     Bluetooth     ┌──────────────┐              ┌────▼─────┐
│  App Kotlin │◄─────────────────►│    HC-05     │◄────────────►│  Arduino │
│  (direto)   │     RFCOMM        │  Bluetooth   │              │          │
└─────────────┘                    └──────────────┘              └──────────┘
```

**Nota:** HC-05 só permite 1 conexão BT por vez. App e Gateway não podem estar conectados ao mesmo tempo.
