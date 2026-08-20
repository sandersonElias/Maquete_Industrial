# Firmware Arduino - Caminhao Basculante

Controle RC de um carrinho basculante via Bluetooth (HC-05) com 2 servos + motor DC (L298M) + 4 LEDs.

## Hardware

- Arduino Uno/Nano
- 1x Servo de Direcao (SG-90)
- 1x Servo de Cacamba (SG-90)
- 1x Motor DC 5V + Placa L298M
- 4x LEDs (2 farois + 2 setas)
- 1x Modulo Bluetooth HC-05
- Fonte externa 5V (minimo 1A)
- Bateria para motor DC (via L298M)

## Pinagem

### Servos

| Componente    | Pino Arduino | Funcao               | Faixa         |
| ------------- | ------------ | -------------------- | ------------- |
| Servo Direcao | D5           | Controle de direcao  | 45-135 graus  |
| Servo Cacamba | D6           | Subir/descer cacamba | 0-90 graus    |

### Motor DC (via L298M)

> **Atencao:** A biblioteca `Servo.h` toma conta do Timer 1 do ATMega. Os pinos D9 e D10 tambem dependem do Timer 1 / Timer 2, o que pode causar resets espurios do Arduino quando os servos se movimentam simultaneamente. Por isso IN1/IN2 e as setas usam pinos fora da regiao de conflito (D12/D13 e D4/D7).

| Componente | Pino Arduino | Funcao                    |
| ---------- | ------------ | ------------------------- |
| L298M IN1  | D12          | Direcao do motor (frente) |
| L298M IN2  | D13          | Direcao do motor (re)     |
| L298M ENA  | Jumper 5V    | Velocidade constante      |
| L298M GND  | GND          | Comum com Arduino         |
| L298M 12V  | Bateria      | Alimentacao do motor      |
| L298M Motor| Saida A      | Motor DC conectado aqui   |

### LEDs

| Componente     | Pino Arduino | Funcao               |
| -------------- | ------------ | -------------------- |
| Farol Esquerdo | D2           | Iluminacao frontal   |
| Farol Direito  | D3           | Iluminacao frontal   |
| Seta Esquerda  | D4           | Indicador de direcao |
| Seta Direita   | D7           | Indicador de direcao |

### Bluetooth

| Componente    | Pino Arduino | Observacao |
| ------------- | ------------ | ---------- |
| HC-05 TX -> RX | D0           | Serial RX  |
| HC-05 RX -> TX | D1           | Serial TX  |

### Alimentacao

| Componente | Alimentacao       | Observacao                           |
| ---------- | ----------------- | ------------------------------------ |
| Arduino    | USB ou 7-12V      | Vin ou USB                           |
| Servos     | 5V externa        | NAO usar do Arduino (muita corrente) |
| Motor DC   | 12V via L298M     | Bateria separada                     |
| HC-05      | 5V                | Pode usar do Arduino                 |
| LEDs       | 5V via resistores | Pode usar do Arduino                 |
| GND comum  | GND               | Arduino + servos + L298M + HC-05    |

**Importante**: Desconecte os pinos RX/TX do HC-05 ao carregar o sketch via USB.

## Diagrama de Conexoes

```
                    Arduino Uno
                    +-----------+
                    |      D0   |---- HC-05 TX (RX Serial)
                    |      D1   |---- HC-05 RX (TX Serial)
                    |      D2   |---- Farol Esquerdo (LED)
                    |      D3   |---- Farol Direito (LED)
                    |      D4   |---- Seta Esquerda (LED)
              Servo |      D5   |---- Servo Direcao
              Dir.  |      D6   |---- Servo Cacamba
              Servo |      D7   |---- Seta Direita (LED)
              Cac.  |      D8   |
                    |      D9   |
                    |      D10  |
                    |      D11  |
              L298M |      D12  |---- IN1 (Motor Frente)
              L298M |      D13  |---- IN2 (Motor Re)
                    |           |
                    |      5V   |---- VCC HC-05
                    |      GND  |---- GND Comum
                    |      Vin  |---- Alimentacao externa 7-12V
                    +-----------+

                    L298M Driver
                    +-----------+
              IN1 --| D12       |---- Motor DC (Saida A)
              IN2 --| D13       |
             GND  --| GND       |---- GND Arduino
             12V  --| 12V       |---- Bateria
              ENA --| 5V (jump) |---- Velocidade constante
                    +-----------+
```

## Protocolo de Comandos

### Movimentacao (simples ou compostos)

| Comando | Acao              | Detalhes                    |
| ------- | ----------------- | --------------------------- |
| `F`     | Frente            | IN1=HIGH, IN2=LOW           |
| `B`     | Re                | IN1=LOW, IN2=HIGH           |
| `S`     | Parar motor       | IN1=LOW, IN2=LOW            |
| `L`     | Esquerda          | Servo direcao -> 120 graus  |
| `R`     | Direita           | Servo direcao -> 60 graus   |
| `C`     | Centro            | Servo direcao -> 90 graus   |
| `FL`    | Frente + Esquerda | Motor + direcao simultaneos  |
| `FR`    | Frente + Direita  | Motor + direcao simultaneos  |
| `BL`    | Re + Esquerda     | Motor + direcao simultaneos  |
| `BR`    | Re + Direita      | Motor + direcao simultaneos  |
| `SC`    | Parada total      | Motor para + direcao centro  |

