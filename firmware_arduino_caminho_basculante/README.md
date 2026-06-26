# Firmware Arduino - Caminhão Basculante

Controle RC de um carrinho basculante via Bluetooth (HC-05) com motor DC e 2 servos.

## Hardware

- Arduino Uno/Nano
- 1x Servo de Direção
- 1x Servo de Caçamba
- 1x Motor DC (L298N ou direto)
- 1x Módulo Bluetooth HC-05

## Pinagem

| Componente | Pino Arduino | Função |
|------------|-------------|--------|
| Servo Direção | D5 | Controle de direção (45°-135°) |
| Servo Caçamba | D6 | Subir/descer caçamba (0°-90°) |
| Motor IN1 | D7 | Sentido horário |
| Motor IN2 | D8 | Sentido anti-horário |
| HC-05 TX/RX | Serial (0/1) | Comunicação Bluetooth |
| VCC Servos | 5V externa | Fonte dedicada |
| VCC Motor | Externo | Bateria do carrinho |

**Importante**: O sketch usa a Serial padrão (pins 0/1) para o HC-05. Desconecte o HC-05 ao carregar o sketch.

## Protocolo de Comandos

Recebe caracteres únicos via Serial (Bluetooth):

| Comando | Ação | Detalhes |
|---------|------|----------|
| `F` | Frente | IN1=HIGH, IN2=LOW |
| `B` | Ré | IN1=LOW, IN2=HIGH |
| `S` | Parar | IN1=LOW, IN2=LOW |
| `L` | Esquerda | Servo direção → 135° |
| `R` | Direita | Servo direção → 45° |
| `C` | Centro | Servo direção → 90° |
| `U` | Subir caçamba | Servo caçamba 0° → 90° gradual |
| `D` | Descer caçamba | Servo caçamba 90° → 0° gradual |

## Funcionamento

### Setup
1. Inicializa Serial a 9600 baud
2. Configura pinos do motor (OUTPUT)
3. Conecta os 2 servos
4. Posiciona direção no centro (90°) e caçamba baixa (0°)

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

## Sketch: `caminhao_basculante_firmware.ino`

Arquivo único com 110 linhas. Contém:
- Definições de pinos
- Variáveis de estado (ângulo direção, ângulo caçamba, comando)
- Funções auxiliares: `pararMotor()`, `subirCacamba()`, `descerCacamba()`
