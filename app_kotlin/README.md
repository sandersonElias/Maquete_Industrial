# Maquete Truck - App Android Kotlin

Aplicativo Android nativo para controle remoto de um caminhão basculante 3D impresso via Bluetooth Classic (HC-05).

## Funcionalidades

- **Controle Remoto via Bluetooth** — D-Pad gestual com 8 direções + parada de emergência
- **Controle da Caçamba** — Botões para subir/descer a bascula
- **Iluminação** — Faróis (toggle) + Setas (esquerda/direita/parar)
- **4 Telas** — Controle, Dashboard, Histórico, Configurações
- **Tema Escuro** — Design inspirado no Rover Control (Material 3)

## Arquitetura

```
┌─────────────────┐      Bluetooth RFCOMM      ┌──────────────┐
│  App Android    │◄──────────────────────────►│    HC-05     │
│  (Kotlin)       │      9600 baud              │  (Bluetooth) │
│                 │      Comandos \n            │              │
│  D-Pad ────────►│  F, B, S, L, R, FL, FR...  │              │
│  Caçamba ──────►│  U, D, X                    │  Arduino     │
│  Luzes ────────►│  HH, TI, TO, TX            │  (Firmware)  │
└─────────────────┘                             └──────────────┘
```

## Protocolo de Comandos

| Comando | Função | Descrição |
|---------|--------|-----------|
| `F` | Motor frente | Move o caminhão para frente |
| `B` | Motor ré | Move o caminhão para trás |
| `S` | Parar motor | Para o movimento |
| `L` | Virar esquerda | Gira o volante para esquerda |
| `R` | Virar direita | Gira o volante para direita |
| `C` | Centro | Centraliza o volante |
| `SC` | Parada emergência | Para tudo + centraliza |
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
| `HA` | Alerta | Pisca-alerta |

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
            ├── MainActivity.kt                    # Entry point + Navigation
            ├── bluetooth/
            │   └── TruckBluetoothService.kt       # Serviço BT RFCOMM + throttle
            └── ui/
                ├── theme/
                │   ├── Color.kt                   # Paleta de cores
                │   ├── Type.kt                    # Tipografia
                │   └── Theme.kt                   # MaterialTheme escuro
                ├── navigation/
                │   └── AppNavigation.kt           # Bottom nav items
                ├── components/
                │   ├── DPad.kt                    # D-Pad gestual (Canvas)
                │   ├── Header.kt                  # Barra + status BT
                │   ├── ControlCard.kt             # Card padrão
                │   └── DevicePickerDialog.kt      # Dialog seleção BT
                ├── screens/
                │   ├── ControlScreen.kt           # Tela principal
                │   ├── DashboardScreen.kt         # Dados/mock
                │   ├── HistoryScreen.kt           # Histórico/mock
                │   └── SettingsScreen.kt          # Configurações
                └── viewmodel/
                    └── TruckViewModel.kt          # Estado da UI
```

## Stack Técnica

| Componente | Tecnologia |
|---|---|
| Linguagem | Kotlin 1.9.22 |
| UI | Jetpack Compose + Material 3 |
| Navegação | Navigation Compose |
| ViewModel | ViewModel + StateFlow |
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
5. Usar o **D-Pad** para controlar a direção
6. Usar os botões de **Caçamba** e **Iluminação**

## Throttle

O app implementa throttle de **80ms** entre comandos para evitar overflow do buffer serial do Arduino (64 bytes). Isso limita a taxa máxima a ~12 comandos/segundo.

## Permissões

| Permissão | Motivo |
|---|---|
| `BLUETOOTH` | Conexão BT (Android < 12) |
| `BLUETOOTH_ADMIN` | Gerenciamento BT |
| `BLUETOOTH_CONNECT` | Conexão BT (Android 12+) |
| `BLUETOOTH_SCAN` | Scan de dispositivos (Android 12+) |
| `ACCESS_FINE_LOCATION` | Discovery BT (Android < 12) |

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

## Diferenças do App React Native

| Aspecto | React Native (antigo) | Kotlin (novo) |
|---|---|---|
| Framework | Expo / React Native 0.72 | Jetpack Compose |
| Performance | Bridge JS → Native | Nativo direto |
| UI | Componentes RN | Compose Canvas + Material 3 |
| D-Pad | PanResponder | detectDragGestures |
| Throttle | 80ms + 100ms (duplo) | 80ms (simplificado) |
| Telas | 1 tela | 4 telas (navegação) |
| Tema | Inline styles | MaterialTheme + Color.kt |

## Próximos Passos

- [ ] Testar no celular com Arduino real
- [ ] Ajustar sensibilidade do D-Pad
- [ ] Implementar Dashboard com dados reais
- [ ] Adicionar integração com REST API (opcional)
- [ ] Adicionar gravação de movimentos (como Rover Control)
