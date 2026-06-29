# Firmware Arduino - Caminhão Basculante

Controle RC de um carrinho basculante via Bluetooth (HC-05) com 3 servos.

## Hardware

- Arduino Uno/Nano
- 1x Servo de Direção (SG-90)
- 1x Servo de Caçamba (SG-90)
- 1x Servo de Motor - Rotação Contínua (SG-90 ou similar)
- 1x Módulo Bluetooth HC-05

## Pinagem

| Componente | Pino Arduino | Função |
|------------|-------------|--------|
| Servo Direção | D5 | Controle de direção (45°-135°) |
| Servo Caçamba | D6 | Subir/descer caçamba (0°-90°) |
| Servo Motor | D7 | Rotação contínua (0°=ré, 90°=parado, 180°=frente) |
| HC-05 TX/RX | Serial (0/1) | Comunicação Bluetooth |
| VCC Servos | 5V externa | Fonte dedicada (mínimo 1A para 3 servos) |

**Importante**: O sketch usa a Serial padrão (pins 0/1) para o HC-05. Desconecte o HC-05 ao carregar o sketch.

## Protocolo de Comandos

Recebe caracteres únicos via Serial (Bluetooth):

| Comando | Ação | Detalhes |
|---------|------|----------|
| `F` | Frente | Servo motor → 180° (velocidade máx.) |
| `B` | Ré | Servo motor → 0° (velocidade máx.) |
| `S` | Parar | Servo motor → 90° (neutro) |
| `L` | Esquerda | Servo direção → 135° |
| `R` | Direita | Servo direção → 45° |
| `C` | Centro | Servo direção → 90° |
| `U` | Subir caçamba | Servo caçamba 0° → 90° gradual |
| `D` | Descer caçamba | Servo caçamba 90° → 0° gradual |

## Funcionamento

### Servo de Rotação Contínua

O servo de motor usa rotação contínua (diferente de um servo padrão):

| Posição | Comportamento |
|---------|---------------|
| 0° | Velocidade máxima ré |
| 90° | Parado (neutro) |
| 180° | Velocidade máxima frente |
| Valores intermediários | Velocidade proporcional |

### Setup
1. Inicializa Serial a 9600 baud
2. Conecta os 3 servos
3. Posiciona direção no centro (90°), caçamba baixa (0°) e motor parado (90°)

### Loop
1. Verifica se há dados na Serial
2. Lê caractere e executa ação correspondente

### Caçamba Gradual
- **Subir**: move de `anguloCacamba` até 90°, 1 grau por 15ms
- **Descer**: move de `anguloCacamba` até 0°, 1 grau por 15ms
- Evita trancos no mecanismo

### Direção
- Valores fixos: 45° (direita), 90° (centro), 135° (esquerda)
- Ajustar conforme o mecanismo físico do carrinho

## Consumo de Energia

| Componente | Corrente típica |
|------------|----------------|
| Servo SG-90 (cada) | ~150mA |
| HC-05 | ~40mA |
| Arduino Uno | ~50mA |
| **Total** | **~540mA** |

Use uma fonte externa de **mínimo 1A** para alimentar os 3 servos + Arduino.

## Sketch: `caminhao_basculante_firmware.ino`

Arquivo único com ~100 linhas. Contém:
- Definições de pinos (3 servos)
- Variáveis de estado (ângulo direção, ângulo caçamba, comando)
- Funções auxiliares: `subirCacamba()`, `descerCacamba()`
