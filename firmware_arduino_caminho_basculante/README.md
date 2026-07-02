# Firmware Arduino - Caminhão Basculante

Controle RC de um carrinho basculante via Bluetooth (HC-05) com 3 servos + 4 LEDs.

## Hardware

- Arduino Uno/Nano
- 1x Servo de Direção (SG-90)
- 1x Servo de Caçamba (SG-90)
- 1x Servo de Motor - Rotação Contínua (SG-90 ou similar)
- 4x LEDs (2 faróis + 2 setas)
- 1x Módulo Bluetooth HC-05
- Fonte externa 5V (mínimo 1A)

## Pinagem

### Servos

| Componente | Pino Arduino | Função | Faixa |
|------------|-------------|--------|-------|
| Servo Direção | D5 | Controle de direção | 45°-135° |
| Servo Caçamba | D6 | Subir/descer caçamba | 0°-90° |
| Servo Motor | D7 | Rotação contínua | 0°=ré, 90°=parado, 180°=frente |

### LEDs

| Componente | Pino Arduino | Função |
|------------|-------------|--------|
| Farol Esquerdo | D2 | Iluminação frontal |
| Farol Direito | D3 | Iluminação frontal |
| Seta Esquerda | D8 | Indicador de direção |
| Seta Direita | D9 | Indicador de direção |

### Bluetooth

| Componente | Pino Arduino | Observação |
|------------|-------------|------------|
| HC-05 TX ? RX | D0 | Serial RX |
| HC-05 RX ? TX | D1 | Serial TX |

### Alimentação

| Componente | Alimentação | Observação |
|------------|-------------|------------|
| Arduino | USB ou 7-12V | Vin ou USB |
| Servos | 5V externa | NÃO usar do Arduino (muita corrente) |
| HC-05 | 5V | Pode usar do Arduino |
| LEDs | 5V via resistores | Pode usar do Arduino |
| GND comum | GND | Arduino + servos + HC-05 |

**Importante**: Desconecte os pinos RX/TX do HC-05 ao carregar o sketch via USB.

## Diagrama de Ligações

```
                    Arduino Uno
                    +-----------+
                    ¦      D0   ¦---- HC-05 TX (RX Serial)
                    ¦      D1   ¦---- HC-05 RX (TX Serial)
                    ¦      D2   ¦---- Farol Esquerdo (LED)
                    ¦      D3   ¦---- Farol Direito (LED)
              Servo ¦      D4   ¦
              Motor ¦      D5   ¦---- Servo Direção
              Servo ¦      D6   ¦---- Servo Caçamba
              Servo ¦      D7   ¦---- Servo Motor
              Dir.  ¦      D8   ¦---- Seta Esquerda (LED)
              Cac.  ¦      D9   ¦---- Seta Direita (LED)
                    ¦      D10  ¦
                    ¦      D11  ¦
                    ¦      D12  ¦
                    ¦      D13  ¦
                    ¦           ¦
                    ¦      5V   ¦---- VCC HC-05
                    ¦      GND  ¦---- GND Comum
                    ¦      Vin  ¦---- Alimentação externa 7-12V
                    +-----------+
```

## Protocolo de Comandos

### Movimentação (simples ou compostos)

| Comando | Ação | Detalhes |
|---------|------|----------|
| `F` | Frente | Servo motor ? 180° |
| `B` | Ré | Servo motor ? 0° |
| `S` | Parar motor | Servo motor ? 90° |
| `L` | Esquerda | Servo direção ? 120° |
| `R` | Direita | Servo direção ? 60° |
| `C` | Centro | Servo direção ? 90° |
| `FL` | Frente + Esquerda | Motor + direção simultâneos |
| `FR` | Frente + Direita | Motor + direção simultâneos |
| `BL` | Ré + Esquerda | Motor + direção simultâneos |
| `BR` | Ré + Direita | Motor + direção simultâneos |
| `SC` | Parada total | Motor para + direção centro |

### Caçamba

| Comando | Ação | Detalhes |
|---------|------|----------|
| `U` | Subir | Caçamba 0° ? 90° (não-bloqueante) |
| `D` | Descer | Caçamba 90° ? 0° (não-bloqueante) |
| `X` | Parar | Congela caçamba na posição atual |

### Iluminação

| Comando | Ação |
|---------|------|
| `HH` | Toggle faróis (ligar/desligar) |
| `TI` | Seta esquerda ligar |
| `TO` | Seta direita ligar |
| `TX` | Desligar todas as setas |

### Respostas

```
ACK|TRUCK|<comando>|OK
```

## Funcionamento

### Setup
1. Inicializa Serial (9600 baud) e Bluetooth
2. Configura pinos dos LEDs como OUTPUT
3. Conecta os 3 servos
4. Posição inicial: direção centro (90°), caçamba baixa (0°), motor parado (90°)
5. LEDs desligados

### Loop (a cada ciclo)
1. **Processa Bluetooth**: Lê caracteres, monta string, processa ao receber `\n`
2. **Atualiza caçamba**: Move 1 grau por ciclo (a cada 15ms) - não-bloqueante

### Caçamba Não-Bloqueante

A caçamba usa `millis()` ao invés de `delay()`, permitindo que o Arduino processe novos comandos BT enquanto a caçamba se move:

- Move 1 grau a cada 15ms
- Não bloqueia o `loop()`
- Pode ser interrompida a qualquer momento (comando `X`)

### Comandos Compostos

O firmware suporta comandos de 1 ou 2 caracteres:
- **1º caractere**: motor (F/B/S) ou direção (L/R/C)
- **2º caractere**: direção (L/R/C) — opcional

Exemplo: `FL` = motor frente + direção esquerda

### Debug Serial

O firmware imprime no Serial Monitor (9600 baud):
- `=== CAMINHAO BASCULANTE v2.0 ===` — mensagem de boot
- `RX: <comando>` — comando recebido
- `ACK|TRUCK|<comando>|OK` — confirmação enviada

## Consumo de Energia

| Componente | Corrente típica |
|------------|----------------|
| Servo SG-90 (cada) | ~150mA |
| HC-05 | ~40mA |
| Arduino Uno | ~50mA |
| LEDs (4x) | ~80mA |
| **Total** | **~620mA** |

Use uma fonte externa de **mínimo 1A** para alimentar os 3 servos + Arduino.

## Sketch: `caminhao_basculante_firmware.ino`

Arquivo com ~280 linhas. Contém:
- Definições de pinos e constantes
- Variáveis de estado (motor, direção, caçamba, LEDs)
- Função `setup()` — inicialização dos componentes
- Função `loop()` — processamento BT + atualização caçamba
- Função `executarComando()` — parser de comandos
- Funções de atualização: `atualizarMotor()`, `atualizarDirecao()`, `atualizarLEDs()`
- Função `atualizarCacamba()` — movimentação não-bloqueante
- Função `enviarACK()` — confirmação de comandos

## Versão

- **v2.0** - Comandos compostos (motor + direção) + LEDs
- **v1.0** - Versão inicial