### Cacamba

| Comando | Acao   | Detalhes                          |
| ------- | ------ | --------------------------------- |
| `U`     | Subir  | Cacamba 0 -> 90 (nao-bloqueante)  |
| `D`     | Descer | Cacamba 90 -> 0 (nao-bloqueante)  |
| `X`     | Parar  | Congela cacamba na posicao atual  |

### Iluminacao

| Comando | Acao                           |
| ------- | ------------------------------ |
| `HH`    | Toggle farois (ligar/desligar) |
| `TI`    | Seta esquerda piscar           |
| `TO`    | Seta direita piscar            |
| `TX`    | Desligar todas as setas        |
| `HA`    | Pisca-alerta (toggle)          |

### Respostas

```
ACK|TRUCK|<comando>|OK
```

## Funcionamento

### Setup

1. Inicializa Serial (9600 baud) e Bluetooth
2. Configura pinos dos LEDs como OUTPUT
3. Configura L298M (IN1, IN2 como OUTPUT)
4. Conecta os 2 servos
5. Posicao inicial: direcao centro (90), cacamba baixa (0), motor parado
6. LEDs desligados

### Loop (a cada ciclo)

1. **Processa Bluetooth**: Le caracteres, monta string, processa ao receber `\n`
2. **Atualiza cacamba**: Move 1 grau por ciclo (a cada 15ms) - nao-bloqueante
3. **Atualiza pisca**: Alterna LEDs das setas a cada 500ms - nao-bloqueante

### Cacamba Nao-Bloqueante

A cacamba usa `millis()` ao inves de `delay()`, permitindo que o Arduino processe novos comandos BT enquanto a cacamba se move:

- Move 1 grau a cada 15ms
- Nao bloqueia o `loop()`
- Pode ser interrompida a qualquer momento (comando `X`)

### Pisca das Setas

Setas e pisca-alerta usam `millis()` para piscar sem bloquear:

- Intervalo: 500ms (0.5s)
- `TI`: Seta esquerda pisca
- `TO`: Seta direita pisca
- `HA`: Ambas piscam juntos (pisca-alerta)
- `TX`: Desliga e reseta estado

### Comandos Compostos

O firmware suporta comandos de 1 ou 2 caracteres:

- **1o caractere**: motor (F/B/S) ou direcao (L/R/C)
- **2o caractere**: direcao (L/R/C) - opcional

Exemplo: `FL` = motor frente + direcao esquerda

### Debug Serial

O firmware imprime no Serial Monitor (9600 baud):

- `=== CAMINHAO BASCULANTE v2.0 ===` - mensagem de boot
- `RX: <comando>` - comando recebido
- `ACK|TRUCK|<comando>|OK` - confirmacao enviada

## Consumo de Energia

| Componente         | Corrente tipica |
| ------------------ | --------------- |
| Servo SG-90 (2x)  | ~300mA          |
| Motor DC           | ~500mA          |
| L298M              | ~50mA           |
| HC-05              | ~40mA           |
| Arduino Uno        | ~50mA           |
| LEDs (4x)          | ~80mA           |
| **Total**          | **~1020mA**     |

Use uma fonte externa de **minimo 1A** para servos + Arduino.
Bateria separada para motor DC via L298M.

## Troubleshooting: resets espurios e lixo no Serial

Sintomas (Serial Monitor do Arduino):
- Mensagem `=== CAMINHAO BASCULANTE v2.0 ===` aparece no meio de comandos
- Caracteres estranhos misturados (`^M`, `^I`, `�`, `@@@@@@@`)
- Comandos perdidos / nao confirmados por `ACK`

Causas + correcoes adotadas neste firmware:

1. **Conflito de Timer (Servo vs PWM)**: a biblioteca `Servo.h` desabilita o Timer 1 do ATMega. Os pinos **D9 e D10** usam o mesmo Timer (`TIMER1` e `TIMER2`). Pilotar PWM ali com servos anexados pode gerar instabilidade e reset. **Correcao:** trocamos D9/D10 por D4 e D7 (setas) e D12/D13 (motor). Apenas pinos digitais puros, fora do conflito.

2. **Brownout por pico de corrente no boot**: quando o Arduino liga com servos ja demandando corrente, a tensao pode cair abaixo de 2.7V e a placa reseta. **Correcao:** `delay(300)` no inicio do `setup()` e sequencia (pinos em LOW antes de anexar servos).

3. **Lixo binario via BT apos reset**: pacotes BT em transito sao parcialmente corrompidos apos um reset. Filtros no `loop()` descartam bytes fora da faixa ASCII 32-126 e limitam o buffer a 4 caracteres (`MAX_CMD_LEN`).

4. **Reconexao do HC-05**: quando o HC-05 re-emparelha, ele espalha bytes estranhos. Nada a fazer no firmware alem do filtro. Caso persista, cheque a fonte de 5V.

## Versao

- **v2.2** - Correcao de resets espurios (conflito Timer/Servo): pinagem alterada para D4/D7 (setas) e D12/D13 (motor); filtro de lixo binario BT; delay de brownout no boot
- **v2.1** - Motor DC via L298M + pisca-alerta (HA)
- **v2.0** - Comandos compostos (motor + direcao) + LEDs
- **v1.0** - Versao inicial
