# Firmware Arduino - Ferrovia v4.0

Controle de 3 switches de ferrovia via Bluetooth (HC-05) com movimentacao suave de servos SG90, indicadores de direcao (LEDs), 7 sensores HW-201 para localizacao da locomotiva e modulo semaforo para cancela.

## Hardware

### Componentes

| Qtde | Componente | Funcao |
|------|------------|--------|
| 1 | Arduino Uno/Nano | Microcontrolador |
| 3 | Servo SG90 180° | Switches (SW1, SW2, SW3) |
| 6 | LED Vermelho 5mm | Indicadores de direcao |
| 7 | Sensor HW-201 | Localizacao da locomotiva |
| 1 | Modulo Semaforo (R/Y/G) | Cancela |
| 1 | Modulo Bluetooth HC-05 | Comunicacao |
| 1 | Protoboard | Montagem |
| Varios | Resistores 220Ω | Protecao dos LEDs |
| Varios | Jumpers | Conexoes |

### Mapa de Pinos

```
Arduino Uno
+-----------------------------------------------------+
| D0  ---- HC-05 TX           (Serial RX)             |
| D1  ---- HC-05 RX           (Serial TX)*            |
| D2  ---- Servo SW1                                   |
| D3  ---- Servo SW2                                   |
| D4  ---- Servo SW3                                   |
| D5  ---- LED SW1/SW2 Esquerda (compartilhado)       |
| D6  ---- LED SW1/SW2 Direita  (compartilhado)       |
| D7  ---- LED SW3 Esquerda                           |
| D8  ---- LED SW3 Direita                            |
| D9  ---- Semaforo VERMELHO (R)                      |
| D10 ---- Semaforo AMARELO (Y)                       |
| D11 ---- Semaforo VERDE (G)                         |
| D12 ---- Sensor S1 (HW-201)                         |
| D13 ---- Sensor S2 (HW-201)                         |
| A0  ---- Sensor S3 (HW-201)                         |
| A1  ---- Sensor S4 (HW-201)                         |
| A2  ---- Sensor S5 (HW-201)                         |
| A3  ---- Sensor S6 (HW-201)                         |
| A4  ---- Sensor S7 (HW-201)                         |
| 5V  ---- VCC (servos + sensores)                    |
| GND ---- GND comum                                  |
+-----------------------------------------------------+
* Desconectar ao programar via USB
```

## Ligacoes Detalhadas

### Servos SG90 (D2, D3, D4)

| Componente | Pino Arduino | Observacao |
|------------|--------------|------------|
| Servo SW1  | D2           | Switch 1   |
| Servo SW2  | D3           | Switch 2   |
| Servo SW3  | D4           | Switch 3   |

```
Pino Servo    Arduino
  VCC    --->  5V (ou fonte externa)
  GND    --->  GND
  Signal --->  D2/D3/D4
```

### LEDs Indicadores de Direcao (D5 a D8)

LEDs compartilhados para SW1/SW2, independentes para SW3:

| Funcao | Pino Arduino | Observacao |
|--------|--------------|------------|
| LED SW1/SW2 Esquerda | D5 | Compartilhado |
| LED SW1/SW2 Direita  | D6 | Compartilhado |
| LED SW3 Esquerda     | D7 | Independente |
| LED SW3 Direita      | D8 | Independente |

```
Circuito de cada LED:
Pino Arduino -> Resistor 220ohm -> Anodo (+) LED -> Catodo (-) -> GND
```

### Modulo Semaforo (D9, D10, D11)

| Cor | Pino Arduino | Funcao |
|-----|--------------|--------|
| Vermelho (R) | D9 | Cancela fechada |
| Amarelo (Y)  | D10 | Cancela fechando/abrindo |
| Verde (G)    | D11 | Cancela aberta |

```
Modulo Semaforo    Arduino
  R         --->   D9
  Y         --->   D10
  G         --->   D11
  GND       --->   GND
```

### Sensores HW-201 (D12, D13, A0-A4)

| Sensor | Pino Arduino | Funcao |
|--------|--------------|--------|
| S1     | D12          | Localizacao |
| S2     | D13          | Localizacao |
| S3     | A0           | Localizacao |
| S4     | A1           | Localizacao |
| S5     | A2           | Localizacao |
| S6     | A3           | Localizacao |
| S7     | A4           | Localizacao |

```
Modulo HW-201    Arduino
  VCC       --->   5V
  GND       --->   GND
  OUT       --->   D12-D13 / A0-A4

Logica: LOW = locomotiva detectada
        HIGH = sem deteccao
```

### Bluetooth HC-05 (D0, D1)

