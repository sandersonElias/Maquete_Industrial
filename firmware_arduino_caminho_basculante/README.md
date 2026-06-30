# Firmware Arduino - Caminhão Basculante

Controle RC de um carrinho basculante via Bluetooth (HC-05) com 3 servos + 4 LEDs.

## Hardware

- Arduino Uno/Nano
- 1x Servo de Direção (SG-90)
- 1x Servo de Caçamba (SG-90)
- 1x Servo de Motor - Rotação Contínua (SG-90 ou similar)
- 4x LEDs (faróis + setas)
- 1x Módulo Bluetooth HC-05

## Pinagem

| Componente | Pino Arduino | Função |
|------------|-------------|--------|
| Servo Direção | D5 | Controle de direção (45°-135°) |
| Servo Caçamba | D6 | Subir/descer caçamba (0°-90°) |
| Servo Motor | D7 | Rotação contínua (0°=ré, 90°=parado, 180°=frente) |
| Farol Esquerdo | D2 | LED |
| Farol Direito | D3 | LED |
| Seta Esquerda | D8 | LED |
| Seta Direita | D9 | LED |
| HC-05 TX→RX | Serial (0/1) | Comunicação Bluetooth 9600 baud |

**Importante**: O sketch usa a Serial padrão (pins 0/1) para o HC-05. Desconecte o HC-05 ao carregar o sketch.

## Protocolo de Comandos

### Movimentação (simples ou compostos)

| Comando | Ação | Detalhes |
|---------|------|----------|
| `F` | Frente | Servo motor → 180° |
| `B` | Ré | Servo motor → 0° |
| `S` | Parar motor | Servo motor → 90° |
| `L` | Esquerda | Servo direção → 135° |
| `R` | Direita | Servo direção → 45° |
| `C` | Centro | Servo direção → 90° |
| `FL` | Frente + Esquerda | Motor + direção simultâneos |
| `FR` | Frente + Direita | Motor + direção simultâneos |
| `BL` | Ré + Esquerda | Motor + direção simultâneos |
| `BR` | Ré + Direita | Motor + direção simultâneos |
| `SC` | Parada total | Motor para + direção centro |

### Caçamba

| Comando | Ação | Detalhes |
|---------|------|----------|
| `U` | Subir | Caçamba 0° → 90° (não-bloqueante) |
| `D` | Descer | Caçamba 90° → 0° (não-bloqueante) |
| `X` | Parar | Congelca caçamba na posição atual |

### Iluminação

| Comando | Ação |
|---------|------|
| `HH` | Toggle faróis (ligar/desligar) |
| `TI` | Seta esquerda ligar |
| `TO` | Seta direita ligar |
| `TX` | Desligar todas as setas |

## Funcionamento

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

### ACK

O Arduino envia confirmação de cada comando recebido:
```
ACK|TRUCK|<comando>|OK
```

### Debug Serial

O firmware imprime no Serial Monitor (9600 baud):
- `RX: <comando>` — comando recebido
- `ACK|TRUCK|<comando>|OK` — confirmação enviada
- `=== CAMINHAO BASCULANTE v2.0 ===` — mensagem de boot

## Consumo de Energia

| Componente | Corrente típica |
|------------|----------------|
| Servo SG-90 (cada) | ~150mA |
| HC-05 | ~40mA |
| Arduino Uno | ~50mA |
| LEDs (4x) | ~80mA |
| **Total** | **~620mA** |

Use uma fonte externa de **mínimo 1A** para alimentar os 3 servos + Arduino.
