# App React Native - Controle RC Bluetooth

Aplicativo mobile para controle remoto do caminhão basculante via Bluetooth (HC-05).

## Stack

- Expo SDK 49
- React Native 0.72
- react-native-bluetooth-classic (conexão BT direta)
- react-native-gesture-handler (DPad com gestos)

## Estrutura

```
app_react_native/
├── App.js                          # Entry point
├── app.json                        # Configuração Expo
├── eas.json                        # Configuração EAS Build
├── src/
│   ├── bluetooth/
│   │   ├── BluetoothProvider.jsx   # Context de Bluetooth (conexão, envio)
│   │   └── useBluetooth.js        # Hook para acessar o context
│   ├── components/
│   │   ├── DPad.jsx                # Controle direcional com gestos
│   │   ├── BucketControls.jsx      # Botões subir/descer caçamba
│   │   ├── LightingControls.jsx    # Faróis e setas
│   │   ├── CommandMonitor.jsx      # Exibe último comando enviado
│   │   ├── DevicePickerModal.jsx   # Modal de seleção de dispositivo BT
│   │   └── Header.jsx             # Header com status de conexão
│   ├── screens/
│   │   └── ControlScreen.jsx       # Tela principal de controle
│   ├── constants/
│   │   └── theme.js                # Paleta de cores e constantes
│   └── protocol/
│       └── commands.js             # Mapeamento de comandos e encoding
└── package.json
```

## Como Rodar

### Pré-requisitos
- Android Studio (para build local)
- Celular com depuração USB ativada
- HC-05 pareado no celular

### Build e instalação

```bash
npm install
npx expo prebuild --clean    # Gera pasta android/
npx expo run:android          # Compila e instala no celular
```

### Para cada novo build após mudanças no código JS:

```bash
npx expo run:android          # Hot reload automático
```

### Para mudanças nativas (permissões, plugins):

```bash
npx expo prebuild --clean
npx expo run:android
```

## Comandos

### Movimentação (DPad com gestos)

O DPad usa PanResponder para detectar arrastos. Comandos são enviados durante o gesto e `SC` (parada total) ao soltar.

| Gesto | Comando | Ação |
|-------|---------|------|
| Arrastar para cima | `F` | Frente |
| Arrastar para baixo | `B` | Ré |
| Arrastar para esquerda | `L` | Esquerda |
| Arrastar para direita | `R` | Direita |
| Cima + esquerda | `FL` | Frente + Esquerda |
| Cima + direita | `FR` | Frente + Direita |
| Baixo + esquerda | `BL` | Ré + Esquerda |
| Baixo + direita | `BR` | Ré + Direita |
| Soltar | `SC` | Parar motor + centro |

### Caçamba

| Botão | Comando | Ação |
|-------|---------|------|
| ▲ SUBIR | `U` | Levantar caçamba (0° → 90°) |
| ▼ DESCER | `D` | Abaixar caçamba (90° → 0°) |
| Soltar | `X` | Parar caçamba |

### Iluminação

| Botão | Comando | Ação |
|-------|---------|------|
| FARÓIS | `HH` | Toggle faróis (ligar/desligar) |
| ◀ | `TI` | Seta esquerda ligar |
| ■ | `TX` | Desligar setas |
| ▶ | `TO` | Seta direita ligar |

## Throttle (Controle de Fluxo)

Para evitar overflow do buffer serial do Arduino (64 bytes), o app implementa throttle em duas camadas:

1. **DPad**: 100ms entre comandos do mesmo tipo
2. **BluetoothProvider**: 80ms entre envios

Isso garante que o Arduino processe cada comando antes de receber o próximo.

## Pinagem Arduino

| Componente | Pino | Função |
|------------|------|--------|
| Servo Direção | D5 | 45°-135° |
| Servo Caçamba | D6 | 0°-90° |
| Servo Motor | D7 | Rotação contínua (0°=ré, 90°=parado, 180°=frente) |
| Farol Esquerdo | D2 | LED |
| Farol Direito | D3 | LED |
| Seta Esquerda | D8 | LED |
| Seta Direita | D9 | LED |
| HC-05 TX→RX | 0/1 | Serial padrão 9600 baud |

**Importante**: Desconecte o HC-05 dos pinos 0/1 ao carregar o sketch via Arduino IDE.

## Paleta de Cores

| Variável | Cor | Uso |
|----------|-----|-----|
| `C.bg` | `#0D0F14` | Fundo |
| `C.surface` | `#161B26` | Superfícies |
| `C.card` | `#1C2333` | Cards |
| `C.glow` | `#00FFB2` | Destaques |
| `C.fwd` | `#00FFB2` | Botão frente |
| `C.rev` | `#FF4560` | Botão ré |
| `C.left` | `#FFB800` | Botão esquerda |
| `C.right` | `#3D9EFF` | Botão direita |
| `C.stop` | `#FF2D55` | Botão stop |
| `C.bucket` | `#A855F7` | Controle caçamba |

## Diagnóstico

Para verificar se os comandos estão chegando ao Arduino:

1. Conecte o Arduino ao PC via USB
2. Abra o Serial Monitor (Arduino IDE) a 9600 baud
3. Envie comandos pelo app
4. Deve aparecer: `RX: <comando>` e `ACK|TRUCK|<comando>|OK`
