# Firmware Arduino - Ferrovia

Controle de 4 switches de ferrovia via Bluetooth (HC-05) com movimentação suave de servos SG90.

## Hardware

- Arduino Uno/Nano
- 4x Servos SG90
- 1x Módulo Bluetooth HC-05
- Fonte externa 5V para servos

## Pinagem

| Componente | Pino Arduino | Observação |
|------------|-------------|------------|
| Servo Switch 1 | D3 | |
| Servo Switch 2 | D5 | |
| Servo Switch 3 | D6 | |
| Servo Switch 4 | D9 | |
| HC-05 TX → RX | D10 | SoftwareSerial RX |
| HC-05 RX ← TX | D11 | SoftwareSerial TX |
| GND comum | GND | Arduino + servos + HC-05 |
| VCC Servos | 5V externa | NÃO usar do Arduino (muita corrente) |
| VCC HC-05 | 5V | Pode usar do Arduino |

**Importante**: Desconecte os pinos RX/TX do HC-05 ao carregar o sketch via USB.

## Configuração

Constantes no início do sketch:

```cpp
const int BT_RX = 10;              // HC-05 TX → Arduino RX
const int BT_TX = 11;              // HC-05 RX ← Arduino TX
const int NUM_SWITCHES = 4;
const int SERVO_PINS[] = {3, 5, 6, 9};
const int BAUD_BT = 9600;          // Baud rate do HC-05
const int BAUD_DEBUG = 9600;       // Serial monitor
const unsigned long HEARTBEAT_INTERVAL = 5000; // 5 segundos
const int ANGLE_LEFT = 0;
const int ANGLE_RIGHT = 180;
const int ANGLE_CENTER = 90;
const int MOVE_DELAY = 15;         // ms entre passos do servo
```

## Protocolo de Comandos

### Recebido (via Bluetooth Serial)

```
CMD|SWITCH|<id>|SET|LEFT       # Switch para esquerda (0°)
CMD|SWITCH|<id>|SET|RIGHT      # Switch para direita (180°)
CMD|SWITCH|<id>|SET|CENTER     # Switch para centro (90°)
CMD|SWITCH|<id>|ANGLE|<0-180>  # Switch para ângulo específico
CMD|SWITCH|<id>|STATUS         # Solicitar status do switch
CMD|SWITCH|<id>|RESET          # Resetar para centro (90°)
```

- `<id>`: 1 a 4
- Todas as mensagens terminam com `\n`

### Enviado (respostas)

```
ACK|SWITCH|<id>|<estado>                    # Confirmação
STATUS|SWITCH|<id>|<angulo>|<estado>|<ts>   # Status completo
ERR|<codigo_erro>                           # Erro
```

### Estados possíveis

| Estado | Condição |
|--------|----------|
| `LEFT` | Ângulo <= 10° |
| `RIGHT` | Ângulo >= 170° |
| `CENTER` | Ângulo entre 85° e 95° |
| `TRANSITION` | Qualquer outro ângulo |

### Códigos de erro

| Código | Significado |
|--------|-------------|
| `INVALID_PREFIX` | Mensagem não começa com `CMD\|` |
| `INVALID_FORMAT` | Menos de 4 partes |
| `UNKNOWN_TYPE` | Tipo não é `SWITCH` |
| `INVALID_SWITCH_ID` | ID fora de 1-4 |
| `INVALID_SET_VALUE` | Valor não é LEFT/RIGHT/CENTER |
| `INVALID_ANGLE` | Ângulo fora de 0-180 |
| `UNKNOWN_ACTION` | Ação desconhecida |

## Funcionamento

### Setup
1. Inicializa Serial (debug) e Bluetooth
2. Conecta os 4 servos e move para posição central (90°)
3. Envia status de todos os switches

### Loop (a cada ciclo)
1. **Processa Bluetooth**: Lê caracteres, monta string, processa ao receber `\n`
2. **Atualiza servos**: Move 1 grau por ciclo (a cada 15ms) até atingir o alvo
3. **Heartbeat**: Envia status de todos os switches a cada 5 segundos

### Movimentação Suave
- Servos NÃO pulam direto para o ângulo alvo
- Movem 1 grau por `MOVE_DELAY` (15ms)
- Exemplo: mover de 90° para 0° = 90 passos × 15ms = 1.35 segundos
- Quando atinge o alvo, envia `STATUS` com o estado final

## Sketch: `ferrovia_firmware.ino`

Arquivo único com 256 linhas. Contém:
- Definições de pinos e constantes
- Struct `SwitchState` (currentAngle, targetAngle, moving, lastMove)
- Função `processBluetooth()` — leitura serial
- Função `processCommand()` — parser e execução
- Função `updateServos()` — movimentação suave
- Funções de envio: `sendAck()`, `sendStatus()`, `sendStatusAll()`, `sendError()`