| Pino HC-05 | Pino Arduino | Funcao |
|------------|--------------|--------|
| TX         | D0           | Serial RX (receber dados) |
| RX         | D1           | Serial TX (enviar dados) |

**IMPORTANTE**: Desconectar os pinos D0/D1 do HC-05 ao carregar o sketch via USB!

### Alimentacao

| Componente | Alimentacao | Observacao |
|------------|-------------|------------|
| Arduino    | USB ou 7-12V | Vin ou USB |
| Servos     | 5V externa | NAO usar do Arduino (muita corrente) |
| HC-05      | 5V | Pode usar do Arduino |
| Semaforo   | 5V | Pode usar do Arduino |
| Sensores   | 5V | Pode usar do Arduino |
| LEDs       | 5V via resistores | Pode usar do Arduino |
| GND comum  | GND | Arduino + servos + HC-05 + LEDs + sensores |

## Funcionamento

### Indicadores de Direcao (LEDs)

| Angulo do Servo | LED Esquerda | LED Direita | Significado |
|-----------------|--------------|-------------|-------------|
| LEFT (0°)       | ✅ Aceso     | ❌ Apagado  | Locomotiva vai para linha esquerda |
| RIGHT (180°)    | ❌ Apagado   | ✅ Aceso    | Locomotiva vai para linha direita |
| CENTER (90°)    | ❌ Apagado   | ❌ Apagado  | Neutro |

**LEDs Compartilhados**: SW1 e SW2 usam os mesmos LEDs (D5 e D6) pois sempre movem na mesma direcao.

### Semaforo da Cancela

| Sensor Detectado | Semaforo | Acao |
|------------------|----------|------|
| S1, S2, S3 | Verde | Locomotiva longe - cancela aberta |
| S4 | Amarelo (pisca) | Locomotiva aproximando - cancela fechando |
| S5, S6 | Vermelho | Locomotiva na cancela - cancela fechada |
| S7 | Verde (pisca 3x) | Locomotiva saiu - cancela abrindo |

### Localizacao da Locomotiva

Os 7 sensores HW-201 sao distribuidos pelo ferrorama para rastrear a posicao da locomotiva:

```
Ferrorama (vista superior):

    [S1]----[SW1]----[S2]----[SW2]----[S3]
      |                    |                    |
    [S4]                 [S5]                 [S6]
      |                    |                    |
      +--------------------+--------------------+
                           |
                      [CANCELA]
                    [S7] [SEMAFORO]
                           |
                    [LOCOMOTIVA]
```

## Protocolo de Comandos

### Recebido (via Bluetooth Serial)

```
CMD|SWITCH|<id>|SET|LEFT       # Switch para esquerda (0°)
CMD|SWITCH|<id>|SET|RIGHT      # Switch para direita (180°)
CMD|SWITCH|<id>|SET|CENTER     # Switch para centro (90°)
CMD|SWITCH|<id>|ANGLE|<0-180>  # Switch para angulo especifico
CMD|SWITCH|<id>|STATUS         # Solicitar status do switch
CMD|SWITCH|<id>|RESET          # Resetar para centro (90°)
CMD|GATE|OPEN                  # Cancela aberta (verde)
CMD|GATE|CLOSE                 # Cancela fechada (vermelho)
```

- `<id>`: 1 a 3 (para switches)
- Todas as mensagens terminam com `\n`

### Enviado (respostas)

```
ACK|SWITCH|<id>|<estado>                    # Confirmacao
STATUS|SWITCH|<id>|<angulo>|<estado>|<ts>   # Status completo
EVENT|SENSOR|<id>|<DETECTED|CLEAR>|<ts>     # Evento de sensor
EVENT|GATE|<GREEN|YELLOW|RED>|<ts>          # Evento do semaforo
STATUS|SENSOR|<id>|<DETECTED|CLEAR>|<ts>    # Status do sensor
STATUS|GATE|<GREEN|YELLOW|RED|OPENING|CLOSING> # Status semaforo
```

### Estados dos Servos

| Estado | Condicao |
|--------|----------|
| `LEFT` | Angulo <= 10° |
| `RIGHT` | Angulo >= 170° |
| `CENTER` | Angulo entre 85° e 95° |
| `TRANSITION` | Qualquer outro angulo |

## Versoes

- **v4.0** - Arquitetura atualizada: 3 servos, 6 LEDs (4 pinos), 7 sensores HW-201, semaforo
- **v3.2** - Pinagem reorganizada (servos D2-D5, LEDs D6-D13)
- **v3.1** - Indicador de direcao com LEDs (2 por desvio)
- **v3.0** - Sistema de semaforo com LEDs
- **v2.2** - Movimentacao suave de servos
- **v2.0** - Comunicacao Bluetooth
- **v1.0** - Versao inicial
